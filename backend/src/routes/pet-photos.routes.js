import { Router } from 'express';
import { pool } from '../config/database.js';
import { requireAuth } from '../middlewares/auth.js';
import { readDocumentFile } from '../services/document-files.js';
import { photoMime } from '../services/pet-photos.js';
import { appointmentScope } from '../services/pet-access.js';

export const petPhotosRouter = Router();
petPhotosRouter.get('/:id', requireAuth, async (request, response) => {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(request.params.id))
    return response.status(400).json({ error: 'Invalid photo ID' });
  const { rows } = await pool.query(
    `SELECT p.id FROM pets p WHERE p.image_url = $1 AND ${appointmentScope('p', '$2')} LIMIT 1`,
    [`/api/pet-photos/${request.params.id}`, request.user.id]);
  if (!rows[0]) return response.status(404).json({ error: 'Photo not found' });
  try {
    const file = await readDocumentFile(request.params.id);
    response.set('Content-Type', photoMime(file) ?? 'application/octet-stream');
    response.set('Cache-Control', 'private, no-store');
    response.set('X-Content-Type-Options', 'nosniff');
    response.send(file);
  } catch (error) {
    if (error.code === 'ENOENT') return response.status(404).json({ error: 'Photo not found' });
    throw error;
  }
});
