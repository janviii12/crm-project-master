import express from 'express';
import {
  uploadExcel,
  getExcelFiles,
  getExcelFile,
  updateExcelFile,
  addNote,
  downloadExcelFile,
  deleteExcelFile
} from '../controllers/excelController.js';
import { authenticateToken as auth } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Upload Excel file
router.post('/upload', upload.single('excelFile'), uploadExcel);

// Get all Excel files
router.get('/', getExcelFiles);

// Get specific Excel file data
router.get('/:id/view', getExcelFile);

// Update Excel file data
router.put('/:id/update', updateExcelFile);

// Add note to Excel file
router.post('/:id/notes', addNote);

// Download Excel file (executive/admin/manager only)
router.get('/:id/download', auth, async (req, res, next) => {
  try {
    const User = await import('../models/User.js').then(m => m.default);
    const user = await User.findById(req.user.id);
    if (!user || (!user.roles.includes('executive') && !user.roles.includes('admin') && !user.roles.includes('manager'))) {
      return res.status(403).json({ success: false, message: 'Access denied. Executive, Admin or Manager role required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}, downloadExcelFile);

// Delete Excel file (admin/manager only)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const user = await import('../models/User.js').then(m => m.default.findById(req.user.id));
    if (!user || (!user.roles.includes('admin') && !user.roles.includes('manager'))) {
      return res.status(403).json({ success: false, message: 'Access denied. Admin or Manager role required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}, deleteExcelFile);

export default router;
