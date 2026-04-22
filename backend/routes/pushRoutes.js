import express from 'express';
import pushRoutes from './routes/pushRoutes.js';
import { subscribeToPush, unsubscribeFromPush } from '../controllers/pushController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All push routes require authentication
router.use(authenticateToken);

// Subscribe to push notifications
router.post('/subscribe', subscribeToPush);

// Unsubscribe from push notifications
router.post('/unsubscribe', unsubscribeFromPush);

export default router;
