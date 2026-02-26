import express from 'express';
import {
  getUserGroups,
  createGroup,
  getGroupMessages,
  sendMessage,
  deleteMessage,
  markMessagesRead,
  deleteGroup,
  addGroupMember,
  removeGroupMember
} from '../controllers/chatController.js';
import { chatAccessMiddleware, chatModeratorMiddleware } from '../middleware/chatAccess.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication globally to all routes
router.use(authenticateToken);

// All chat routes require chat access
router.use(chatAccessMiddleware);

// Group management
router.get('/groups', getUserGroups);
router.post('/groups', createGroup);
router.delete('/groups/:groupId', deleteGroup);
router.post('/groups/:groupId/members', addGroupMember);
router.delete('/groups/:groupId/members/:userId', removeGroupMember);

// Message management
router.get('/groups/:groupId/messages', getGroupMessages);
router.post('/messages', sendMessage);
router.put('/messages/:messageId/read', markMessagesRead);

// Message deletion (permissions handled in controller)
router.delete('/messages/:messageId', chatAccessMiddleware, deleteMessage);

export default router;
