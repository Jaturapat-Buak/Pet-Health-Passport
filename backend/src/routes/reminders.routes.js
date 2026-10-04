import { createHash } from 'node:crypto';
import { Router } from 'express';
import { pool } from '../config/database.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

export const remindersRouter = Router();
remindersRouter.use(requireAuth, requireRole('owner'));

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function reminderId(source) {
  const eventKey = source.event_at ? new Date(source.event_at).toISOString() : source.reminder_date;
  const bytes = createHash('sha256').update(`${source.type}:${source.source_id}:${eventKey}`).digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function describe(source) {
  const { type, pet_name: pet, label } = source;
  if (type === 'appointment') return { title: 'Appointment', message: `${pet}: ${label}` };
  if (type === 'vaccination') return { title: 'Vaccination due', message: `${label} for ${pet} is due soon.` };
  if (type === 'medication') return { title: 'Medication ending', message: `${label} for ${pet} is ending soon.` };
  return { title: 'Follow-up due', message: `${pet} has a follow-up visit due soon.` };
}

export async function currentReminders(ownerId) {
  const { rows } = await pool.query(
    `SELECT a.id AS source_id, a.pet_id, p.name AS pet_name, 'appointment' AS type,
            to_char(a.appointment_date AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS reminder_date,
            a.purpose AS label, a.appointment_date AS event_at
     FROM appointments a JOIN pets p ON p.id = a.pet_id
     WHERE p.owner_id = $1 AND a.owner_id = $1 AND a.status = 'upcoming'
       AND a.appointment_date >= NOW() AND a.appointment_date < NOW() + INTERVAL '30 days'
     UNION ALL
     SELECT v.id, v.pet_id, p.name, 'vaccination', to_char(v.next_due_date, 'YYYY-MM-DD'), v.vaccine_name, NULL::timestamptz
     FROM vaccination_records v JOIN pets p ON p.id = v.pet_id
     WHERE p.owner_id = $1 AND v.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
     UNION ALL
     SELECT m.id, m.pet_id, p.name, 'medication', to_char(m.end_date, 'YYYY-MM-DD'), m.medication_name, NULL::timestamptz
     FROM medication_records m JOIN pets p ON p.id = m.pet_id
     WHERE p.owner_id = $1 AND m.status = 'active'
       AND m.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
     UNION ALL
     SELECT r.id, r.pet_id, p.name, 'follow_up', to_char(r.follow_up_date, 'YYYY-MM-DD'), r.diagnosis, NULL::timestamptz
     FROM medical_records r JOIN pets p ON p.id = r.pet_id
     WHERE p.owner_id = $1 AND r.follow_up_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30`,
    [ownerId]
  );
  const reminders = rows.map((source) => ({
    id: reminderId(source), pet_id: source.pet_id, pet_name: source.pet_name,
    type: source.type, reminder_date: source.reminder_date, event_at: source.event_at,
    target_url: source.type === 'appointment' ? `/appointments/${source.source_id}/edit` : `/pets/${source.pet_id}`,
    ...describe(source), is_read: false
  }));
  if (reminders.length === 0) return reminders;
  const reads = await pool.query(
    'SELECT id, is_read FROM reminders WHERE user_id = $1 AND id = ANY($2::uuid[])',
    [ownerId, reminders.map((reminder) => reminder.id)]
  );
  const readIds = new Set(reads.rows.filter((row) => row.is_read).map((row) => row.id));
  return reminders.map((reminder) => ({ ...reminder, is_read: readIds.has(reminder.id) }))
    .sort((a, b) => a.reminder_date.localeCompare(b.reminder_date) || a.type.localeCompare(b.type));
}

remindersRouter.get('/', async (request, response) => {
  response.json({ reminders: await currentReminders(request.user.id) });
});

remindersRouter.patch('/:id/read', async (request, response) => {
  if (!uuid.test(request.params.id)) return response.status(400).json({ error: 'Invalid reminder ID' });
  const reminder = (await currentReminders(request.user.id)).find((item) => item.id === request.params.id);
  if (!reminder) return response.status(404).json({ error: 'Reminder not found' });
  await pool.query(
    `INSERT INTO reminders (id, user_id, pet_id, title, message, reminder_date, type, is_read)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
     ON CONFLICT (id) DO UPDATE SET is_read = TRUE`,
    [reminder.id, request.user.id, reminder.pet_id, reminder.title,
      reminder.message, reminder.reminder_date, reminder.type]
  );
  response.json({ reminder: { ...reminder, is_read: true } });
});
