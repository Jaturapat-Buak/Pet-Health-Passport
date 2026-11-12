import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';

export async function requireAuth(request, response, next) {
  const match = /^Bearer (\S+)$/i.exec(request.get('authorization') ?? '');
  if (!match) {
    return response.status(401).json({ error: 'Authentication required' });
  }

  let payload;
  try {
    payload = jwt.verify(match[1], env.jwtSecret, { algorithms: ['HS256'] });
  } catch {
    return response.status(401).json({ error: 'Invalid or expired token' });
  }

  if (typeof payload !== 'object' || typeof payload.sub !== 'string') {
    return response.status(401).json({ error: 'Invalid or expired token' });
  }

  try {
    const { rows } = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [payload.sub]
    );
    if (!rows[0]) {
      return response.status(401).json({ error: 'Account no longer exists' });
    }
    request.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (request, response, next) => {
    if (!request.user || !roles.includes(request.user.role)) {
      return response.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

