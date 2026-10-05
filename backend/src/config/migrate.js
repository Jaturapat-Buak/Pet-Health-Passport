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
}
