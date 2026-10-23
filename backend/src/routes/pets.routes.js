import { Router } from 'express';
import { pool } from '../config/database.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { readPhoto, savePetPhoto, removePetPhoto } from '../services/pet-photos.js';
import { removeDocumentFile } from '../services/document-files.js';

export const petsRouter = Router();
petsRouter.use(requireAuth, requireRole('owner', 'admin'));

const petColumns = 'id, owner_id, name, species, breed, gender, birth_date, color, weight, microchip_id, medical_notes, image_url, created_at, updated_at';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readText(value, maxLength, required = false) {
  if (value == null || value === '') return required ? undefined : null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return undefined;
  return trimmed;
}

function readPet(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;

  const pet = {
    name: readText(body.name, 120, true),
    species: readText(body.species, 80, true),
    breed: readText(body.breed, 120),
    gender: readText(body.gender, 30),
    color: readText(body.color, 80),
    microchip_id: readText(body.microchip_id, 120),
    medical_notes: readText(body.medical_notes, 5000),
    image_url: readText(body.image_url, 2048)
  };

  if (Object.values(pet).some((value) => value === undefined)) return null;

  pet.birth_date = null;
  if (body.birth_date != null && body.birth_date !== '') {
    if (typeof body.birth_date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.birth_date)) return null;
    const parsed = new Date(`${body.birth_date}T00:00:00Z`);
    if (body.birth_date.startsWith('0000') || Number.isNaN(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== body.birth_date ||
        body.birth_date > new Date().toISOString().slice(0, 10)) return null;
    pet.birth_date = body.birth_date;
  }

  pet.weight = null;
  if (body.weight != null && body.weight !== '') {
    const weight = Number(body.weight);
    if (!Number.isFinite(weight) || weight <= 0 || weight > 9999.99 ||
        Math.abs(weight * 100 - Math.round(weight * 100)) > 1e-8) return null;
    pet.weight = weight;
  }

  if (pet.image_url) {
    try {
      const url = new URL(pet.image_url);
      if (!['http:', 'https:'].includes(url.protocol)) return null;
    } catch {
      return null;
    }
  }

  return pet;
}

function validId(request, response, next) {
  if (!uuidPattern.test(request.params.id)) {
    return response.status(400).json({ error: 'Invalid pet ID' });
  }
  next();
}

function handlePetError(error, response) {
  if (error.code === '23505' && error.constraint === 'pets_microchip_id_key') {
    response.status(409).json({ error: 'Microchip ID is already in use' });
    return true;
  }
  return false;
}

petsRouter.get('/', async (request, response) => {
  const { rows } = await pool.query(
    `SELECT ${petColumns} FROM pets WHERE (owner_id = $1 OR EXISTS (SELECT 1 FROM users actor WHERE actor.id = $1 AND actor.role = 'admin')) ORDER BY created_at DESC, id DESC`,
    [request.user.id]
  );
  response.json({ pets: rows });
});

petsRouter.post('/', readPhoto, async (request, response) => {
  const pet = readPet(request.body);
  if (!pet) return response.status(400).json({ error: 'Enter valid pet details' });

  const ownerId = request.user.role === 'admin' ? request.body.owner_id : request.user.id;
  if (!uuidPattern.test(ownerId ?? '')) return response.status(400).json({ error: 'Choose a pet owner' });
  const owner = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'owner'", [ownerId]);
  if (!owner.rows[0]) return response.status(400).json({ error: 'Choose an owner account' });
  let uploadedPhoto;
  try {
    if (request.file) { uploadedPhoto = await savePetPhoto(request.file); pet.image_url = uploadedPhoto; }
    const { rows } = await pool.query(
      `INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, color, weight, microchip_id, medical_notes, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING ${petColumns}`,
      [ownerId, pet.name, pet.species, pet.breed, pet.gender, pet.birth_date,
        pet.color, pet.weight, pet.microchip_id, pet.medical_notes, pet.image_url]
    );
    response.status(201).json({ pet: rows[0] });
  } catch (error) {
    await removePetPhoto(uploadedPhoto);
    if (!handlePetError(error, response)) throw error;
  }
});

