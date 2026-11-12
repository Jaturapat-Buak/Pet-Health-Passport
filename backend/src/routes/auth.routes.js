import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middlewares/auth.js';

export const authRouter = Router();
const userColumns = 'id, name, email, role, phone, created_at';

function credentialsFor(user) {
  const token = jwt.sign({}, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: '12h',
    subject: user.id
  });
  return { token, user };
}

authRouter.post('/register', async (request, response) => {
  const { name, email, password } = request.body ?? {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!cleanName || cleanName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 255 ||
      typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72) {
    return response.status(400).json({ error: 'Enter a name, valid email, and password of 8 to 72 bytes' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, 'owner') RETURNING ${userColumns}`,
      [cleanName, cleanEmail, passwordHash]
    );
    return response.status(201).json(credentialsFor(rows[0]));
  } catch (error) {
    if (error.code === '23505') {
      return response.status(409).json({ error: 'Email is already registered' });
    }
    throw error;
  }
});

authRouter.post('/login', async (request, response) => {
  const { email, password } = request.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return response.status(400).json({ error: 'Email and password are required' });
  }

  const { rows } = await pool.query(
    `SELECT ${userColumns}, password_hash FROM users WHERE email = $1`,
    [email.trim().toLowerCase()]
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return response.status(401).json({ error: 'Invalid email or password' });
  }

  const { password_hash: _passwordHash, ...safeUser } = user;
  return response.json(credentialsFor(safeUser));
});

authRouter.get('/me', requireAuth, (request, response) => {
  response.json({ user: request.user });
});

