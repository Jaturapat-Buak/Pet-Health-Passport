import { readFile } from 'node:fs/promises';

try {
  const lastScan = Number(await readFile('/tmp/notification-worker-heartbeat', 'utf8'));
  if (!Number.isFinite(lastScan) || Date.now() - lastScan > 60000) throw new Error('Notification worker scan is stale');
  process.exit(0);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
