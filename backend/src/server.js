import { app } from './app.js';
import { pool } from './config/database.js';
import { env } from './config/env.js';

const server = app.listen(env.port, () => {
  console.log(`Pet Health Passport API listening on port ${env.port}`);
});

async function closeServer() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', closeServer);
process.on('SIGTERM', closeServer);

