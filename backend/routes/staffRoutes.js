import express from 'express';
import logger from '../utils/logger.js';
import { authenticateToken } from '../middleware/auth.js';
import { createInteraction } from '../controllers/interactionController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Apply authentication globally to all routes
router.use(authenticateToken);

// Middleware to check staff role
const requireStaff = (req, res, next) => {
  if (!req.user || !req.user.roles || !req.user.roles.some(role => ['admin', 'manager', 'executive'].includes(role))) {
    logger.warn('Unauthorized staff access attempt', {
      userId: req.user?.id,
      roles: req.user?.roles,
      ip: req.ip
    });
    return res.status(403).json({
      success: false,
      message: 'Staff access required'
    });
  }
  next();
};

// Create new interaction (staff only)
router.post('/interactions', requireStaff, upload.array('images', 10), createInteraction);

export default router;
