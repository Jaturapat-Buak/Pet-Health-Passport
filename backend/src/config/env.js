import 'dotenv/config';
import { randomBytes } from 'node:crypto';

const required = ['DATABASE_URL', 'JWT_SECRET'];

for (const key of required) {
  if (!process.env[key] && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.NODE_ENV === 'production' &&
    (process.env.JWT_SECRET === 'replace_with_a_long_random_secret' ||
     Buffer.byteLength(process.env.JWT_SECRET) < 32)) {
  throw new Error('JWT_SECRET must be a unique value of at least 32 bytes in production');
}

export const env = {
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? randomBytes(32).toString('hex'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000)
};
