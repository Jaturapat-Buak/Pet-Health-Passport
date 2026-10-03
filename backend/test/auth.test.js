import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { pool } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { requireAuth, requireRole } from '../src/middlewares/auth.js';

test('registration, login, current user, and role checks', async (context) => {
  const originalQuery = pool.query;
  const user = {
    id: '901ee0bd-dfc6-48e7-a677-b863735da7e9',
    name: 'Casey',
    email: 'casey@example.com',
    role: 'owner',
    phone: null,
    created_at: new Date().toISOString()
  };
  let passwordHash;
  let insertCount = 0;

  pool.query = async (statement, values) => {
    if (statement.startsWith('INSERT INTO users')) {
      assert.match(statement, /VALUES \(\$1, \$2, \$3, 'owner'\)/);
      assert.equal(values[0], user.name);
      assert.equal(values[1], user.email);
      if (insertCount++ > 0) {
        throw Object.assign(new Error('duplicate email'), { code: '23505' });
      }
      passwordHash = values[2];
      return { rows: [user] };
    }
    if (statement.includes('password_hash FROM users WHERE email')) {
      return { rows: values[0] === user.email ? [{ ...user, password_hash: passwordHash }] : [] };
    }
    if (statement.includes('FROM users WHERE id')) {
      return { rows: values[0] === user.id ? [user] : [] };
    }
    throw new Error(`Unexpected query: ${statement}`);
  };

  const testApp = express();
  testApp.get('/admin-only', requireAuth, requireRole('admin'), (_request, response) => response.sendStatus(204));
  testApp.use(app);
  const server = testApp.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;

  context.after(async () => {
    pool.query = originalQuery;
    await new Promise((resolve) => server.close(resolve));
  });

  async function post(path, body) {
    return fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  }

  const badRegistration = await post('/api/auth/register', {
    name: 'Casey', email: user.email, password: 'short'
  });
  assert.equal(badRegistration.status, 400);

  const registered = await post('/api/auth/register', {
    name: ' Casey ', email: 'CASEY@example.com', password: 'password123', role: 'admin'
  });
  assert.equal(registered.status, 201);
  const registrationBody = await registered.json();
  assert.equal(registrationBody.user.role, 'owner');
  assert.equal(registrationBody.user.email, user.email);
  assert.equal(registrationBody.user.password_hash, undefined);
  assert.equal(await bcrypt.compare('password123', passwordHash), true);

  const duplicate = await post('/api/auth/register', {
    name: 'Casey', email: user.email, password: 'password123'
  });
  assert.equal(duplicate.status, 409);

  const badLogin = await post('/api/auth/login', { email: user.email, password: 'incorrect' });
  assert.equal(badLogin.status, 401);

  const loggedIn = await post('/api/auth/login', { email: 'CASEY@example.com', password: 'password123' });
  assert.equal(loggedIn.status, 200);
  const { token, user: loggedInUser } = await loggedIn.json();
  assert.equal(loggedInUser.password_hash, undefined);
  assert.equal(jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }).sub, user.id);

  const anonymous = await fetch(`${base}/api/auth/me`);
  assert.equal(anonymous.status, 401);
  const invalidToken = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}wrong` }
  });
  assert.equal(invalidToken.status, 401);
  const expiredToken = jwt.sign({}, env.jwtSecret, {
    subject: user.id,
    expiresIn: -1
  });
  const expired = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${expiredToken}` }
  });
  assert.equal(expired.status, 401);

  const me = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).user.id, user.id);

  const forbidden = await fetch(`${base}/admin-only`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(forbidden.status, 403);
  user.role = 'admin';
  const allowed = await fetch(`${base}/admin-only`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(allowed.status, 204);
});
