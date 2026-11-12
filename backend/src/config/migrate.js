import { pool } from './database.js';

export async function migrate() {
  await pool.query(`CREATE TABLE IF NOT EXISTS pet_vet_access (
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    vet_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (pet_id, vet_id)
  )`);
  await pool.query('CREATE INDEX IF NOT EXISTS idx_pet_vet_access_vet_id ON pet_vet_access(vet_id)');
  await pool.query('ALTER TABLE medical_records ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL');
  await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE');
  await pool.query(`CREATE TABLE IF NOT EXISTS appointment_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
      CHECK (status IN ('pending', 'queued', 'processing', 'failed', 'sent', 'dead')),
    attempts INTEGER NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    queued_at TIMESTAMPTZ,
    processing_started_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  await pool.query('ALTER TABLE appointment_notifications ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE');
  await pool.query(`UPDATE appointment_notifications n SET recipient_user_id = a.owner_id
    FROM appointments a WHERE a.id = n.appointment_id AND n.recipient_user_id IS NULL`);
  await pool.query('ALTER TABLE appointment_notifications ALTER COLUMN recipient_user_id SET NOT NULL');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_appointment_notifications_due ON appointment_notifications(status, next_attempt_at)');
}