petsRouter.get('/:id', validId, async (request, response) => {
  const { rows } = await pool.query(
    `SELECT ${petColumns} FROM pets WHERE id = $1 AND (owner_id = $2 OR EXISTS (SELECT 1 FROM users actor WHERE actor.id = $2 AND actor.role = 'admin'))`,
    [request.params.id, request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Pet not found' });
  response.json({ pet: rows[0] });
});

petsRouter.get('/:id/vets', validId, async (request, response) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.email, a.created_at FROM pet_vet_access a
     JOIN users u ON u.id = a.vet_id JOIN pets p ON p.id = a.pet_id
     WHERE a.pet_id = $1 AND (p.owner_id = $2 OR EXISTS (SELECT 1 FROM users actor WHERE actor.id = $2 AND actor.role = 'admin')) ORDER BY u.name, u.id`,
    [request.params.id, request.user.id]
  );
  response.json({ vets: rows });
});

petsRouter.post('/:id/vets', requireRole('admin'), validId, async (request, response) => {
  const email = request.body?.email;
  if (typeof email !== 'string' || email.trim().length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return response.status(400).json({ error: 'Enter a valid veterinarian email' });
  }
  const { rows } = await pool.query(
    `INSERT INTO pet_vet_access (pet_id, vet_id, granted_by)
     SELECT p.id, u.id, $2 FROM pets p JOIN users u ON LOWER(u.email) = LOWER($3) AND u.role = 'vet'
     WHERE p.id = $1 AND (p.owner_id = $2 OR EXISTS (SELECT 1 FROM users actor WHERE actor.id = $2 AND actor.role = 'admin'))
     ON CONFLICT (pet_id, vet_id) DO NOTHING RETURNING vet_id`,
    [request.params.id, request.user.id, email.trim()]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Pet or veterinarian not found, or access already granted' });
  response.status(201).json({ vet_id: rows[0].vet_id });
});

petsRouter.delete('/:id/vets/:vetId', requireRole('admin'), validId, async (request, response) => {
  if (!uuidPattern.test(request.params.vetId)) return response.status(400).json({ error: 'Invalid veterinarian ID' });
  const { rows } = await pool.query(
    `DELETE FROM pet_vet_access a USING pets p
     WHERE a.pet_id = p.id AND p.id = $1 AND (p.owner_id = $2 OR EXISTS (SELECT 1 FROM users actor WHERE actor.id = $2 AND actor.role = 'admin')) AND a.vet_id = $3 RETURNING a.vet_id`,
    [request.params.id, request.user.id, request.params.vetId]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Access not found' });
  response.sendStatus(204);
});

petsRouter.put('/:id', validId, readPhoto, async (request, response) => {
  const pet = readPet(request.body);
  if (!pet) return response.status(400).json({ error: 'Enter valid pet details' });

  const ownerId = request.user.role === 'admin' ? request.body.owner_id ?? null : null;
  if (ownerId !== null && !uuidPattern.test(ownerId)) return response.status(400).json({ error: 'Choose a valid owner' });
  const client = await pool.connect();
  let uploadedPhoto;
  let previousPhoto;
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT owner_id, image_url FROM pets WHERE id = $1 FOR UPDATE', [request.params.id]);
    if (!current.rows[0] || (request.user.role !== 'admin' && current.rows[0].owner_id !== request.user.id)) {
      await client.query('ROLLBACK'); return response.status(404).json({ error: 'Pet not found' });
    }
    previousPhoto = current.rows[0].image_url;
    if (ownerId && ownerId !== current.rows[0]?.owner_id) {
      const owner = await client.query("SELECT id FROM users WHERE id = $1 AND role = 'owner'", [ownerId]);
      if (!owner.rows[0]) { await client.query('ROLLBACK'); return response.status(400).json({ error: 'Choose an owner account' }); }
    }
    if (request.file) { uploadedPhoto = await savePetPhoto(request.file); pet.image_url = uploadedPhoto; }
    else if (request.body.remove_image === 'true') pet.image_url = null;
    else if (!Object.hasOwn(request.body, 'image_url')) pet.image_url = previousPhoto;
    const { rows } = await client.query(
      `UPDATE pets SET name = $3, species = $4, breed = $5, gender = $6, birth_date = $7,
       color = $8, weight = $9, microchip_id = $10, medical_notes = $11,
       image_url = $12, owner_id = COALESCE($13::uuid, owner_id), updated_at = NOW()
       WHERE id = $1 AND (owner_id = $2 OR EXISTS (SELECT 1 FROM users actor WHERE actor.id = $2 AND actor.role = 'admin')) RETURNING ${petColumns}`,
      [request.params.id, request.user.id, pet.name, pet.species, pet.breed, pet.gender,
        pet.birth_date, pet.color, pet.weight, pet.microchip_id, pet.medical_notes, pet.image_url, ownerId]
    );
    if (!rows[0]) { await client.query('ROLLBACK'); await removePetPhoto(uploadedPhoto); return response.status(404).json({ error: 'Pet not found' }); }
    if (ownerId && ownerId !== current.rows[0]?.owner_id) {
      await client.query('UPDATE appointments SET owner_id = $2, updated_at = NOW() WHERE pet_id = $1', [request.params.id, ownerId]);
      await client.query('DELETE FROM reminders WHERE pet_id = $1', [request.params.id]);
      await client.query('DELETE FROM pet_vet_access WHERE pet_id = $1', [request.params.id]);
    }
    await client.query('COMMIT');
    if (previousPhoto !== rows[0].image_url) await removePetPhoto(previousPhoto);
    response.json({ pet: rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    await removePetPhoto(uploadedPhoto);
    if (!handlePetError(error, response)) throw error;
  } finally { client.release(); }
});

petsRouter.delete('/:id', validId, async (request, response) => {
  const documents = await pool.query(
    `SELECT d.id FROM documents d JOIN pets p ON p.id = d.pet_id WHERE p.id = $1 AND (p.owner_id = $2 OR EXISTS (SELECT 1 FROM users actor WHERE actor.id = $2 AND actor.role = 'admin'))`,
    [request.params.id, request.user.id]
  );
  const { rows } = await pool.query(
    `DELETE FROM pets WHERE id = $1 AND (owner_id = $2 OR EXISTS (SELECT 1 FROM users actor WHERE actor.id = $2 AND actor.role = 'admin')) RETURNING id, image_url`,
    [request.params.id, request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Pet not found' });
  await removePetPhoto(rows[0].image_url);
  await Promise.all(documents.rows.map((document) => removeDocumentFile(document.id)));
  response.sendStatus(204);
});
