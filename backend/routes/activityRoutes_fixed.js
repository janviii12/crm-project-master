import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { 
  getStaffActivities, 
  getTodaySummary, 
  updateActivityEndTime, 
  logActivity, 
  updateActivity, 
  deleteActivity 
} from '../controllers/activityController.js';

const router = express.Router();

// ✅ PUBLIC: Post-logout activity display (no auth)
router.get('/', getStaffActivities);
router.get('/today-summary', getTodaySummary);

// ✅ PROTECTED: Mutations + admin routes
router.use(authenticateToken);

router.post('/activity-log', logActivity);
router.put('/end-time/:activityId', updateActivityEndTime);
router.put('/:activityId/update', updateActivity);
router.delete('/:activityId', deleteActivity);

router.get('/recent', async (req, res) => {
  try {
    if (!req.user.roles?.includes('admin') && !req.user.roles?.includes('manager')) {
      return res.status(403).json({ success: false, message: 'Admin/Manager required' });
    }

    const { limit = 50, activityType } = req.query;
    const limitNum = parseInt(String(limit), 10);

    let filter = {};
    if (activityType) filter.activityType = activityType;

    const activities = await UserActivity.find(filter)
      .populate('userId', 'name email roles')
      .sort({ createdAt: -1 })
      .limit(limitNum);

    return res.status(200).json({ success: true, data: activities });
  } catch (error) {
    console.error('getRecentActivities error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    if (!req.user.roles?.includes('admin') && !req.user.roles?.includes('manager')) {
      return res.status(403).json({ success: false, message: 'Admin/Manager required' });
    }

    const { period = '24h' } = req.query;
    let dateFilter = new Date();
    switch (period) {
      case '1h': dateFilter.setHours(dateFilter.getHours() - 1); break;
      case '24h': dateFilter.setHours(dateFilter.getHours() - 24); break;
      case '7d': dateFilter.setDate(dateFilter.getDate() - 7); break;
      case '30d': dateFilter.setDate(dateFilter.getDate() - 30); break;
    }

    const stats = await UserActivity.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      { $group: { _id: '$activityType', count: { $sum: 1 }, lastActivity: { $max: '$createdAt' } } },
      { $sort: { count: -1 } }
    ]);

    return res.status(200).json({ success: true, data: stats, period });
  } catch (error) {
    console.error('getActivityStats error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

