import express from 'express';
import UserActivity from '../models/UserActivity.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication globally to all routes
router.use(authenticateToken);

// Get recent activities for admin/manager monitoring
router.get('/recent', async (req, res) => {
  try {
    // Only allow admin and manager roles
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('manager')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or manager role required.'
      });
    }

    const { limit = 50, activityType } = req.query;
    const limitNum = parseInt(limit, 10);

    let filter = {};
    if (activityType) {
      filter.activityType = activityType;
    }

    const activities = await UserActivity.find(filter)
      .populate('userId', 'name email roles')
      .sort({ createdAt: -1 })
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('getRecentActivities error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get activity statistics
router.get('/stats', async (req, res) => {
  try {
    // Only allow admin and manager roles
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('manager')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or manager role required.'
      });
    }

    const { period = '24h' } = req.query;

    let dateFilter = new Date();
    switch (period) {
      case '1h':
        dateFilter.setHours(dateFilter.getHours() - 1);
        break;
      case '24h':
        dateFilter.setHours(dateFilter.getHours() - 24);
        break;
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
      default:
        dateFilter.setHours(dateFilter.getHours() - 24);
    }

    const stats = await UserActivity.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: '$activityType',
          count: { $sum: 1 },
          lastActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    return res.status(200).json({
      success: true,
      data: stats,
      period
    });
  } catch (error) {
    console.error('getActivityStats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
