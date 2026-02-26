import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getNotes,
  createNote,
  updateNote,
  shareNote,
  deleteNote
} from '../controllers/noteController.js';

const router = express.Router();

// All note routes require authentication
router.use(authenticateToken);

// Get all notes accessible to user
router.get('/', getNotes);

// Create new note
router.post('/', createNote);

// Update note
router.put('/:id', updateNote);

// Share note
router.patch('/share/:id', shareNote);

// Delete note
router.delete('/:id', deleteNote);

export default router;
