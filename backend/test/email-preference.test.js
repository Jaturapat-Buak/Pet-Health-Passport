import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';

test('only owners can read and update their email opt-in', async (t) => {
  const original = pool.query;
  const owner = 'f5255904-fabc-4cc6-b5ed-28d7df5d3816';
  const vet = '4ad51049-5ca2-4e64-abcd-5cad130edfa6';
  let enabled = false;
  pool.query = async (sql, values) => {
    if (sql.startsWith('SELECT email_notifications_enabled')) return { rows: [{ email_notifications_enabled: enabled }] };
    if (sql.includes('FROM users WHERE id')) return { rows: [{ id: values[0], role: values[0] === vet ? 'vet' : 'owner' }] };
    if (sql.startsWith('UPDATE users SET email_notifications_enabled')) {
      enabled = values[1];
      return { rows: [{ email_notifications_enabled: enabled }] };
    }
    throw new Error(`Unexpected query: ${sql}`);
  };
  const server = app.listen(0);
  t.after(async () => { pool.query = original; await new Promise((resolve) => server.close(resolve)); });
  const url = `http://127.0.0.1:${server.address().port}/api/reminders/preferences`;
  const headers = (id) => ({ Authorization: `Bearer ${jwt.sign({}, env.jwtSecret, { subject: id })}`, 'Content-Type': 'application/json' });

  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(url, { headers: headers(vet) })).status, 403);
  assert.equal((await (await fetch(url, { headers: headers(owner) })).json()).email_notifications_enabled, false);
  assert.equal((await fetch(url, { method: 'PUT', headers: headers(owner), body: JSON.stringify({ email_notifications_enabled: 'true' }) })).status, 400);
  assert.equal((await fetch(url, { method: 'PUT', headers: headers(vet), body: JSON.stringify({ email_notifications_enabled: true }) })).status, 403);
  const updated = await fetch(url, { method: 'PUT', headers: headers(owner), body: JSON.stringify({ email_notifications_enabled: true }) });
  assert.equal(updated.status, 200);
  assert.equal((await updated.json()).email_notifications_enabled, true);
});
