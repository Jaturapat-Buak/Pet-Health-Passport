import { Router } from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../config/database.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { removePetPhoto } from '../services/pet-photos.js';
import { removeDocumentFile } from '../services/document-files.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));
const columns = 'id, name, email, phone, role, created_at';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const roles = ['owner', 'vet', 'admin'];

function details(body) {
  const { name, email, phone, role } = body ?? {};
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120 ||
      typeof email !== 'string' || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      (phone != null && (typeof phone !== 'string' || phone.length > 30)) || !roles.includes(role)) return null;
  return [name.trim(), email.trim().toLowerCase(), phone?.trim() || null, role];
}

adminRouter.get('/users', async (_request, response) => {
  const { rows } = await pool.query(`SELECT ${columns} FROM users ORDER BY name, id`);
  response.json({ users: rows });
});

adminRouter.post('/users', async (request, response) => {
  const values = details(request.body);
  const password = request.body?.password;
  if (!values || typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password) > 72)
    return response.status(400).json({ error: 'Enter valid user details and a password of 8 to 72 bytes' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, phone, role, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING ${columns}`,
      [...values, await bcrypt.hash(password, 12)]);
    response.status(201).json({ user: rows[0] });
  } catch (error) {
    if (error.code === '23505') return response.status(409).json({ error: 'Email is already registered' });
    throw error;
  }
});

adminRouter.put('/users/:id', async (request, response) => {
  const values = details(request.body);
  if (!uuid.test(request.params.id) || !values) return response.status(400).json({ error: 'Enter valid user details' });
  if (request.params.id === request.user.id && values[3] !== 'admin')
    return response.status(409).json({ error: 'ไม่สามารถลดสิทธิ์บัญชีผู้ดูแลระบบ ที่กำลังใช้งานได้' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(734821)');
    const actor = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'admin'", [request.user.id]);
    if (!actor.rows[0]) { await client.query('ROLLBACK'); return response.status(403).json({ error: 'Insufficient permissions' }); }
    const { rows } = await client.query(
      `UPDATE users SET name = $1, email = $2, phone = $3, role = $4, updated_at = NOW() WHERE id = $5 RETURNING ${columns}`,
      [...values, request.params.id]);
    if (!rows[0]) { await client.query('ROLLBACK'); return response.status(404).json({ error: 'User not found' }); }
    await client.query('COMMIT');
    response.json({ user: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') return response.status(409).json({ error: 'Email is already registered' });
    throw error;
  } finally { client.release(); }
});

adminRouter.delete('/users/:id', async (request, response) => {
  if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Invalid user ID' });
  if (request.params.id === request.user.id) return response.status(409).json({ error: 'ไม่สามารถลบบัญชีที่กำลังใช้งานได้' });
  const client = await pool.connect();
  let documents = [];
  let photos = [];
  try {
    await client.query('BEGIN');
    // Serialize admin removals and recheck the actor under the lock.
    await client.query('SELECT pg_advisory_xact_lock(734821)');
    const actor = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'admin'", [request.user.id]);
    if (!actor.rows[0]) { await client.query('ROLLBACK'); return response.status(403).json({ error: 'Insufficient permissions' }); }
    const files = await client.query('SELECT d.id FROM documents d JOIN pets p ON p.id = d.pet_id WHERE p.owner_id = $1', [request.params.id]);
    documents = files.rows;
    photos = (await client.query('SELECT image_url FROM pets WHERE owner_id = $1', [request.params.id])).rows;
    const result = await client.query('DELETE FROM users WHERE id = $1 RETURNING id', [request.params.id]);
    if (!result.rows[0]) { await client.query('ROLLBACK'); return response.status(404).json({ error: 'User not found' }); }
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
  await Promise.all(documents.map(({ id }) => removeDocumentFile(id)));
  await Promise.all(photos.map(({ image_url }) => removePetPhoto(image_url)));
  response.sendStatus(204);
});
