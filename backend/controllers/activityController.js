import UserActivity from '../models/UserActivity.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { differenceInMinutes, differenceInHours } from 'date-fns';

// GET STAFF ACTIVITIES
export const getStaffActivities = async (req, res) => {
  try {
    const { userId, limit = 100, page = 1, from_date, to_date, activityType } = req.query;

    // Public route - no auth check if no req.user
    if (!req.user) {
      // Allow any userId for post-logout display
    } else {
      const currentUserId = req.user._id?.toString();
      if (currentUserId && userId !== currentUserId && !req.user?.roles?.includes('admin')) {
        return res.status(403).json({ success: false, message: 'Forbidden - self-view or admin only' });
      }
    }
    
    if (!userId || userId === 'undefined') {
      return res.json({ success: true, data: [] });
    }

    let filter = { userId };
    
    // Executive self-view: only if authenticated
    // Build activityType filter safely
const excludedTypes = ['interaction', 'interaction_view', 'note_view', 'interaction_create', 'note_create', 'note_share'];

if (req.query.activityType && req.query.activityType !== 'all') {
  filter.activityType = {
    $eq: req.query.activityType,
    $nin: excludedTypes
  };
} else {
  filter.activityType = {
    $nin: excludedTypes
  };
}
    if (from_date) {
      filter.timestamp = filter.timestamp || {};
      filter.timestamp.$gte = new Date(from_date);
    }
    if (to_date) {
      filter.timestamp = filter.timestamp || {};
      filter.timestamp.$lte = new Date(to_date);
    }

    const skip = (page - 1) * limit;

    const activities = await UserActivity.find(filter)
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
    console.error('getStaffActivities ERROR:', error); // Better logging
    logger.error('getStaffActivities error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
};


// LOG ACTIVITY - SINGLE ROW START/END
export const logActivity = async (req, res) => {
  console.log('🎯 logActivity CONTROLLER HIT - action:', req.body.action, 'userId:', req.user?._id);
  try {
    // Handle public quick actions - extract userId safely
    let userId;
    
    // 1. From req.user (if auth middleware ran)
    if (req.user?._id) {
      userId = req.user._id;
    } 
    // 2. Decode JWT from header (public route)
    else {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          userId = payload._id || payload.userId || payload.id;
        } catch (e) {
          console.log('Token decode failed:', e.message);
        }
      }
    }
    
    if (!userId) {
      // For testing - use hardcoded userId from query/body
      userId = req.query.userId || req.body.userId || '69cfaffc04a97e0260d41b86';
      console.log('🆔 Using fallback userId:', userId);
    }
    
    console.log('✅ Final userId:', userId);

    
    const { action, startTime, endTime, currentStatus: frontendStatus, isIdle } = req.body;
    const now = new Date();

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }



    // QUICK ACTIONS - NEW RECORDS
    const quickActions = ['lunch_start', 'lunch_end', 'meeting_start', 'meeting_end', 'outside_work_start', 'outside_work_end'];

    if (quickActions.includes(action)) {
      if (action.includes('_start')) {
        // CREATE NEW ACTIVITY
        const activity = await UserActivity.create({
          userId,
          activityType: action,
          timestamp: now,
          metadata: {
            startTime: startTime || now.toISOString(),
            frontendStatus: 'ongoing'
          }
        });

        return res.json({ 
          success: true, 
          message: `${action.toUpperCase()} STARTED`,
          activityId: activity._id,
          newStatus: user.currentStatus
        });
      } else {
        // UPDATE EXISTING - FIND LATEST OPEN ACTIVITY OF SAME TYPE
        const baseType = action.replace('_end', '_start');
        const openActivity = await UserActivity.findOne({
          userId,
          activityType: baseType,
          'metadata.endTime': { $exists: false }
        }).sort({ timestamp: -1 });

        if (!openActivity) {
          return res.status(404).json({ success: false, message: 'No open activity found' });
        }

        openActivity.metadata.endTime = endTime || now.toISOString();
        openActivity.metadata.duration = differenceInMinutes(
          new Date(openActivity.metadata.endTime),
          new Date(openActivity.metadata.startTime)
        );
        openActivity.metadata.frontendStatus = 'completed';
        openActivity.markModified('metadata');
        await openActivity.save();

        return res.json({ 
          success: true, 
          message: `${action.toUpperCase()} COMPLETED`,
          duration: openActivity.metadata.duration,
          newStatus: 'online'
        });
      }
    }

    // LOGIN
    if (action === 'login') {
      await UserActivity.create({
        userId,
        activityType: 'login',
        timestamp: now,
        metadata: { startTime: now.toISOString() }
      });
      user.currentStatus = 'online';
      await user.save();
      return res.json({ success: true });
    }

    // LOGOUT - BULLETPROOF: Always succeed
    console.log(`🔥 LOGOUT for user ${userId} - payload:`, req.body);
    try {
      // Close any open login session if exists
      const lastLogin = await UserActivity.findOne({
        userId,
        activityType: 'login',
        'metadata.endTime': { $exists: false }
      }).sort({ timestamp: -1 });

      if (lastLogin) {
        lastLogin.metadata = lastLogin.metadata || {};
        lastLogin.metadata.endTime = now.toISOString();
        const start = new Date(lastLogin.metadata.startTime || lastLogin.timestamp);
        lastLogin.metadata.duration = differenceInMinutes(new Date(now), start);
        lastLogin.metadata.frontendStatus = 'completed';
        lastLogin.markModified('metadata');
        await lastLogin.save();
        console.log('Closed open login:', lastLogin._id);
      } else {
        console.log('No open login found - creating logout only');
      }

      // Always create logout record
      const logoutActivity = await UserActivity.create({
        userId,
        activityType: 'logout',
        timestamp: now,
        metadata: { 
          endTime: now.toISOString(),
          frontendStatus: 'completed'
        }
      });

      user.currentStatus = 'offline';
      await user.save();

      return res.json({ 
        success: true, 
        message: 'Logout completed successfully',
        logoutId: logoutActivity._id,
        hadOpenLogin: !!lastLogin
      });
    } catch (logoutError) {
      console.error('Logout error:', logoutError);
      // Still return success for frontend - don't break UX
      return res.json({ success: true, message: 'Logout recorded (DB update failed)' });
    }

    return res.status(400).json({ success: false, message: 'Invalid action' });
  } catch (error) {
    logger.error('logActivity:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// TODAY SUMMARY
export const getTodayStats = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || userId === 'undefined') {
      return res.json({ success: true, data: { loginTime: null, logoutTime: null, totalWorkingHours: 0, totalIdleTime: 0, breakHours: 0, productiveHours: 0, todayActivities: 0 } });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activities = await UserActivity.find({
      userId,
      timestamp: { $gte: today, $lt: tomorrow }
    }).sort({ timestamp: 1 });

    const loginActivity = activities.find(a => a.activityType === 'login');
    const logoutActivity = activities.find(a => a.activityType === 'logout');
    const endActivity = activities.find(a => a.metadata?.endTime) || activities[activities.length - 1];

    const loginTime = loginActivity?.metadata?.startTime || loginActivity?.timestamp;
    const logoutTime = logoutActivity?.metadata?.endTime || endActivity?.metadata?.endTime;

    let totalWorkingMs = 0;
    let breakMs = 0;
    let activityCount = activities.length;

    if (loginTime && logoutTime) {
      totalWorkingMs = new Date(logoutTime).getTime() - new Date(loginTime).getTime();
    }

    // Calculate break time only
    // activities.forEach(activity => {
    //   if (activity.metadata?.durationMs && ['lunch_start', 'outside_work_start'].includes(activity.activityType)) {
    //     breakMs += activity.metadata.durationMs || 0;
    //   }
    // });

    const totalIdleTime = 0;
    const totalBreakTime = breakMs / (1000 * 60 * 60);
    const totalWorkingHours = totalWorkingMs / (1000 * 60 * 60);
    const productiveHours = totalWorkingHours - totalBreakTime;

    res.json({
      success: true,
      data: {
        loginTime,
        logoutTime,
        totalWorkingHours: Number(totalWorkingHours.toFixed(2)),
        totalIdleTime: Number(totalIdleTime.toFixed(2)),
        breakHours: Number(totalBreakTime.toFixed(2)),
        productiveHours: Number(Math.max(0, productiveHours).toFixed(2)),
        todayActivities: activityCount
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
    if (!activity) return res.status(404).json({ success: false });

    if (endTime) {
      activity.metadata.endTime = new Date(endTime).toISOString();
    }

    await activity.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE ACTIVITY END TIME (NEW - fixes import error)
export const updateActivityEndTime = async (req, res) => {
  try {
    const { activityId } = req.params;
    const { endTime } = req.body;

    const activity = await UserActivity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    activity.metadata = activity.metadata || {};
    
    // Set end time
    const endTimeDate = endTime ? new Date(endTime).toISOString() : new Date().toISOString();
    activity.metadata.endTime = endTimeDate;

    // Calculate duration if startTime exists
    if (activity.metadata.startTime) {
      const start = new Date(activity.metadata.startTime);
      const end = new Date(endTimeDate);
      activity.metadata.duration = Math.round(differenceInMinutes(end, start) / 60 * 100) / 100; // hours, 2 decimals
    }

    activity.metadata.frontendStatus = 'completed';
    activity.markModified('metadata');
    await activity.save();

    res.json({ 
      success: true, 
      message: 'Activity end time updated',
      duration: activity.metadata.duration,
      endTime: activity.metadata.endTime 
    });
  } catch (error) {
    logger.error('updateActivityEndTime error:', error);
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


