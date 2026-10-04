import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

test('dashboard summaries enforce role and owner boundaries', async (context) => {
  const originalQuery = pool.query;
  const ownerId = '5d4cee48-2eae-4bb5-8443-a4938c404cb8';
  const otherId = '75ba2a93-6228-483b-823c-74a661624abc';
  const vetId = 'fd64ac5b-41eb-4a46-9721-601ddfdf2ac4';
  const adminId = 'a7867022-5b1e-449e-97d3-4141e5007a60';
  const petId = '439841f4-d9b8-48c2-8c86-97a82f9833ae';
  const roles = new Map([[ownerId, 'owner'], [otherId, 'owner'], [vetId, 'vet'], [adminId, 'admin']]);
  const ownerQueries = [];
  pool.query = async (sql, values) => {
    if (sql.includes('FROM users WHERE id')) return { rows: [{ id: values[0], role: roles.get(values[0]) }] };
    if (values?.length === 1) {
      ownerQueries.push(sql);
      assert.ok([ownerId, otherId].includes(values[0]));
      if (sql.includes('SELECT a.id AS source_id')) return { rows: [] };
      if (sql.includes('AS upcoming_appointments')) {
        assert.match(sql, /p.owner_id = \$1/);
        return { rows: [{ pets: values[0] === ownerId ? 1 : 0, upcoming_appointments: 1,
          upcoming_vaccinations: 0, active_medications: 0 }] };
      }
      assert.match(sql, /owner_id = \$1/);
      if (sql.includes('FROM pets\n')) return { rows: values[0] === ownerId ? [{ id: petId, name: 'Milo' }] : [] };
      return { rows: [] };
    }
    if (sql.includes('AS vaccinations,') && sql.includes('AS appointments')) return { rows: [{ users: 4, pets: 1, vaccinations: 1, appointments: 1 }] };
    if (sql.includes('SELECT id, name, email, role, created_at FROM users')) return { rows: [{ id: ownerId, name: 'Owner' }] };
    return { rows: [] };
  };

  const server = app.listen(0);
  context.after(async () => {
    pool.query = originalQuery;
    await new Promise((resolve) => server.close(resolve));
  });
  const base = `http://127.0.0.1:${server.address().port}/api/dashboard`;
  const request = (path, id) => fetch(`${base}${path}`, {
    headers: { Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: id })}` }
  });

  assert.equal((await fetch(`${base}/owner`)).status, 401);
  assert.equal((await request('/owner', vetId)).status, 403);
  assert.equal((await request('/owner', adminId)).status, 403);
  assert.equal((await request('/admin', ownerId)).status, 403);
  assert.equal((await request('/admin', vetId)).status, 403);
  const owner = await request('/owner', ownerId);
  assert.equal(owner.status, 200);
  const ownerData = await owner.json();
  assert.equal(ownerData.stats.pets, 1);
  assert.equal(ownerData.pets[0].name, 'Milo');
  assert.deepEqual(ownerData.reminders, []);
  assert.equal(ownerQueries.length, 8);
  const other = await request('/owner', otherId);
  assert.equal((await other.json()).pets.length, 0);
  const admin = await request('/admin', adminId);
  assert.equal(admin.status, 200);
  const adminData = await admin.json();
  assert.equal(adminData.stats.users, 4);
  assert.equal(adminData.recent_users[0].name, 'Owner');
});
