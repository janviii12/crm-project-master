import Note from '../models/Note.js';
import UserActivity from '../models/UserActivity.js';
import logger from '../utils/logger.js';

// Get all notes accessible to the user
export const getNotes = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    // Find notes created by user or shared with user
    const notes = await Note.find({
      $or: [
        { createdBy: userId },
        { 'sharedWith.userId': userId },
        // If admin, show all notes
        ...(userRoles.includes('admin') ? [{}] : [])
      ]
    })
    .populate('createdBy', 'name email')
    .populate('sharedWith.userId', 'name email')
    .sort({ updatedAt: -1 });

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'note_view',
      description: `Viewed notes (count: ${notes.length})`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { noteCount: notes.length }
    });

    res.json({
      success: true,
      data: notes
    });
  } catch (error) {
    logger.error('Error fetching notes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notes'
    });
  }
};

// Create new note
export const createNote = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required'
      });
    }

    const note = new Note({
      title,
      content,
      createdBy: req.user.id
    });

    await note.save();

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'note_create',
      description: `Created note: ${title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { noteId: note._id, title }
    });

    logger.info(`Note created by ${req.user.name}: ${title}`);

    res.status(201).json({
      success: true,
      data: note,
      message: 'Note created successfully'
    });
  } catch (error) {
    logger.error('Error creating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create note'
    });
  }
};

// Update note
export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check permissions
    const isOwner = note.createdBy.toString() === userId;
    const isShared = note.sharedWith.some(shared =>
      shared.userId.toString() === userId && shared.permission === 'write'
    );
    const isAdmin = userRoles.includes('admin');

    if (!isOwner && !isShared && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    // Update note
    note.title = title || note.title;
    note.content = content || note.content;
    note.updatedAt = new Date();
    await note.save();

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'note_edit',
      description: `Edited note: ${note.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { noteId: note._id, title: note.title }
    });

    logger.info(`Note updated by ${req.user.name}: ${note.title}`);

    res.json({
      success: true,
      data: note,
      message: 'Note updated successfully'
    });
  } catch (error) {
    logger.error('Error updating note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update note'
    });
  }
};

// Share note
export const shareNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, role, permission } = req.body;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user can share (owner or admin)
    const isOwner = note.createdBy.toString() === userId;
    const isAdmin = userRoles.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only note owner or admin can share'
      });
    }

    // Validate permission
    if (!['read', 'write'].includes(permission)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid permission type'
      });
    }

    // Add sharing entries
    const newShares = userIds.map(userId => ({
      userId,
      role: role || null,
      permission
    }));

    // Remove existing shares for these users and add new ones
    note.sharedWith = note.sharedWith.filter(shared =>
      !userIds.includes(shared.userId.toString())
    );
    note.sharedWith.push(...newShares);

    await note.save();

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'note_share',
      description: `Shared note "${note.title}" with ${userIds.length} user(s)`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { noteId: note._id, title: note.title, sharedWith: userIds, permission }
    });

    logger.info(`Note shared by ${req.user.name}: ${note.title} with ${userIds.length} users`);

    res.json({
      success: true,
      data: note,
      message: 'Note shared successfully'
    });
  } catch (error) {
    logger.error('Error sharing note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share note'
    });
  }
};

// Delete note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRoles = req.user.roles || [];

    const note = await Note.findById(id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check permissions (only owner or admin can delete)
    const isOwner = note.createdBy.toString() === userId;
    const isAdmin = userRoles.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied'
      });
    }

    await Note.findByIdAndDelete(id);

    // Log activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'note_delete',
      description: `Deleted note: ${note.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      metadata: { noteId: id, title: note.title }
    });

    logger.info(`Note deleted by ${req.user.name}: ${note.title}`);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete note'
    });
  }
};
