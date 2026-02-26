import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { unlockStealth, getStealthMessages } from '../controllers/stealthController.js';

const router = express.Router();

// All stealth routes require authentication
router.use(authenticateToken);

// Unlock stealth chat access
router.post('/unlock', unlockStealth);

// Get stealth messages (optional endpoint, prefer socket)
router.get('/messages', getStealthMessages);

export default router;
