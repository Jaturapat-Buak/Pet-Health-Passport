import { Router } from 'express';
import { pool } from '../config/database.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const petsRouter = Router();
petsRouter.use(requireAuth, requireRole('owner'));

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
    `SELECT ${petColumns} FROM pets WHERE owner_id = $1 ORDER BY created_at DESC, id DESC`,
    [request.user.id]
  );
  response.json({ pets: rows });
});

petsRouter.post('/', async (request, response) => {
  const pet = readPet(request.body);
  if (!pet) return response.status(400).json({ error: 'Enter valid pet details' });

  try {
    const { rows } = await pool.query(
      `INSERT INTO pets (owner_id, name, species, breed, gender, birth_date, color, weight, microchip_id, medical_notes, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING ${petColumns}`,
      [request.user.id, pet.name, pet.species, pet.breed, pet.gender, pet.birth_date,
        pet.color, pet.weight, pet.microchip_id, pet.medical_notes, pet.image_url]
    );
    response.status(201).json({ pet: rows[0] });
  } catch (error) {
    if (!handlePetError(error, response)) throw error;
  }
});

petsRouter.get('/:id', validId, async (request, response) => {
  const { rows } = await pool.query(
    `SELECT ${petColumns} FROM pets WHERE id = $1 AND owner_id = $2`,
    [request.params.id, request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Pet not found' });
  response.json({ pet: rows[0] });
});

petsRouter.put('/:id', validId, async (request, response) => {
  const pet = readPet(request.body);
  if (!pet) return response.status(400).json({ error: 'Enter valid pet details' });

  try {
    const { rows } = await pool.query(
      `UPDATE pets SET name = $3, species = $4, breed = $5, gender = $6, birth_date = $7,
       color = $8, weight = $9, microchip_id = $10, medical_notes = $11,
       image_url = $12, updated_at = NOW()
       WHERE id = $1 AND owner_id = $2 RETURNING ${petColumns}`,
      [request.params.id, request.user.id, pet.name, pet.species, pet.breed, pet.gender,
        pet.birth_date, pet.color, pet.weight, pet.microchip_id, pet.medical_notes, pet.image_url]
    );
    if (!rows[0]) return response.status(404).json({ error: 'Pet not found' });
    response.json({ pet: rows[0] });
  } catch (error) {
    if (!handlePetError(error, response)) throw error;
  }
});

petsRouter.delete('/:id', validId, async (request, response) => {
  const { rows } = await pool.query(
    'DELETE FROM pets WHERE id = $1 AND owner_id = $2 RETURNING id',
    [request.params.id, request.user.id]
  );
  if (!rows[0]) return response.status(404).json({ error: 'Pet not found' });
  response.sendStatus(204);
});
