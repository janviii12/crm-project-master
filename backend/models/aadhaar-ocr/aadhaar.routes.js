
import express from 'express';
const router = express.Router();
import { uploadAadhaar, generateExcelController, downloadExcel, deleteExcelController } from './aadhaar.controller.js';
import { authenticateToken } from '../../middleware/auth.js'; // if you have auth
import upload from '../../middleware/multer-temp.js'; // temp upload only

// Upload Aadhaar PDF / Image (one by one)
router.post(
  '/upload',
  authenticateToken,
  upload.single('aadhaar'),
  uploadAadhaar
);

// Generate final Excel
router.post(
  '/generate-excel',
  authenticateToken,
  generateExcelController
);

// Download Excel
router.get(
  '/excel/:id',
  authenticateToken,
  downloadExcel
);

// Delete Excel
router.delete(
  '/excel/:id',
  authenticateToken,
  deleteExcelController
);

export default router;
