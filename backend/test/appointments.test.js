import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

test('appointment CRUD validates input and stays within the owner account', async (context) => {
  const originalQuery = pool.query;
  const ownerId = '5d4cee48-2eae-4bb5-8443-a4938c404cb8';
  const otherId = '75ba2a93-6228-483b-823c-74a661624abc';
  const vetId = 'fd64ac5b-41eb-4a46-9721-601ddfdf2ac4';
  const petId = '439841f4-d9b8-48c2-8c86-97a82f9833ae';
  const appointmentId = 'f43d9018-f8e4-4141-b48c-6bbca1462e8f';
  const users = new Map([
    [ownerId, { id: ownerId, role: 'owner' }],
    [otherId, { id: otherId, role: 'owner' }],
    [vetId, { id: vetId, role: 'vet' }]
  ]);
  let appointment;
  pool.query = async (sql, values) => {
    if (sql.includes('FROM users WHERE id')) return { rows: users.has(values[0]) ? [users.get(values[0])] : [] };
    if (sql.startsWith('SELECT a.*') && sql.includes('WHERE a.id')) {
      assert.match(sql, /a.owner_id = \$2 AND p.owner_id = \$2/);
      return { rows: values[0] === appointmentId && values[1] === ownerId && appointment ? [appointment] : [] };
    }
    if (sql.startsWith('SELECT a.*')) {
      assert.match(sql, /a.owner_id = \$1 AND p.owner_id = \$1/);
      return { rows: values[0] === ownerId && appointment ? [appointment] : [] };
    }
    if (sql.startsWith('INSERT INTO appointments')) {
      assert.match(sql, /FROM pets WHERE id = \$1 AND owner_id = \$2/);
      if (values[0] !== petId || values[1] !== ownerId) return { rows: [] };
      appointment = { id: appointmentId, pet_id: petId, owner_id: ownerId,
        appointment_date: values[2], clinic_name: values[3], purpose: values[4], notes: values[5], status: 'upcoming', pet_name: 'Milo' };
      return { rows: [appointment] };
    }
    if (sql.startsWith('UPDATE appointments SET pet_id')) {
      assert.match(sql, /id = \$1 AND owner_id = \$2/);
      assert.match(sql, /EXISTS \(SELECT 1 FROM pets WHERE id = \$3 AND owner_id = \$2\)/);
      if (values[0] !== appointmentId || values[1] !== ownerId || values[2] !== petId) return { rows: [] };
      appointment = { ...appointment, appointment_date: values[3], clinic_name: values[4], purpose: values[5], notes: values[6] };
      return { rows: [appointment] };
    }
    if (sql.startsWith('UPDATE appointments SET status')) {
      assert.match(sql, /id = \$1 AND owner_id = \$2/);
      if (values[0] !== appointmentId || values[1] !== ownerId) return { rows: [] };
      appointment = { ...appointment, status: values[2] };
      return { rows: [appointment] };
    }
    if (sql.startsWith('DELETE FROM appointments')) {
      assert.match(sql, /id = \$1 AND owner_id = \$2/);
      if (values[0] !== appointmentId || values[1] !== ownerId) return { rows: [] };
      appointment = null;
      return { rows: [{ id: appointmentId }] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  };

  const server = app.listen(0);
  context.after(async () => {
    pool.query = originalQuery;
    await new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}/api/appointments`;
  const request = (path, id, method = 'GET', body) => fetch(`${base}${path}`, {
    method, headers: { Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: id })}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const sample = { pet_id: petId, appointment_date: '2026-10-10T03:00:00.000Z', purpose: 'Follow-up', clinic_name: 'Pet clinic' };

  assert.equal((await fetch(base)).status, 401);
  assert.equal((await request('', vetId)).status, 403);
  assert.equal((await request('?view=unknown', ownerId)).status, 400);
  assert.equal((await request('', ownerId, 'POST', { ...sample, appointment_date: '2026-02-30T10:00:00Z' })).status, 400);
  assert.equal((await request('', ownerId, 'POST', { ...sample, pet_id: 'invalid' })).status, 400);
  assert.equal((await request('', ownerId, 'POST', { ...sample, pet_id: otherId })).status, 404);
  const created = await request('', ownerId, 'POST', sample);
  assert.equal(created.status, 201);
  assert.equal((await created.json()).appointment.purpose, 'Follow-up');
  assert.equal((await request('', ownerId)).status, 200);
  assert.equal((await request('?view=upcoming', ownerId)).status, 200);
  assert.equal((await request(`/${appointmentId}`, otherId)).status, 404);
  assert.equal((await request(`/${appointmentId}`, ownerId)).status, 200);
  assert.equal((await request(`/${appointmentId}`, otherId, 'PUT', sample)).status, 404);
  assert.equal((await request(`/${appointmentId}`, ownerId, 'PUT', { ...sample, purpose: 'Annual checkup' })).status, 200);
  assert.equal((await request(`/${appointmentId}/status`, ownerId, 'PATCH', { status: 'invalid' })).status, 400);
  assert.equal((await request(`/${appointmentId}/status`, otherId, 'PATCH', { status: 'completed' })).status, 404);
  const updated = await request(`/${appointmentId}/status`, ownerId, 'PATCH', { status: 'completed' });
  assert.equal((await updated.json()).appointment.status, 'completed');
  assert.equal((await request(`/${appointmentId}`, otherId, 'DELETE')).status, 404);
  assert.equal((await request(`/${appointmentId}`, ownerId, 'DELETE')).status, 204);
  assert.equal((await request(`/${appointmentId}`, ownerId)).status, 404);
});
