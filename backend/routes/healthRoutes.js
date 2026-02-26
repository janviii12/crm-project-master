import express from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const router = express.Router();

// Health check route
router.get('/', (req, res) => {
  const healthData = {
    status: "ok",
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  };

  logger.info('Health check requested', {
    uptime: healthData.uptime,
    db: healthData.db,
    ip: req.ip || req.connection.remoteAddress
  });

  res.status(200).json(healthData);
});

export default router;
