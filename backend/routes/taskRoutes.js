import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  updateTaskStatus,
  getTaskStats
} from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/tasks - Get all tasks with filtering
router.get('/', getTasks);

// GET /api/tasks/stats - Get task statistics
router.get('/stats', getTaskStats);

// GET /api/tasks/:id - Get single task
router.get('/:id', getTaskById);

// POST /api/tasks - Create new task
router.post('/', createTask);

// PUT /api/tasks/:id - Update task
router.put('/:id', updateTask);

// PATCH /api/tasks/:id/status - Update task status
router.patch('/:id/status', updateTaskStatus);

// PUT /api/tasks/:id/status - Update task status (for compatibility)
router.put('/:id/status', updateTaskStatus);

// POST /api/tasks/:id/comments - Add comment to task
router.post('/:id/comments', addComment);

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', deleteTask);

export default router;
