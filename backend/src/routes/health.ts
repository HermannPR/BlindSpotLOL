import express from 'express';
import { connectDatabase, query } from '../config/database';

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: 'disconnected',
    memory: process.memoryUsage(),
  };

  let httpStatus = 200;

  try {
    // Test database connection
    await query('SELECT 1');
    healthCheck.database = 'connected';
  } catch (error) {
    healthCheck.database = 'error';
    httpStatus = 503;
  }

  res.status(httpStatus).json(healthCheck);
});

// Detailed metrics endpoint
router.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
  };

  res.json(metrics);
});

export default router;
