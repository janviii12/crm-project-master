import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Get notifications for a user with pagination and filters
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, filter = 'all', search = '' } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions
    let filterConditions = { user: userId };

    if (filter === 'unread') {
      filterConditions.read = false;
    } else if (filter === 'read') {
      filterConditions.read = true;
    }

    // Add search functionality
    if (search) {
      filterConditions.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const total = await Notification.countDocuments(filterConditions);

    // Get notifications
    const notifications = await Notification.find(filterConditions)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await Notification.countDocuments({
      user: userId,
      read: false
    });

    return res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { user: userId, read: false },
      { read: true, readAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      user: userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create notification (internal function)
export const createNotification = async (userId, type, title, message, link = null, io = null) => {
  try {
    const notification = new Notification({
      user: userId,
      type,
      title,
      message,
      link
    });

    await notification.save();

    // Emit real-time notification if socket.io is available
    if (io) {
      io.to(`activity_${userId}`).emit('new-notification', {
        notification: notification,
        timestamp: new Date()
      });
    }

    return notification;
  } catch (error) {
    console.error('createNotification error:', error);
    throw error;
  }
};

// Create notification for multiple users (for broadcasts)
export const createBulkNotifications = async (userIds, type, title, message, link = null) => {
  try {
    const notifications = userIds.map(userId => ({
      user: userId,
      type,
      title,
      message,
      link
    }));

    const result = await Notification.insertMany(notifications);
    return result;
  } catch (error) {
    console.error('createBulkNotifications error:', error);
    throw error;
  }
};
