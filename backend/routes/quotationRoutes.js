import express from 'express';
import {
  createQuotation,
  getQuotations,
  updateQuotation,
  deleteQuotation,
  generatePDF,
  uploadQuotationFile,
  downloadUploadedFile
} from '../controllers/quotationController.js';
import { authenticateToken } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

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

// Upload quotation file (admin, manager, executive)
router.post('/:id/upload', (req, res, next) => {
  if (!['admin', 'manager', 'executive'].some(role => req.user.roles.includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}, upload.single('file'), uploadQuotationFile);

// Download uploaded file (admin, manager, executive)
router.get('/:id/download', (req, res, next) => {
  if (!['admin', 'manager', 'executive'].some(role => req.user.roles.includes(role))) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
}, downloadUploadedFile);

export default router;
