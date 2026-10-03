import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

test('health records validate input and stay within the pet owner account', async (context) => {
  const originalQuery = pool.query;
  const ownerId = '5d4cee48-2eae-4bb5-8443-a4938c404cb8';
  const otherId = '75ba2a93-6228-483b-823c-74a661624abc';
  const vetId = 'fd64ac5b-41eb-4a46-9721-601ddfdf2ac4';
  const petId = '439841f4-d9b8-48c2-8c86-97a82f9833ae';
  const recordId = 'f43d9018-f8e4-4141-b48c-6bbca1462e8f';
  const users = new Map([
    [ownerId, { id: ownerId, role: 'owner' }],
    [otherId, { id: otherId, role: 'owner' }],
    [vetId, { id: vetId, role: 'vet' }]
  ]);
  const saved = new Map();

  pool.query = async (sql, values) => {
    if (sql.includes('FROM users WHERE id')) return { rows: users.has(values[0]) ? [users.get(values[0])] : [] };
    if (sql.startsWith('SELECT id FROM pets')) return { rows: values[0] === petId && values[1] === ownerId ? [{ id: petId }] : [] };
    if (sql.startsWith('SELECT * FROM')) return { rows: saved.get(sql.match(/FROM (\w+)/)[1]) ?? [] };
    if (sql.startsWith('INSERT INTO')) {
      assert.match(sql, /FROM pets WHERE id = \$1 AND owner_id = \$\d+ RETURNING \*/);
      if (values[0] !== petId || values.at(-1) !== ownerId) return { rows: [] };
      const table = sql.match(/INSERT INTO (\w+)/)[1];
      const record = { id: recordId, pet_id: petId };
      saved.set(table, [record]);
      return { rows: [record] };
    }
    if (sql.startsWith('UPDATE')) {
      assert.match(sql, /pet_id IN \(SELECT id FROM pets WHERE owner_id = \$2\)/);
      return { rows: values[0] === recordId && values[1] === ownerId ? [{ id: recordId }] : [] };
    }
    if (sql.startsWith('DELETE')) {
      assert.match(sql, /pet_id IN \(SELECT id FROM pets WHERE owner_id = \$2\)/);
      return { rows: values[0] === recordId && values[1] === ownerId ? [{ id: recordId }] : [] };
    }
    if (sql.includes('JOIN pets p')) {
      assert.match(sql, /p.owner_id = \$2/);
      return { rows: values[0] === recordId && values[1] === ownerId ? [{ id: recordId }] : [] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  };

  const server = app.listen(0);
  context.after(async () => {
    pool.query = originalQuery;
    await new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const request = (url, id, method = 'GET', body) => fetch(`${base}${url}`, {
    method,
    headers: { Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: id })}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });

  const samples = [
    ['vaccinations', { vaccine_name: 'Rabies', date_received: '2026-01-15', next_due_date: '2027-01-15' }],
    ['medical-records', { visit_date: '2026-09-20', diagnosis: 'Checkup' }],
    ['allergies', { allergy_type: 'Food', allergen_name: 'Chicken', severity: 'medium' }],
    ['medications', { medication_name: 'Antibiotic', status: 'active' }],
    ['weights', { weight: 4.5, record_date: '2026-09-20' }]
  ];

  for (const [type, sample] of samples) {
    const listUrl = `/pets/${petId}/${type}`;
    assert.equal((await request(listUrl, otherId)).status, 404);
    assert.equal((await request(listUrl, vetId)).status, 403);
    assert.equal((await request(listUrl, ownerId, 'POST', {})).status, 400);
    assert.equal((await request(listUrl, ownerId, 'POST', sample)).status, 201);
    const list = await request(listUrl, ownerId);
    assert.equal(list.status, 200);
    assert.equal((await list.json()).records.length, 1);
    assert.equal((await request(`/${type}/${recordId}`, otherId)).status, 404);
    assert.equal((await request(`/${type}/${recordId}`, ownerId, 'PUT', sample)).status, 200);
    assert.equal((await request(`/${type}/${recordId}`, otherId, 'DELETE')).status, 404);
    assert.equal((await request(`/${type}/${recordId}`, ownerId, 'DELETE')).status, 204);
  }

  assert.equal((await request(`/pets/${petId}/vaccinations`, ownerId, 'POST', {
    vaccine_name: 'Rabies', date_received: '2026-02-30'
  })).status, 400);
  assert.equal((await request(`/pets/${petId}/vaccinations`, ownerId, 'POST', {
    vaccine_name: 'Rabies', date_received: '2026-01-15', next_due_date: '2025-01-15'
  })).status, 400);
  assert.equal((await request(`/pets/${petId}/allergies`, ownerId, 'POST', {
    allergy_type: 'Food', allergen_name: 'Chicken', severity: 'unknown'
  })).status, 400);
  assert.equal((await request(`/pets/${petId}/weights`, ownerId, 'POST', {
    weight: -1, record_date: '2026-09-20'
  })).status, 400);
});
