import { Pool } from 'pg';
import { env } from './env.js';

export const pool = new Pool({
  connectionString: env.databaseUrl
});

export async function checkDatabaseConnection() {
  await pool.query('SELECT 1');
}

