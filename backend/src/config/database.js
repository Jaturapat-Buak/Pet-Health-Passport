import { Pool } from 'pg';
import { env } from './env.js';

export const pool = new Pool(env.databaseUrl
  ? { connectionString: env.databaseUrl }
  : { host: env.databaseHost, database: env.databaseName, user: env.databaseUser,
      password: env.databasePassword, port: 5432 });

export async function checkDatabaseConnection() {
  await pool.query('SELECT 1');
}

