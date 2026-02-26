import express from 'express';
import { verifyAuditPassword, getLogs, updateAuditPassword } from '../controllers/logController.js';
import { authenticateToken } from '../middleware/auth.js';
const router = express.Router();

// All log routes require authentication and admin/developer role
router.use(authenticateToken);
router.use((req, res, next) => {
  if (!req.user.roles.includes('admin') && !req.user.roles.includes('developer')) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin or developer role required.' });
  }
  next();
});

// Update audit password
router.put('/password', updateAuditPassword);

// Verify audit password
router.post('/verify', verifyAuditPassword);

// Get logs (only accessible after password verification)
router.get('/', getLogs);

export default router;