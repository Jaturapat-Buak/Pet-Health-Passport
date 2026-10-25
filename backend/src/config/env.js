import 'dotenv/config';
import { randomBytes } from 'node:crypto';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET) throw new Error('Missing required environment variable: JWT_SECRET');
  if (!process.env.DATABASE_URL) {
    for (const key of ['POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD']) {
      if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
    }
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
  databaseHost: process.env.POSTGRES_HOST,
  databaseName: process.env.POSTGRES_DB,
  databaseUser: process.env.POSTGRES_USER,
  databasePassword: process.env.POSTGRES_PASSWORD,
  jwtSecret: process.env.JWT_SECRET ?? randomBytes(32).toString('hex'),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 5000)
};
