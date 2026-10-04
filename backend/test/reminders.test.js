import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

test('reminders derive from care dates and retain read state per owner and date', async (context) => {
  const originalQuery = pool.query;
  const ownerId = '5d4cee48-2eae-4bb5-8443-a4938c404cb8';
  const otherId = '75ba2a93-6228-483b-823c-74a661624abc';
  const vetId = 'fd64ac5b-41eb-4a46-9721-601ddfdf2ac4';
  const petId = '439841f4-d9b8-48c2-8c86-97a82f9833ae';
  const sources = [
    { source_id: '010e4d26-78ca-4ec4-8bb2-70895ab8d19c', pet_id: petId, pet_name: 'Milo', type: 'appointment', reminder_date: '2026-10-10', event_at: '2026-10-10T03:00:00.000Z', label: 'Checkup' },
    { source_id: '1b63fe82-3bdc-4d4f-83d9-cff7bc4e7603', pet_id: petId, pet_name: 'Milo', type: 'vaccination', reminder_date: '2026-10-08', label: 'Rabies' },
    { source_id: '3c030753-0fe8-4a7a-b322-3ff259240801', pet_id: petId, pet_name: 'Milo', type: 'medication', reminder_date: '2026-10-09', label: 'Antibiotic' },
    { source_id: '440765e0-3b34-4a15-8f10-357343b6e45b', pet_id: petId, pet_name: 'Milo', type: 'follow_up', reminder_date: '2026-10-07', label: 'Check' }
  ];
  const reads = new Set();
  pool.query = async (sql, values) => {
    if (sql.includes('FROM users WHERE id')) return { rows: [{ id: values[0], role: values[0] === vetId ? 'vet' : 'owner' }] };
    if (sql.includes('UNION ALL')) {
      assert.match(sql, /p.owner_id = \$1/);
      assert.match(sql, /a.status = 'upcoming'/);
      assert.match(sql, /m.status = 'active'/);
      return { rows: values[0] === ownerId ? sources : [] };
    }
    if (sql.startsWith('SELECT id, is_read FROM reminders')) {
      assert.equal(values[0], ownerId);
      return { rows: values[1].filter((id) => reads.has(id)).map((id) => ({ id, is_read: true })) };
    }
    if (sql.startsWith('INSERT INTO reminders')) {
      assert.equal(values[1], ownerId);
      reads.add(values[0]);
      return { rows: [] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  };

  const server = app.listen(0);
  context.after(async () => {
    pool.query = originalQuery;
    await new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}/api/reminders`;
  const auth = (id) => ({ Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: id })}` });
  const request = (path, id, method = 'GET') => fetch(`${base}${path}`, { method, headers: auth(id) });

  assert.equal((await fetch(base)).status, 401);
  assert.equal((await request('', vetId)).status, 403);
  assert.deepEqual((await (await request('', otherId)).json()).reminders, []);
  const first = (await (await request('', ownerId)).json()).reminders;
  assert.equal(first.length, 4);
  assert.deepEqual(first.map((item) => item.type), ['follow_up', 'vaccination', 'medication', 'appointment']);
  assert.ok(first.every((item) => !item.is_read));
  const id = first[0].id;
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  assert.equal((await request('/invalid/read', ownerId, 'PATCH')).status, 400);
  const otherRead = await request(`/${id}/read`, otherId, 'PATCH');
  assert.equal(otherRead.status, 404, JSON.stringify(await otherRead.json()));
  assert.equal((await request(`/${id}/read`, ownerId, 'PATCH')).status, 200);
  const again = (await (await request('', ownerId)).json()).reminders;
  assert.equal(again[0].id, id);
  assert.equal(again[0].is_read, true);
  sources[3] = { ...sources[3], reminder_date: '2026-10-11' };
  const moved = (await (await request('', ownerId)).json()).reminders.find((item) => item.type === 'follow_up');
  assert.notEqual(moved.id, id);
  assert.equal(moved.is_read, false);
  const appointmentId = first.find((item) => item.type === 'appointment').id;
  sources[0] = { ...sources[0], event_at: '2026-10-10T04:00:00.000Z' };
  const rescheduled = (await (await request('', ownerId)).json()).reminders.find((item) => item.type === 'appointment');
  assert.notEqual(rescheduled.id, appointmentId);
  assert.equal(rescheduled.is_read, false);
});
