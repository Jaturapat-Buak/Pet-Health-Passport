import { Router } from 'express';
import { checkDatabaseConnection } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/', async (_request, response) => {
  try {
    await checkDatabaseConnection();
    response.json({ status: 'ok', database: 'connected', service: 'pet-health-passport-api' });
  } catch {
    response.status(503).json({ status: 'degraded', database: 'unavailable', service: 'pet-health-passport-api' });
  }
});

