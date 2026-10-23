import { Router } from 'express';
import { pool } from '../config/database.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { medicalRecordFields, readRecord } from './health-records.routes.js';
import { readDocumentFile } from '../services/document-files.js';

export const vetRouter = Router();
vetRouter.use(requireAuth, requireRole('vet'));

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const resources = {
  vaccinations: ['vaccination_records', 'date_received'],
  'medical-records': ['medical_records', 'visit_date'],
  allergies: ['allergy_records', 'created_at'],
  medications: ['medication_records', 'start_date'],
  weights: ['weight_records', 'record_date'],
  documents: ['documents', 'created_at']
};

function validId(request, response, next) {
  if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Invalid ID' });
  next();
}

function ownerEmail(value) {
  return typeof value === 'string' && value.trim().length <= 255 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? value.trim().toLowerCase() : null;
}

vetRouter.get('/available-pets', async (request, response) => {
  const email = request.query.ownerEmail == null ? null : ownerEmail(request.query.ownerEmail);
  const search = request.query.search ?? '';
  const page = Number(request.query.page ?? 0);
  if ((request.query.ownerEmail != null && !email) || typeof search !== 'string' || search.length > 120 ||
      !Number.isInteger(page) || page < 0 || page > 100000)
    return response.status(400).json({ error: 'กรุณาระบุคำค้นหาและหน้ารายการให้ถูกต้อง' });
  const speciesSearch = new Map([['แมว', 'cat'], ['สุนัข', 'dog'], ['หมา', 'dog'], ['นก', 'bird'], ['กระต่าย', 'rabbit'], ['ปลา', 'fish']]).get(search.trim()) ?? search.trim();
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.species, p.breed, u.name AS owner_name,
       EXISTS (SELECT 1 FROM pet_vet_access a WHERE a.pet_id = p.id AND a.vet_id = $2) AS in_care
     FROM pets p JOIN users u ON u.id = p.owner_id
     WHERE ($1::text IS NULL OR LOWER(u.email) = $1)
       AND (p.name ILIKE '%' || $3 || '%' OR u.name ILIKE '%' || $3 || '%' OR p.species ILIKE '%' || $3 || '%' OR p.species ILIKE '%' || $5 || '%')
     ORDER BY p.name, p.id LIMIT 21 OFFSET $4`,
    [email, request.user.id, search.trim(), page * 20, speciesSearch]);
  response.json({ pets: rows.slice(0, 20), has_more: rows.length > 20, page });
});

vetRouter.post('/pets/:id/access', validId, async (request, response) => {
  const email = request.body?.owner_email == null ? null : ownerEmail(request.body.owner_email);
  if (request.body?.owner_email != null && !email) return response.status(400).json({ error: 'กรุณาระบุอีเมลเจ้าของสัตว์เลี้ยงให้ถูกต้อง' });
  const { rows } = await pool.query(
    `INSERT INTO pet_vet_access (pet_id, vet_id, granted_by)
     SELECT p.id, $2, $2 FROM pets p JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1 AND ($3::text IS NULL OR LOWER(u.email) = $3)
     ON CONFLICT (pet_id, vet_id) DO NOTHING RETURNING pet_id, vet_id`,
    [request.params.id, request.user.id, email]);
  if (!rows[0]) return response.status(409).json({ error: 'ไม่พบสัตว์เลี้ยงของอีเมลนี้ หรืออยู่ในความดูแลแล้ว' });
  response.status(201).json({ access: rows[0] });
});

vetRouter.delete('/pets/:id/access', validId, async (request, response) => {
  const { rows } = await pool.query(
    'DELETE FROM pet_vet_access WHERE pet_id = $1 AND vet_id = $2 RETURNING pet_id',
    [request.params.id, request.user.id]);
  if (!rows[0]) return response.status(404).json({ error: 'ไม่พบสัตว์เลี้ยงในความดูแล' });
  response.sendStatus(204);
});

vetRouter.get('/pets', async (request, response) => {
  const { rows } = await pool.query(
    `SELECT p.id, p.name, p.species, p.breed, p.image_url, u.name AS owner_name
     FROM pet_vet_access a JOIN pets p ON p.id = a.pet_id JOIN users u ON u.id = p.owner_id
     WHERE a.vet_id = $1 ORDER BY p.name, p.id`, [request.user.id]
  );
  response.json({ pets: rows });
});

vetRouter.get('/pets/:id', validId, async (request, response) => {
  const { rows } = await pool.query(
    `SELECT p.*, u.name AS owner_name FROM pets p
     JOIN pet_vet_access a ON a.pet_id = p.id JOIN users u ON u.id = p.owner_id
     WHERE p.id = $1 AND a.vet_id = $2`, [request.params.id, request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Pet not found' });
  response.json({ pet: rows[0] });
});

vetRouter.get('/pets/:id/:resource', validId, async (request, response) => {
  const resource = resources[request.params.resource];
  if (!resource) return response.status(404).json({ error: 'Record type not found' });
  const access = await pool.query(
    'SELECT 1 FROM pet_vet_access WHERE pet_id = $1 AND vet_id = $2',
    [request.params.id, request.user.id]
  );
  if (!access.rows[0]) return response.status(404).json({ error: 'Pet not found' });
  const [table, date] = resource;
  const { rows } = await pool.query(
    `SELECT r.* FROM ${table} r JOIN pet_vet_access a ON a.pet_id = r.pet_id
     WHERE r.pet_id = $1 AND a.vet_id = $2 ORDER BY r.${date} DESC NULLS LAST, r.created_at DESC, r.id DESC`,
    [request.params.id, request.user.id]
  );
  response.json({ records: rows });
});

vetRouter.post('/pets/:id/medical-records', validId, async (request, response) => {
  const record = readRecord(request.body, medicalRecordFields);
  if (!record) return response.status(400).json({ error: 'Enter valid record details' });
  record.vet_name ||= request.user.name;
  record.created_by = request.user.id;
  const columns = Object.keys(record);
  const placeholders = columns.map((_, index) => `$${index + 3}`).join(', ');
  const { rows } = await pool.query(
    `INSERT INTO medical_records (pet_id, ${columns.join(', ')})
     SELECT a.pet_id, ${placeholders} FROM pet_vet_access a
     WHERE a.pet_id = $1 AND a.vet_id = $2 RETURNING *`,
    [request.params.id, request.user.id, ...Object.values(record)]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Pet not found' });
  response.status(201).json({ record: rows[0] });
});

vetRouter.get('/documents/:id/file', validId, async (request, response) => {
  const { rows } = await pool.query(
    `SELECT d.id FROM documents d JOIN pet_vet_access a ON a.pet_id = d.pet_id
     WHERE d.id = $1 AND a.vet_id = $2`, [request.params.id, request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Document not found' });
  try {
    const buffer = await readDocumentFile(request.params.id);
    const mime = buffer.subarray(0, 5).toString() === '%PDF-' ? 'application/pdf' :
      buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) ? 'image/png' : 'image/jpeg';
    response.set('Content-Type', mime);
    response.set('Content-Disposition', `attachment; filename="${request.params.id}"`);
    response.send(buffer);
  } catch (error) {
    if (error.code === 'ENOENT') return response.status(404).json({ error: 'File not found' });
    throw error;
  }
});
