import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get VAPID public key (no auth required for subscription)
router.get('/public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;

  if (!publicKey) {
    return res.status(500).json({
      success: false,
      message: 'VAPID public key not configured'
    });
  }

  res.json({
    publicKey: publicKey
  });
});

export default router;
