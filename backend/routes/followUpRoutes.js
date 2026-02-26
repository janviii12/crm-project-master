import express from 'express';
import {
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  getUpcomingReminders,
  getAllReminderDates
} from '../controllers/followUpController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All follow-up routes require authentication
router.use(authenticateToken);

// Get follow-ups with pagination and filters
router.get('/', getFollowUps);

// Get upcoming reminders
router.get('/reminders', getUpcomingReminders);

// Get all reminder dates (for login popup)
router.get('/reminder-dates', getAllReminderDates);

// Create a new follow-up
router.post('/', createFollowUp);

// Update a follow-up
router.patch('/:id', updateFollowUp);

// Delete a follow-up
router.delete('/:id', deleteFollowUp);

export default router;
