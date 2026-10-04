import { Router } from 'express';
import { pool } from '../config/database.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { currentReminders } from './reminders.routes.js';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get('/owner', requireRole('owner'), async (request, response) => {
  const ownerId = request.user.id;
  const [summary, pets, appointments, vaccinations, medications, records, weights, reminders] = await Promise.all([
    pool.query(`SELECT
      (SELECT COUNT(*)::int FROM pets WHERE owner_id = $1) AS pets,
      (SELECT COUNT(*)::int FROM appointments a JOIN pets p ON p.id = a.pet_id
       WHERE a.owner_id = $1 AND p.owner_id = $1 AND a.status = 'upcoming' AND a.appointment_date >= NOW()) AS upcoming_appointments,
      (SELECT COUNT(*)::int FROM vaccination_records v JOIN pets p ON p.id = v.pet_id
       WHERE p.owner_id = $1 AND v.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30) AS upcoming_vaccinations,
      (SELECT COUNT(*)::int FROM medication_records m JOIN pets p ON p.id = m.pet_id
       WHERE p.owner_id = $1 AND m.status = 'active') AS active_medications`, [ownerId]),
    pool.query(`SELECT id, name, species, breed, image_url FROM pets
      WHERE owner_id = $1 ORDER BY name, id`, [ownerId]),
    pool.query(`SELECT a.id, a.pet_id, p.name AS pet_name, a.appointment_date, a.purpose, a.clinic_name
      FROM appointments a JOIN pets p ON p.id = a.pet_id
      WHERE a.owner_id = $1 AND p.owner_id = $1 AND a.status = 'upcoming' AND a.appointment_date >= NOW()
      ORDER BY a.appointment_date, a.id LIMIT 5`, [ownerId]),
    pool.query(`SELECT v.id, v.pet_id, p.name AS pet_name, v.vaccine_name, v.next_due_date
      FROM vaccination_records v JOIN pets p ON p.id = v.pet_id
      WHERE p.owner_id = $1 AND v.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
      ORDER BY v.next_due_date, v.id LIMIT 5`, [ownerId]),
    pool.query(`SELECT m.id, m.pet_id, p.name AS pet_name, m.medication_name, m.dosage, m.end_date
      FROM medication_records m JOIN pets p ON p.id = m.pet_id
      WHERE p.owner_id = $1 AND m.status = 'active'
      ORDER BY m.end_date NULLS LAST, m.id LIMIT 5`, [ownerId]),
    pool.query(`SELECT activity.pet_id, activity.pet_name, activity.type, activity.title, activity.record_date
      FROM (
        SELECT m.pet_id, p.name AS pet_name, 'medical' AS type,
          COALESCE(NULLIF(m.diagnosis, ''), 'Medical visit') AS title, m.visit_date AS record_date, m.id
        FROM medical_records m JOIN pets p ON p.id = m.pet_id WHERE p.owner_id = $1
        UNION ALL
        SELECT v.pet_id, p.name, 'vaccination', v.vaccine_name, v.date_received, v.id
        FROM vaccination_records v JOIN pets p ON p.id = v.pet_id WHERE p.owner_id = $1
        UNION ALL
        SELECT w.pet_id, p.name, 'weight', w.weight::text || ' kg', w.record_date, w.id
        FROM weight_records w JOIN pets p ON p.id = w.pet_id WHERE p.owner_id = $1
      ) activity ORDER BY activity.record_date DESC, activity.id DESC LIMIT 8`, [ownerId]),
    pool.query(`SELECT pet_id, pet_name, weight, record_date FROM (
        SELECT w.pet_id, p.name AS pet_name, w.weight, w.record_date,
          ROW_NUMBER() OVER (PARTITION BY w.pet_id ORDER BY w.record_date DESC, w.created_at DESC, w.id DESC) AS position
        FROM weight_records w JOIN pets p ON p.id = w.pet_id WHERE p.owner_id = $1
      ) recent WHERE position <= 12 ORDER BY pet_name, pet_id, record_date, position DESC`, [ownerId]),
    currentReminders(ownerId)
  ]);
  response.json({
    stats: summary.rows[0], pets: pets.rows, appointments: appointments.rows,
    vaccinations: vaccinations.rows, medications: medications.rows,
    records: records.rows, weights: weights.rows,
    reminders: reminders.filter((item) => !item.is_read).slice(0, 5)
  });
});

dashboardRouter.get('/admin', requireRole('admin'), async (_request, response) => {
  const [summary, users, pets, activity] = await Promise.all([
    pool.query(`SELECT
      (SELECT COUNT(*)::int FROM users) AS users,
      (SELECT COUNT(*)::int FROM pets) AS pets,
      (SELECT COUNT(*)::int FROM vaccination_records) AS vaccinations,
      (SELECT COUNT(*)::int FROM appointments) AS appointments`),
    pool.query(`SELECT id, name, email, role, created_at FROM users
      ORDER BY created_at DESC, id DESC LIMIT 5`),
    pool.query(`SELECT p.id, p.name, p.species, p.created_at, u.name AS owner_name
      FROM pets p JOIN users u ON u.id = p.owner_id
      ORDER BY p.created_at DESC, p.id DESC LIMIT 5`),
    pool.query(`SELECT activity.type, activity.title, activity.pet_name, activity.owner_name, activity.created_at
      FROM (
        SELECT 'pet' AS type, p.name AS title, p.name AS pet_name, u.name AS owner_name, p.created_at, p.id
        FROM pets p JOIN users u ON u.id = p.owner_id
        UNION ALL
        SELECT 'vaccination', v.vaccine_name, p.name, u.name, v.created_at, v.id
        FROM vaccination_records v JOIN pets p ON p.id = v.pet_id JOIN users u ON u.id = p.owner_id
        UNION ALL
        SELECT 'medical', COALESCE(NULLIF(m.diagnosis, ''), 'Medical visit'), p.name, u.name, m.created_at, m.id
        FROM medical_records m JOIN pets p ON p.id = m.pet_id JOIN users u ON u.id = p.owner_id
        UNION ALL
        SELECT 'appointment', a.purpose, p.name, u.name, a.created_at, a.id
        FROM appointments a JOIN pets p ON p.id = a.pet_id JOIN users u ON u.id = p.owner_id
      ) activity ORDER BY activity.created_at DESC, activity.id DESC LIMIT 8`)
  ]);
  response.json({ stats: summary.rows[0], recent_users: users.rows,
    recent_pets: pets.rows, recent_activity: activity.rows });
});
