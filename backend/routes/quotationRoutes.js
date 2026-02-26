import express from 'express';
import {
  createQuotation,
  getQuotations,
  updateQuotation,
  deleteQuotation,
  generatePDF
} from '../controllers/quotationController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication globally to all routes
router.use(authenticateToken);

// Create quotation (admin, manager, executive)
router.post('/', (req, res, next) => {
  if (!['admin', 'manager', 'executive'].some(role => req.user.roles.includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}, createQuotation);

// Get all quotations (admin, manager, executive)
router.get('/', (req, res, next) => {
  if (!['admin', 'manager', 'executive'].some(role => req.user.roles.includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}, getQuotations);

// Update quotation (admin, manager, executive)
router.put('/:id', (req, res, next) => {
  if (!['admin', 'manager', 'executive'].some(role => req.user.roles.includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}, updateQuotation);

// Delete quotation (admin only)
router.delete('/:id', (req, res, next) => {
  if (!req.user.roles.includes('admin')) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}, deleteQuotation);

// Generate PDF (admin, manager, executive)
router.get('/:id/pdf', (req, res, next) => {
  if (!['admin', 'manager', 'executive'].some(role => req.user.roles.includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}, generatePDF);

export default router;
