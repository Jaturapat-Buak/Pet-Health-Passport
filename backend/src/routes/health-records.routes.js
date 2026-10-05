import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { pool } from '../config/database.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { readDocumentFile, removeDocumentFile, saveDocumentFile } from '../services/document-files.js';

export const healthRecordsRouter = Router();
healthRecordsRouter.use(requireAuth, requireRole('owner'));

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const textField = (max, required = false) => ({ type: 'text', max, required });
const dateField = (required = false) => ({ type: 'date', required });
const enumField = (values) => ({ type: 'enum', values });

const resources = {
  vaccinations: {
    table: 'vaccination_records', date: 'date_received',
    fields: {
      vaccine_name: textField(160, true), date_received: dateField(true), next_due_date: dateField(),
      clinic_name: textField(160), vet_name: textField(160), notes: textField(5000), document_url: { type: 'url' }
    }
  },
  'medical-records': {
    table: 'medical_records', date: 'visit_date',
    fields: {
      visit_date: dateField(true), clinic_name: textField(160), vet_name: textField(160),
      symptoms: textField(5000), diagnosis: textField(5000), treatment: textField(5000),
      medication: textField(5000), follow_up_date: dateField(), notes: textField(5000)
    }
  },
  allergies: {
    table: 'allergy_records', date: 'created_at',
    fields: {
      allergy_type: textField(100, true), allergen_name: textField(160, true),
      reaction: textField(5000), severity: enumField(['low', 'medium', 'high', 'critical']), notes: textField(5000)
    }
  },
  medications: {
    table: 'medication_records', date: 'start_date',
    fields: {
      medication_name: textField(160, true), dosage: textField(120), frequency: textField(120),
      start_date: dateField(), end_date: dateField(), instruction: textField(5000),
      prescribed_by: textField(160), status: enumField(['active', 'completed', 'cancelled'])
    }
  },
  weights: {
    table: 'weight_records', date: 'record_date',
    fields: { weight: { type: 'weight', required: true }, record_date: dateField(true), notes: textField(5000) }
  }
};

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function readRecord(body, fields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const record = {};
  for (const [key, rule] of Object.entries(fields)) {
    const raw = body[key];
    if (raw == null || raw === '') {
      if (rule.required) return null;
      record[key] = rule.type === 'enum' ? rule.values[0] : null;
      continue;
    }
    if (rule.type === 'text') {
      if (typeof raw !== 'string' || !raw.trim() || raw.trim().length > rule.max) return null;
      record[key] = raw.trim();
    } else if (rule.type === 'date') {
      if (!validDate(raw)) return null;
      record[key] = raw;
    } else if (rule.type === 'enum') {
      if (!rule.values.includes(raw)) return null;
      record[key] = raw;
    } else if (rule.type === 'weight') {
      const weight = Number(raw);
      if (!Number.isFinite(weight) || weight <= 0 || weight > 9999.99 ||
          Math.abs(weight * 100 - Math.round(weight * 100)) > 1e-8) return null;
      record[key] = weight;
    } else if (rule.type === 'url') {
      if (typeof raw !== 'string' || raw.length > 2048) return null;
      try {
        const url = new URL(raw);
        if (!['http:', 'https:'].includes(url.protocol)) return null;
        record[key] = url.href;
      } catch {
        return null;
      }
    }
  }
  if (record.next_due_date && record.next_due_date < record.date_received) return null;
  if (record.follow_up_date && record.follow_up_date < record.visit_date) return null;
  if (record.start_date && record.end_date && record.end_date < record.start_date) return null;
  return record;
}

export const medicalRecordFields = resources['medical-records'].fields;

function resourceFor(request, response) {
  const resource = resources[request.params.resource];
  if (!resource) response.status(404).json({ error: 'Record type not found' });
  return resource;
}

function validIdentifier(value, response) {
  if (uuid.test(value)) return true;
  response.status(400).json({ error: 'Invalid ID' });
  return false;
}

async function ownsPet(petId, ownerId) {
  const { rows } = await pool.query('SELECT id FROM pets WHERE id = $1 AND owner_id = $2', [petId, ownerId]);
  return Boolean(rows[0]);
}

healthRecordsRouter.get('/pets/:petId/:resource', async (request, response, next) => {
  if (request.params.resource === 'documents') return next();
  const resource = resourceFor(request, response);
  if (!resource || !validIdentifier(request.params.petId, response)) return;
  if (!await ownsPet(request.params.petId, request.user.id)) return response.status(404).json({ error: 'Pet not found' });
  const { rows } = await pool.query(
    `SELECT * FROM ${resource.table} WHERE pet_id = $1 ORDER BY ${resource.date} DESC NULLS LAST, created_at DESC, id DESC`,
    [request.params.petId]
  );
  response.json({ records: rows });
});

