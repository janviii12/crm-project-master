import UserActivity from '../models/UserActivity.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { differenceInMinutes, differenceInHours } from 'date-fns';

// GET STAFF ACTIVITIES
export const getStaffActivities = async (req, res) => {
  try {
    const { userId, limit = 100, page = 1 } = req.query;

    if (!userId || userId === 'undefined') {
      return res.json({ success: true, data: [] });
    }

    const skip = (page - 1) * limit;

    const activities = await UserActivity.find({ userId })
      .populate('userId', 'name email roles currentStatus')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await UserActivity.countDocuments({ userId });

    res.json({
      success: true,
      data: activities,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// LOG ACTIVITY (LOGIN/LOGOUT + QUICK ACTIONS)
export const logActivity = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { action } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const now = new Date();

    // LOGIN
    if (action === 'login') {
      const activity = await UserActivity.create({
        userId,
        activityType: 'login',
        timestamp: now,
        metadata: {
          startTime: now.toISOString()
        }
      });

      user.currentStatus = 'online';
      await user.save();

      return res.json({ success: true, activity });
    }

    // LOGOUT
    if (action === 'logout') {
      console.log('🔥 LOGOUT - updating login row');
      const lastLogin = await UserActivity.findOne({
        userId,
        activityType: 'login'
      }).sort({ timestamp: -1 });

      if (lastLogin) {
        const loginTime = new Date(lastLogin.timestamp);
        const durationMinutes = differenceInMinutes(now, loginTime);

        lastLogin.metadata = {
          ...(lastLogin.metadata || {}),
          startTime: loginTime.toISOString(),
          sessionEndTime: now.toISOString(),
          endTime: now.toISOString(),
          sessionDurationMinutes: durationMinutes
        };

        lastLogin.markModified('metadata');
        await lastLogin.save();
      }

      user.currentStatus = 'offline';
      await user.save();

      return res.json({
        success: true,
        message: 'Logout logged',
        durationMinutes: lastLogin ? durationMinutes : 0
      });
    }

    // QUICK ACTIONS (lunch_start, meeting_end, etc.)
    const quickActions = [
      'lunch_start', 'lunch_end',
      'meeting_start', 'meeting_end',
      'outside_work_start', 'outside_work_end'
    ];

    if (quickActions.includes(action)) {
      const activity = await UserActivity.create({
        userId,
        activityType: action,
        timestamp: now,
        metadata: {
          ...req.body,
          userStatus: user.currentStatus,
          ipAddress: req.ip
        }
      });

      // Update status
      if (action.includes('_end')) {
        user.currentStatus = 'online';
      } else if (action.includes('_start')) {
        const type = action.split('_')[0];
        user.currentStatus = `${type}_active`;
      }

      await user.save();

      return res.json({ 
        success: true,
        message: `${action.replace('_', ' ').toUpperCase()} logged!`,
        newStatus: user.currentStatus,
        activity 
      });
    }

    return res.status(400).json({ success: false, message: `Invalid action: ${action}` });
  } catch (error) {
    logger.error('logActivity error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// TODAY SUMMARY
export const getTodaySummary = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || userId === 'undefined') {
      return res.json({ success: true, data: {} });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const activities = await UserActivity.find({
      userId,
      timestamp: { $gte: today, $lt: tomorrow }
    }).sort({ timestamp: 1 });

    const login = activities.find(a => a.activityType === 'login');
    const logout = activities.find(a => a.activityType === 'logout') || 
                   activities.filter(a => a.activityType.includes('_end')).pop();

    let loginTime = login?.metadata?.startTime || login?.timestamp || null;
    let logoutTime = logout?.metadata?.sessionEndTime || logout?.timestamp || null;

    let totalWorkingHours = 0;
    if (loginTime && logoutTime) {
      totalWorkingHours = differenceInHours(new Date(logoutTime), new Date(loginTime));
    }

    return res.json({
      success: true,
      data: {
        loginTime,
        logoutTime,
        totalWorkingHours: Number(totalWorkingHours.toFixed(2))
      }
    });

  } catch (error) {
    logger.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE ACTIVITY
export const updateActivity = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { endTime } = req.body;

    const activity = await UserActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false });
    }

    activity.metadata = activity.metadata || {};

    if (endTime) {
      activity.metadata.endTime = new Date(endTime).toISOString();
    }

    if (activity.metadata.startTime && activity.metadata.endTime) {
      activity.metadata.duration = differenceInMinutes(
        new Date(activity.metadata.endTime),
        new Date(activity.metadata.startTime)
      ) / 60;
    }

    await activity.save();

    res.json({ success: true, message: 'Updated' });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE
export const deleteActivity = async (req, res) => {
  try {
    await UserActivity.findByIdAndDelete(req.params.activityId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

