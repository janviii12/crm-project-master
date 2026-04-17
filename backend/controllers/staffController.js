import User from '../models/User.js';
import UserActivity from '../models/UserActivity.js';
import logger from '../utils/logger.js';

export const updateStatus = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const userId = req.user.id;

    const validActions = ['login', 'logout', 'lunch_start', 'lunch_end', 'meeting_start', 'meeting_end', 'outside_work_start', 'outside_work_end'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldStatus = user.currentStatus || 'offline';
    let newStatus = oldStatus;
    let description = '';

    switch (action) {
      case 'login':
        newStatus = 'online';
        description = 'Staff logged in';
        break;
      case 'logout':
        newStatus = 'offline';
        description = 'Staff logged out';
        break;
      case 'lunch_start':
        newStatus = 'lunch';
        description = `Lunch started${reason ? `: ${reason}` : ''}`;
        break;
      case 'lunch_end':
        newStatus = 'online';
        description = 'Lunch ended';
        break;
      case 'meeting_start':
        newStatus = 'meeting';
        description = `Meeting started${reason ? `: ${reason}` : ''}`;
        break;
      case 'meeting_end':
        newStatus = 'online';
        description = 'Meeting ended';
        break;
      case 'outside_work_start':
        newStatus = 'outside_work';
        description = `Outside work started${reason ? `: ${reason}` : ''}`;
        break;
      case 'outside_work_end':
        newStatus = 'online';
        description = 'Outside work ended';
        break;
    }

    // Update user status
    user.currentStatus = newStatus;
    await user.save();

    // Log activity
    const activity = new UserActivity({
      userId,
      activityType: action,
      description,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown',
      metadata: { reason, oldStatus, newStatus }
    });
    await activity.save();

    logger.info(`Staff status updated: ${userId} - ${action} (${oldStatus} → ${newStatus})`);

    res.json({ 
      success: true, 
      message: 'Status updated successfully',
      status: newStatus,
      activityId: activity._id 
    });
  } catch (error) {
    logger.error('Staff status update error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export default { updateStatus };
