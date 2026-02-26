// backend/routes/customerRoutes.js
import express from 'express';
import upload from '../middleware/upload.js';
import { createCustomer, getCustomers, getCustomerById, updateCustomerStatus, assignWork, reassignTask, sendEmailNotification, getCustomerByEmail } from '../controllers/customerController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication globally to all routes
router.use(authenticateToken);

// Accept single file in field name 'file'
router.post('/create', upload.single('file'), createCustomer);

// Get all customers
router.get('/', getCustomers);

// Get customer by ID
router.get('/:id', getCustomerById);

// Get customer by email (for client status view)
router.get('/by-email/:email', getCustomerByEmail);

// Update customer status
router.put('/:id/status', updateCustomerStatus);

// Assign work to staff
router.put('/:id/assign', assignWork);

// Reassign task to different staff
router.patch('/:id/reassign', reassignTask);

// Send email notification
router.post('/:id/send-email', sendEmailNotification);

export default router;
