import { pool } from '../config/database.js';

export const notificationLeadMinutes = Number(process.env.NOTIFICATION_LEAD_MINUTES ?? 1440);
const maxAttempts = 5;

export function retryDelayMinutes(attempts) {
  return Math.min(60, 2 ** Math.max(0, attempts - 1));
}

export function appointmentEmail({ pet_name, appointment_date }) {
  const when = new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok', dateStyle: 'full', timeStyle: 'short'
  }).format(new Date(appointment_date));
  return {
    subject: `แจ้งเตือนนัดหมายของ ${pet_name}`,
    text: `นัดหมายของ ${pet_name} กำลังจะมาถึงในวันที่ ${when}\n\nโปรดเปิด Pet Health Passport เพื่อตรวจรายละเอียดนัดหมาย หากนัดถูกเปลี่ยนหรือยกเลิกให้ยึดข้อมูลล่าสุดในแอป`
  };
}

export async function syncDueAppointments(leadMinutes = notificationLeadMinutes) {
  if (!Number.isInteger(leadMinutes) || leadMinutes < 1 || leadMinutes > 43200) {
    throw new Error('NOTIFICATION_LEAD_MINUTES must be an integer from 1 to 43200');
  }
  await pool.query(
    `INSERT INTO appointment_notifications (appointment_id, appointment_date, recipient_user_id)
     SELECT a.id, a.appointment_date, a.owner_id FROM appointments a JOIN users u ON u.id = a.owner_id
     WHERE a.status = 'upcoming' AND u.email_notifications_enabled
       AND a.appointment_date > NOW()
       AND a.appointment_date <= NOW() + ($1::integer * INTERVAL '1 minute')
     ON CONFLICT (appointment_id) DO UPDATE SET
       appointment_date = EXCLUDED.appointment_date, recipient_user_id = EXCLUDED.recipient_user_id,
       status = 'pending', attempts = 0,
       next_attempt_at = NOW(), queued_at = NULL, processing_started_at = NULL,
       sent_at = NULL, last_error = NULL
     WHERE appointment_notifications.appointment_date IS DISTINCT FROM EXCLUDED.appointment_date
        OR appointment_notifications.recipient_user_id IS DISTINCT FROM EXCLUDED.recipient_user_id`,
    [leadMinutes]);
}

export async function jobsToQueue(leadMinutes = notificationLeadMinutes) {
  const { rows } = await pool.query(
    `SELECT n.id, n.appointment_date FROM appointment_notifications n
     JOIN appointments a ON a.id = n.appointment_id
     JOIN users u ON u.id = a.owner_id
     WHERE a.status = 'upcoming' AND u.email_notifications_enabled
       AND a.appointment_date = n.appointment_date AND a.owner_id = n.recipient_user_id
       AND a.appointment_date > NOW()
       AND a.appointment_date <= NOW() + ($1::integer * INTERVAL '1 minute')
       AND ((n.status IN ('pending', 'failed') AND n.next_attempt_at <= NOW())
         OR (n.status = 'queued' AND n.queued_at < NOW() - INTERVAL '5 minutes')
         OR (n.status = 'processing' AND n.processing_started_at < NOW() - INTERVAL '5 minutes'))
     ORDER BY n.next_attempt_at, n.id LIMIT 100`,
    [leadMinutes]);
  return rows;
}

export async function markQueued(id, appointmentDate) {
  await pool.query(
    `UPDATE appointment_notifications SET status = 'queued', queued_at = NOW()
     WHERE id = $1 AND appointment_date = $2::timestamptz
       AND status IN ('pending', 'failed', 'queued')`,
    [id, appointmentDate]);
}

export async function processNotification(id, appointmentDate, sendMail) {
  const { rows: claimed } = await pool.query(
    `UPDATE appointment_notifications SET status = 'processing', attempts = attempts + 1,
       processing_started_at = NOW()
     WHERE id = $1 AND appointment_date = $2::timestamptz
       AND ((status IN ('pending', 'queued', 'failed') AND next_attempt_at <= NOW())
         OR (status = 'processing' AND processing_started_at < NOW() - INTERVAL '5 minutes'))
     RETURNING appointment_id, appointment_date, recipient_user_id, attempts`,
    [id, appointmentDate]);
  if (!claimed[0]) return;
  const job = claimed[0];
  const { rows } = await pool.query(
    `SELECT a.status, a.appointment_date, a.owner_id, p.name AS pet_name, u.email,
       u.email_notifications_enabled
     FROM appointments a JOIN pets p ON p.id = a.pet_id JOIN users u ON u.id = a.owner_id
     WHERE a.id = $1`, [job.appointment_id]);
  const appointment = rows[0];
  if (!appointment || appointment.status !== 'upcoming' || !appointment.email_notifications_enabled ||
      appointment.owner_id !== job.recipient_user_id ||
      new Date(appointment.appointment_date).getTime() !== new Date(job.appointment_date).getTime() ||
      new Date(appointment.appointment_date).getTime() <= Date.now()) {
    await pool.query(
      `UPDATE appointment_notifications SET status = 'pending', next_attempt_at = NOW() + INTERVAL '1 minute',
         processing_started_at = NULL WHERE id = $1 AND appointment_date = $2::timestamptz AND status = 'processing'`,
      [id, appointmentDate]);
    return;
  }
  try {
    await sendMail({ to: appointment.email, ...appointmentEmail({
      pet_name: appointment.pet_name, appointment_date: appointment.appointment_date
    }) });
    await pool.query(
      `UPDATE appointment_notifications SET status = 'sent', sent_at = NOW(),
         processing_started_at = NULL, last_error = NULL
       WHERE id = $1 AND appointment_date = $2::timestamptz AND status = 'processing'`,
      [id, appointmentDate]);
  } catch (error) {
    const dead = job.attempts >= maxAttempts;
    await pool.query(
      `UPDATE appointment_notifications SET status = $3, next_attempt_at = NOW() + ($4::integer * INTERVAL '1 minute'),
         processing_started_at = NULL, last_error = LEFT($5, 500)
       WHERE id = $1 AND appointment_date = $2::timestamptz AND status = 'processing'`,
      [id, appointmentDate, dead ? 'dead' : 'failed', retryDelayMinutes(job.attempts), error.message ?? String(error)]);
    console.error(`Notification ${id} failed on attempt ${job.attempts}:`, error.message ?? error);
  }
}
