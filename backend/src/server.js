import { app } from './app.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';
import { migrate } from './config/migrate.js';

let server;

async function start() {
  await migrate();
  server = app.listen(env.port, () => {
    console.log(`Pet Health Passport API listening on port ${env.port}`);
  });
}

start().catch(async (error) => {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
  await pool.end();
});

async function closeServer() {
  if (!server) {
    await pool.end();
    return;
  }
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);

