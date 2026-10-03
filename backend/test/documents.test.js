import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { removeDocumentFile } from '../src/services/document-files.js';

test('owners upload, download, and remove their own documents', async (context) => {
  const originalQuery = pool.query;
  const ownerId = '5d4cee48-2eae-4bb5-8443-a4938c404cb8';
  const otherId = '75ba2a93-6228-483b-823c-74a661624abc';
  const petId = '439841f4-d9b8-48c2-8c86-97a82f9833ae';
  let document;
  pool.query = async (sql, values) => {
    if (sql.includes('FROM users WHERE id')) return { rows: [{ id: values[0], role: 'owner' }] };
    if (sql.startsWith('SELECT id FROM pets')) return { rows: values[0] === petId && values[1] === ownerId ? [{ id: petId }] : [] };
    if (sql.startsWith('INSERT INTO documents')) {
      assert.match(sql, /owner_id = \$5/);
      document = { id: values[0], pet_id: petId, document_type: values[1], title: values[2] };
      return { rows: [document] };
    }
    if (sql.startsWith('SELECT * FROM documents')) return { rows: document ? [document] : [] };
    if (sql.startsWith('SELECT d.* FROM documents')) return { rows: values[1] === ownerId && document ? [document] : [] };
    if (sql.startsWith('DELETE FROM documents')) {
      assert.match(sql, /pet_id IN \(SELECT id FROM pets WHERE owner_id = \$2\)/);
      if (values[1] !== ownerId || !document) return { rows: [] };
      const deleted = document;
      document = null;
      return { rows: [deleted] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  };
  const server = app.listen(0);
  context.after(async () => {
    if (document) await removeDocumentFile(document.id);
    pool.query = originalQuery;
    await new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const auth = (id) => ({ Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: id })}` });
  const form = () => {
    const data = new FormData();
    data.set('title', 'Rabies certificate');
    data.set('document_type', 'vaccination_certificate');
    data.set('file', new Blob([Buffer.from('%PDF-1.4\ntest')], { type: 'application/pdf' }), 'certificate.pdf');
    return data;
  };

  assert.equal((await fetch(`${base}/pets/${petId}/documents`, { method: 'POST', headers: auth(otherId), body: form() })).status, 404);
  const invalid = new FormData();
  invalid.set('title', 'Bad file');
  invalid.set('document_type', 'other');
  invalid.set('file', new Blob(['not a document'], { type: 'text/plain' }), 'file.txt');
  assert.equal((await fetch(`${base}/pets/${petId}/documents`, { method: 'POST', headers: auth(ownerId), body: invalid })).status, 400);

  const created = await fetch(`${base}/pets/${petId}/documents`, { method: 'POST', headers: auth(ownerId), body: form() });
  assert.equal(created.status, 201);
  const id = (await created.json()).record.id;
  const list = await fetch(`${base}/pets/${petId}/documents`, { headers: auth(ownerId) });
  assert.equal((await list.json()).records.length, 1);
  assert.equal((await fetch(`${base}/documents/${id}/file`, { headers: auth(otherId) })).status, 404);
  const file = await fetch(`${base}/documents/${id}/file`, { headers: auth(ownerId) });
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('content-type'), 'application/pdf');
  assert.equal((await file.text()).startsWith('%PDF-'), true);
  assert.equal((await fetch(`${base}/documents/${id}`, { method: 'DELETE', headers: auth(otherId) })).status, 404);
  assert.equal((await fetch(`${base}/documents/${id}`, { method: 'DELETE', headers: auth(ownerId) })).status, 204);
});