healthRecordsRouter.post('/pets/:petId/:resource', async (request, response, next) => {
  if (request.params.resource === 'documents') return next();
  const resource = resourceFor(request, response);
  if (!resource || !validIdentifier(request.params.petId, response)) return;
  const record = readRecord(request.body, resource.fields);
  if (!record) return response.status(400).json({ error: 'Enter valid record details' });
  const columns = Object.keys(record);
  const placeholders = columns.map((_, index) => `$${index + 2}`).join(', ');
  const { rows } = await pool.query(
    `INSERT INTO ${resource.table} (pet_id, ${columns.join(', ')})
     SELECT id, ${placeholders} FROM pets WHERE id = $1 AND owner_id = $${columns.length + 2} RETURNING *`,
    [request.params.petId, ...Object.values(record), request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Pet not found' });
  response.status(201).json({ record: rows[0] });
});

healthRecordsRouter.get('/:resource/:id', async (request, response) => {
  const resource = resourceFor(request, response);
  if (!resource || !validIdentifier(request.params.id, response)) return;
  const { rows } = await pool.query(
    `SELECT r.* FROM ${resource.table} r JOIN pets p ON p.id = r.pet_id WHERE r.id = $1 AND p.owner_id = $2`,
    [request.params.id, request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Record not found' });
  response.json({ record: rows[0] });
});

healthRecordsRouter.put('/:resource/:id', async (request, response) => {
  const resource = resourceFor(request, response);
  if (!resource || !validIdentifier(request.params.id, response)) return;
  const record = readRecord(request.body, resource.fields);
  if (!record) return response.status(400).json({ error: 'Enter valid record details' });
  const columns = Object.keys(record);
  const updates = columns.map((column, index) => `${column} = $${index + 3}`).join(', ');
  const timestamp = resource.table === 'weight_records' ? '' : ', updated_at = NOW()';
  const { rows } = await pool.query(
    `UPDATE ${resource.table} SET ${updates}${timestamp}
     WHERE id = $1 AND pet_id IN (SELECT id FROM pets WHERE owner_id = $2) RETURNING *`,
    [request.params.id, request.user.id, ...Object.values(record)]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Record not found' });
  response.json({ record: rows[0] });
});

healthRecordsRouter.delete('/:resource/:id', async (request, response, next) => {
  if (request.params.resource === 'documents') return next();
  const resource = resourceFor(request, response);
  if (!resource || !validIdentifier(request.params.id, response)) return;
  const { rows } = await pool.query(
    `DELETE FROM ${resource.table} WHERE id = $1 AND pet_id IN (SELECT id FROM pets WHERE owner_id = $2) RETURNING id`,
    [request.params.id, request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Record not found' });
  response.sendStatus(204);
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
function fileMime(buffer) {
  if (buffer.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (buffer.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return 'image/jpeg';
  return null;
}

healthRecordsRouter.get('/pets/:petId/documents', async (request, response) => {
  if (!validIdentifier(request.params.petId, response)) return;
  if (!await ownsPet(request.params.petId, request.user.id)) return response.status(404).json({ error: 'Pet not found' });
  const { rows } = await pool.query('SELECT * FROM documents WHERE pet_id = $1 ORDER BY created_at DESC, id DESC', [request.params.petId]);
  response.json({ records: rows });
});

healthRecordsRouter.post('/pets/:petId/documents', upload.single('file'), async (request, response) => {
  if (!validIdentifier(request.params.petId, response)) return;
  if (!await ownsPet(request.params.petId, request.user.id)) return response.status(404).json({ error: 'Pet not found' });
  const { title, document_type: type } = request.body;
  if (typeof title !== 'string' || !title.trim() || title.trim().length > 200 ||
      !['vaccination_certificate', 'medical_certificate', 'lab_result', 'prescription', 'insurance', 'other'].includes(type) ||
      !request.file || !fileMime(request.file.buffer)) {
    return response.status(400).json({ error: 'Add a title, document type and PDF, PNG or JPEG file (up to 10 MB)' });
  }
  const id = randomUUID();
  await saveDocumentFile(id, request.file.buffer);
  try {
    const { rows } = await pool.query(
      `INSERT INTO documents (id, pet_id, document_type, title, file_url, uploaded_by)
       SELECT $1, id, $2, $3, $4, $5 FROM pets WHERE id = $6 AND owner_id = $5 RETURNING *`,
      [id, type, title.trim(), `/api/documents/${id}/file`, request.user.id, request.params.petId]
    );
    if (!rows[0]) {
      await removeDocumentFile(id);
      return response.status(404).json({ error: 'Pet not found' });
    }
    response.status(201).json({ record: rows[0] });
  } catch (error) {
    await removeDocumentFile(id);
    throw error;
  }
});

async function ownDocument(id, ownerId) {
  const { rows } = await pool.query(
    'SELECT d.* FROM documents d JOIN pets p ON p.id = d.pet_id WHERE d.id = $1 AND p.owner_id = $2',
    [id, ownerId]
  );
  return rows[0];
}

healthRecordsRouter.get('/documents/:id/file', async (request, response) => {
  if (!validIdentifier(request.params.id, response)) return;
  const document = await ownDocument(request.params.id, request.user.id);
  if (!document) return response.status(404).json({ error: 'Document not found' });
  try {
    const buffer = await readDocumentFile(request.params.id);
    response.set('Content-Type', fileMime(buffer) ?? 'application/octet-stream');
    response.set('Content-Disposition', `attachment; filename="${request.params.id}"`);
    response.send(buffer);
  } catch (error) {
    if (error.code === 'ENOENT') return response.status(404).json({ error: 'File not found' });
    throw error;
  }
});

healthRecordsRouter.delete('/documents/:id', async (request, response) => {
  if (!validIdentifier(request.params.id, response)) return;
  const { rows } = await pool.query(
    'DELETE FROM documents WHERE id = $1 AND pet_id IN (SELECT id FROM pets WHERE owner_id = $2) RETURNING id',
    [request.params.id, request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Document not found' });
  await removeDocumentFile(request.params.id);
  response.sendStatus(204);
});
