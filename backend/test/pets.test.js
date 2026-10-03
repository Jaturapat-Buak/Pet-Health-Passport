import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

test('owners can manage only their own pets', async (context) => {
  const originalQuery = pool.query;
  const ownerId = '5d4cee48-2eae-4bb5-8443-a4938c404cb8';
  const otherId = '75ba2a93-6228-483b-823c-74a661624abc';
  const vetId = 'fd64ac5b-41eb-4a46-9721-601ddfdf2ac4';
  const firstPetId = '439841f4-d9b8-48c2-8c86-97a82f9833ae';
  const newPetId = 'f43d9018-f8e4-4141-b48c-6bbca1462e8f';
  const users = new Map([
    [ownerId, { id: ownerId, name: 'Owner', email: 'owner@example.com', role: 'owner' }],
    [otherId, { id: otherId, name: 'Other', email: 'other@example.com', role: 'owner' }],
    [vetId, { id: vetId, name: 'Vet', email: 'vet@example.com', role: 'vet' }]
  ]);
  const pets = new Map([
    [firstPetId, { id: firstPetId, owner_id: ownerId, name: 'Milo', species: 'Cat', weight: '4.50' }]
  ]);

  pool.query = async (sql, values) => {
    if (sql.includes('FROM users WHERE id')) {
      return { rows: users.has(values[0]) ? [users.get(values[0])] : [] };
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM pets WHERE owner_id')) {
      return { rows: [...pets.values()].filter((pet) => pet.owner_id === values[0]) };
    }
    if (sql.startsWith('SELECT') && sql.includes('FROM pets WHERE id')) {
      assert.match(sql, /WHERE id = \$1 AND owner_id = \$2/);
      const pet = pets.get(values[0]);
      return { rows: pet?.owner_id === values[1] ? [pet] : [] };
    }
    if (sql.startsWith('INSERT INTO pets')) {
      assert.match(sql, /VALUES \(\$1, \$2, \$3/);
      if (values[8] === 'DUPLICATE') {
        throw Object.assign(new Error('duplicate microchip'), {
          code: '23505', constraint: 'pets_microchip_id_key'
        });
      }
      const pet = { id: newPetId, owner_id: values[0], name: values[1], species: values[2], weight: values[7] };
      pets.set(newPetId, pet);
      return { rows: [pet] };
    }
    if (sql.startsWith('UPDATE pets')) {
      assert.match(sql, /WHERE id = \$1 AND owner_id = \$2/);
      const pet = pets.get(values[0]);
      if (pet?.owner_id !== values[1]) return { rows: [] };
      const updated = { ...pet, name: values[2], species: values[3], weight: values[8] };
      pets.set(values[0], updated);
      return { rows: [updated] };
    }
    if (sql.startsWith('DELETE FROM pets')) {
      assert.match(sql, /WHERE id = \$1 AND owner_id = \$2/);
      const pet = pets.get(values[0]);
      if (pet?.owner_id !== values[1]) return { rows: [] };
      pets.delete(values[0]);
      return { rows: [{ id: values[0] }] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  };

  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}/api/pets`;
  context.after(async () => {
    pool.query = originalQuery;
    await new Promise((resolve) => server.close(resolve));
  });

  const auth = (id) => ({ Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: id })}` });
  const request = (path, id, method = 'GET', body) => fetch(`${base}${path}`, {
    method,
    headers: { ...auth(id), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });

  assert.equal((await fetch(base)).status, 401);
  assert.equal((await request('', vetId)).status, 403);

  const listed = await request('', ownerId);
  assert.equal(listed.status, 200);
  assert.equal((await listed.json()).pets.length, 1);
  assert.equal((await request(`/${firstPetId}`, otherId)).status, 404);
  assert.equal((await request('/not-a-uuid', ownerId)).status, 400);

  const invalid = await request('', ownerId, 'POST', { name: 'Kit', species: 'Cat', weight: -2 });
  assert.equal(invalid.status, 400);
  const invalidDate = await request('', ownerId, 'POST', { name: 'Kit', species: 'Cat', birth_date: '2026-02-30' });
  assert.equal(invalidDate.status, 400);

  const created = await request('', ownerId, 'POST', {
    name: ' Kit ', species: ' Cat ', weight: 0.29, owner_id: otherId
  });
  assert.equal(created.status, 201);
  const createdPet = (await created.json()).pet;
  assert.equal(createdPet.owner_id, ownerId);
  assert.equal(createdPet.name, 'Kit');
  assert.equal(createdPet.weight, 0.29);

  const duplicate = await request('', ownerId, 'POST', {
    name: 'Kit', species: 'Cat', microchip_id: 'DUPLICATE'
  });
  assert.equal(duplicate.status, 409);

  assert.equal((await request(`/${newPetId}`, ownerId)).status, 200);
  assert.equal((await request(`/${newPetId}`, otherId, 'PUT', { name: 'Changed', species: 'Cat' })).status, 404);
  const updated = await request(`/${newPetId}`, ownerId, 'PUT', { name: 'Kitty', species: 'Cat' });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).pet.name, 'Kitty');

  assert.equal((await request(`/${newPetId}`, otherId, 'DELETE')).status, 404);
  assert.equal((await request(`/${newPetId}`, ownerId, 'DELETE')).status, 204);
  assert.equal((await request(`/${newPetId}`, ownerId)).status, 404);
});

