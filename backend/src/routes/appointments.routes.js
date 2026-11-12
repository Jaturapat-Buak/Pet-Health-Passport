import { Router } from 'express';
import { appointmentScope } from '../services/pet-access.js';
import { pool } from '../config/database.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const appointmentsRouter = Router();
appointmentsRouter.use(requireAuth, requireRole('owner', 'vet', 'admin'));

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const statuses = ['upcoming', 'completed', 'cancelled'];

function readText(value, max, required = false) {
  if (value == null || value === '') return required ? undefined : null;
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) return undefined;
  return value.trim();
}

function readAppointment(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      typeof body.pet_id !== 'string' || !uuid.test(body.pet_id)) return null;
  const appointment = {
    pet_id: body.pet_id,
    clinic_name: readText(body.clinic_name, 160),
    purpose: readText(body.purpose, 5000, true),
    notes: readText(body.notes, 5000)
  };
  if (Object.values(appointment).some((value) => value === undefined)) return null;
  const date = body.appointment_date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(date) ||
      date.startsWith('0000') || Number.isNaN(Date.parse(date))) return null;
  const calendarDate = date.slice(0, 10);
  if (new Date(`${calendarDate}T00:00:00Z`).toISOString().slice(0, 10) !== calendarDate) return null;
  appointment.appointment_date = new Date(date).toISOString();
  return appointment;
}

function validId(request, response, next) {
  if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Invalid appointment ID' });
  next();
}

const canWrite = requireRole('vet', 'admin');

appointmentsRouter.get('/', async (request, response) => {
  const view = request.query.view ?? 'all';
  if (!['all', 'upcoming'].includes(view)) return response.status(400).json({ error: 'Invalid appointment view' });
  const { rows } = await pool.query(
    `SELECT a.*, p.name AS pet_name FROM appointments a JOIN pets p ON p.id = a.pet_id
     WHERE ${appointmentScope('p', '$1')}
       AND ($2::text = 'all' OR (a.status = 'upcoming' AND a.appointment_date >= NOW()))
     ORDER BY CASE WHEN $2::text = 'upcoming' THEN a.appointment_date END ASC, a.appointment_date DESC, a.id DESC`,
    [request.user.id, view]);
  response.json({ appointments: rows });
});

appointmentsRouter.post('/', canWrite, async (request, response) => {
  const details = readAppointment(request.body);
  if (!details) return response.status(400).json({ error: 'Enter valid appointment details' });
  const { rows } = await pool.query(
    `INSERT INTO appointments (pet_id, owner_id, appointment_date, clinic_name, purpose, notes)
     SELECT p.id, p.owner_id, $3, $4, $5, $6 FROM pets p
     WHERE p.id = $1 AND ${appointmentScope('p', '$2')} RETURNING *`,
    [details.pet_id, request.user.id, details.appointment_date, details.clinic_name, details.purpose, details.notes]);
  if (!rows[0]) return response.status(404).json({ error: 'Pet not found' });
  response.status(201).json({ appointment: rows[0] });
});

appointmentsRouter.get('/:id', validId, async (request, response) => {
  const { rows } = await pool.query(
    `SELECT a.*, p.name AS pet_name FROM appointments a JOIN pets p ON p.id = a.pet_id
     WHERE a.id = $1 AND ${appointmentScope('p', '$2')}`, [request.params.id, request.user.id]);
  if (!rows[0]) return response.status(404).json({ error: 'Appointment not found' });
  response.json({ appointment: rows[0] });
});

appointmentsRouter.put('/:id', canWrite, validId, async (request, response) => {
  const details = readAppointment(request.body);
  if (!details) return response.status(400).json({ error: 'Enter valid appointment details' });
  const { rows } = await pool.query(
    `UPDATE appointments a SET pet_id = target.id, owner_id = target.owner_id,
       appointment_date = $4, clinic_name = $5, purpose = $6, notes = $7, updated_at = NOW()
     FROM pets p, pets target WHERE a.id = $1 AND p.id = a.pet_id
       AND ${appointmentScope('p', '$2')} AND target.id = $3 AND ${appointmentScope('target', '$2')}
     RETURNING a.*`,
    [request.params.id, request.user.id, details.pet_id, details.appointment_date, details.clinic_name, details.purpose, details.notes]);
  if (!rows[0]) return response.status(404).json({ error: 'Appointment or pet not found' });
  response.json({ appointment: rows[0] });
});

appointmentsRouter.patch('/:id/status', canWrite, validId, async (request, response) => {
  if (!statuses.includes(request.body?.status)) return response.status(400).json({ error: 'Choose a valid appointment status' });
  const { rows } = await pool.query(
    `UPDATE appointments a SET status = $3, updated_at = NOW() FROM pets p
     WHERE a.id = $1 AND p.id = a.pet_id AND ${appointmentScope('p', '$2')} RETURNING a.*`,
    [request.params.id, request.user.id, request.body.status]);
  if (!rows[0]) return response.status(404).json({ error: 'Appointment not found' });
  response.json({ appointment: rows[0] });
});

appointmentsRouter.delete('/:id', canWrite, validId, async (request, response) => {
  const { rows } = await pool.query(
    `DELETE FROM appointments a USING pets p WHERE a.id = $1 AND p.id = a.pet_id
     AND ${appointmentScope('p', '$2')} RETURNING a.id`, [request.params.id, request.user.id]);
  if (!rows[0]) return response.status(404).json({ error: 'Appointment not found' });
  response.sendStatus(204);
});
