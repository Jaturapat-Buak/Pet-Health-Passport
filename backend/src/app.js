import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { healthRecordsRouter } from './routes/health-records.routes.js';
import { petsRouter } from './routes/pets.routes.js';

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/pets', petsRouter);
app.use('/api', healthRecordsRouter);
app.use(notFound);
app.use(errorHandler);
