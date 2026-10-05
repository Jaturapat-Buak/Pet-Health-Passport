import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

test('owners control vet access and revoked vets cannot read or write records', async (context) => {
  const originalQuery = pool.query;
  const ownerId = '5d4cee48-2eae-4bb5-8443-a4938c404cb8';
  const otherId = '75ba2a93-6228-483b-823c-74a661624abc';
  const vetId = 'fd64ac5b-41eb-4a46-9721-601ddfdf2ac4';
  const petId = '439841f4-d9b8-48c2-8c86-97a82f9833ae';
  const users = new Map([
    [ownerId, { id: ownerId, role: 'owner', name: 'Owner' }],
    [otherId, { id: otherId, role: 'owner', name: 'Other' }],
    [vetId, { id: vetId, role: 'vet', name: 'Vet', email: 'vet@example.com' }]
  ]);
  let shared = false;
  let medicalRecords = [];

  pool.query = async (sql, values) => {
    if (sql.includes('FROM users WHERE id')) return { rows: [users.get(values[0])].filter(Boolean) };
    if (sql.startsWith('INSERT INTO pet_vet_access')) {
      if (values[0] !== petId || values[1] !== ownerId || values[2].toLowerCase() !== 'vet@example.com' || shared) return { rows: [] };
      shared = true;
      return { rows: [{ vet_id: vetId }] };
    }
    if (sql.startsWith('DELETE FROM pet_vet_access')) {
      if (values[0] !== petId || values[1] !== ownerId || values[2] !== vetId || !shared) return { rows: [] };
      shared = false;
      return { rows: [{ vet_id: vetId }] };
    }
    if (sql.includes('FROM pet_vet_access a') && sql.includes('JOIN users u') && sql.includes('JOIN pets p')) {
      return { rows: shared && values[0] === petId && values[1] === ownerId ? [users.get(vetId)] : [] };
    }
    if (sql.includes('FROM pet_vet_access a') && sql.includes('JOIN pets p') && sql.includes('WHERE a.vet_id = $1')) {
      return { rows: shared && values[0] === vetId ? [{ id: petId, name: 'Milo' }] : [] };
    }
    if (sql.includes('FROM pets p') && sql.includes('JOIN pet_vet_access a')) {
      return { rows: shared && values[0] === petId && values[1] === vetId ? [{ id: petId, name: 'Milo' }] : [] };
    }
    if (sql.startsWith('SELECT 1 FROM pet_vet_access')) {
      return { rows: shared && values[0] === petId && values[1] === vetId ? [{ '?column?': 1 }] : [] };
    }
    if (sql.startsWith('SELECT r.* FROM medical_records')) {
      return { rows: shared && values[0] === petId && values[1] === vetId ? medicalRecords : [] };
    }
    if (sql.startsWith('INSERT INTO medical_records')) {
      assert.match(sql, /FROM pet_vet_access a/);
      if (!shared || values[0] !== petId || values[1] !== vetId) return { rows: [] };
      const record = { id: 'a7c350bd-46a4-480c-bcc6-a9f20e8dbbe3', pet_id: petId, visit_date: values[2] };
      medicalRecords = [record];
      return { rows: [record] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  };

  const server = app.listen(0);
  context.after(async () => {
    pool.query = originalQuery;
    await new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = (path, id, method = 'GET', body) => fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: id })}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });

  assert.equal((await request(`/vet/pets/${petId}`, vetId)).status, 404);
  assert.equal((await request(`/pets/${petId}/vets`, otherId, 'POST', { email: 'vet@example.com' })).status, 404);
  assert.equal((await request(`/pets/${petId}/vets`, ownerId, 'POST', { email: 'owner@example.com' })).status, 404);
  assert.equal((await request(`/pets/${petId}/vets`, ownerId, 'POST', { email: 'vet@example.com' })).status, 201);
  assert.equal((await request(`/pets/${petId}/vets`, ownerId, 'POST', { email: 'vet@example.com' })).status, 404);
  assert.equal((await request(`/pets/${petId}/vets`, vetId)).status, 403);
  assert.equal((await request(`/vet/pets/${petId}`, ownerId)).status, 403);
  assert.equal((await request(`/vet/pets/${petId}`, vetId)).status, 200);
  assert.equal((await request('/vet/pets', vetId)).status, 200);
  assert.equal((await request(`/vet/pets/${petId}/medical-records`, vetId, 'POST', {})).status, 400);
  assert.equal((await request(`/vet/pets/${petId}/medical-records`, vetId, 'POST', { visit_date: '2026-10-05', diagnosis: 'Checkup' })).status, 201);
  const records = await request(`/vet/pets/${petId}/medical-records`, vetId);
  assert.equal((await records.json()).records.length, 1);
  assert.equal((await request(`/pets/${petId}/vets/${vetId}`, ownerId, 'DELETE')).status, 204);
  assert.equal((await request(`/vet/pets/${petId}`, vetId)).status, 404);
  assert.equal((await request(`/vet/pets/${petId}/medical-records`, vetId, 'POST', { visit_date: '2026-10-05' })).status, 404);
  assert.equal((await request(`/vet/pets/${petId}/medical-records`, vetId)).status, 404);
  assert.equal((await request(`/pets/${petId}/vets/${vetId}`, ownerId, 'DELETE')).status, 404);
});
