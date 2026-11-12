import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

test('owners cannot create, change, cancel, or delete appointments through the API', async (t) => {
  const original = pool.query;
  const id = '5d4cee48-2eae-4bb5-8443-a4938c404cb8';
  pool.query = async (sql) => {
    assert.ok(sql.includes('FROM users WHERE id'), 'writes must stop at the role guard');
    return { rows: [{ id, role: 'owner' }] };
  };
  const server = app.listen(0);
  t.after(async () => { pool.query = original; await new Promise((resolve) => server.close(resolve)); });
  const base = `http://127.0.0.1:${server.address().port}/api/appointments`;
  const headers = { Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: id })}`, 'Content-Type': 'application/json' };
  for (const [method, path] of [['POST', ''], ['PUT', `/${id}`], ['PATCH', `/${id}/status`], ['DELETE', `/${id}`]]) {
    const response = await fetch(base + path, { method, headers, body: JSON.stringify({}) });
    assert.equal(response.status, 403, `${method} ${path}`);
  }
  assert.equal((await fetch(base)).status, 401);
});
