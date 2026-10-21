import FollowUp from '../models/FollowUp.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import { createNotification } from './notificationController.js';
import { sendPushNotification } from './pushController.js';

// Get follow-ups for a user with role-based filtering
export const getFollowUps = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const { page = 1, limit = 10, status, startDate, endDate, clientId } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build filter conditions based on user role
    let filterConditions = {};

    if (user.roles.includes('admin')) {
      // Admin can see all tasks
      filterConditions = {};
    } else if (user.roles.includes('manager')) {
      // Manager can see their team's tasks
      // Get all users under this manager (assuming manager has team members)
      const teamMembers = await User.find({ managerId: userId });
      const teamMemberIds = teamMembers.map(member => member._id);
      filterConditions.$or = [
        { userId: { $in: [userId, ...teamMemberIds] } },
        { assignedTo: { $in: [userId, ...teamMemberIds] } }
      ];
    } else {
      // Executive/Sales can only see their own tasks or tasks assigned to them
      filterConditions.$or = [
        { userId: userId },
        { assignedTo: userId }
      ];
    }

    // Additional filters
    if (status) {
      filterConditions.status = status;
    }

    if (startDate && endDate) {
      filterConditions.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (clientId) {
      filterConditions.clientId = clientId;
    }

    // Get total count
    const total = await FollowUp.countDocuments(filterConditions);

    // Get follow-ups with populated data
    const followUps = await FollowUp.find(filterConditions)
      .populate('userId', 'name email')
      .populate({
        path: 'clientId',
        select: 'name email company'
      })
      .populate('assignedTo', 'name email')
      .populate('comments.createdBy', 'name email')
      .populate('timeline.by', 'name email')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum);

    return res.status(200).json({
      success: true,
      data: followUps,
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
    console.error('getFollowUps error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create a new follow-up
export const createFollowUp = async (req, res) => {
  try {
    const { clientId, title, description, date, time, reminderBefore, priority, assignedTo, category, subTasks, comments, progress } = req.body;
    const userId = req.user.id;

    // Validate client exists if clientId is provided
    if (clientId) {
      const client = await Customer.findById(clientId);
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client not found'
        });
      }
    }

    // Validate assignedTo users exist
    if (assignedTo && assignedTo.length > 0) {
      const assignedUsers = await User.find({ _id: { $in: assignedTo } });
      if (assignedUsers.length !== assignedTo.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more assigned users not found'
        });
      }
    }

    const followUp = new FollowUp({
      userId,
      clientId: clientId || null,
      title,
      description,
      date: new Date(date),
      time,
      reminderBefore: reminderBefore || 30,
      priority: priority || 'medium',
      assignedTo: assignedTo || [],
      category: category || '',
      subTasks: subTasks || [],
      comments: comments || [],
      progress: progress || 0
    });

    // Add initial timeline entry if status is set
    if (followUp.status !== 'pending') {
      followUp.timeline.push({
        status: followUp.status,
        by: userId,
        at: new Date()
      });
    }

    await followUp.save();

    // Populate the response
    await followUp.populate('userId', 'name email');
    if (followUp.clientId) {
      await followUp.populate('clientId', 'name email company');
    }
    await followUp.populate('assignedTo', 'name email');
    await followUp.populate('comments.createdBy', 'name email');
    await followUp.populate('timeline.by', 'name email');

    return res.status(201).json({
      success: true,
      data: followUp,
      message: 'Task created successfully'
    });
  } catch (error) {
    console.error('createFollowUp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update a follow-up
export const updateFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);
    const updates = req.body;

    // Find the follow-up
    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions - allow if creator, assigned, admin, or manager
    const isCreator = followUp.userId.toString() === userId;
    const isAssigned = followUp.assignedTo.some(assignedId => assignedId.toString() === userId);
    const hasPermission = user.roles.includes('admin') || user.roles.includes('manager') || isCreator || isAssigned;

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate assignedTo users if updating
    if (updates.assignedTo && updates.assignedTo.length > 0) {
      const assignedUsers = await User.find({ _id: { $in: updates.assignedTo } });
      if (assignedUsers.length !== updates.assignedTo.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more assigned users not found'
        });
      }
    }

    // Handle special updates
    if (updates.addComment) {
      // Add a new comment
      followUp.comments.push({
        text: updates.addComment,
        createdBy: userId,
        createdAt: new Date()
      });
      delete updates.addComment;
    }

    // Check if status is being updated for timeline
    const oldStatus = followUp.status;
    if (updates.status && updates.status !== oldStatus) {
      followUp.timeline.push({
        status: updates.status,
        by: userId,
        at: new Date()
      });
    }

    // Update the follow-up
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        followUp[key] = updates[key];
      }
    });

    // Rescheduling should send a fresh reminder
    if (followUp.isModified('date') || followUp.isModified('time') || followUp.isModified('reminderBefore')) {
      followUp.reminderSent = false;
    }

    await followUp.save();

    // Populate the response
    await followUp.populate('userId', 'name email');
    await followUp.populate('clientId', 'name email company');
    await followUp.populate('assignedTo', 'name email');
    await followUp.populate('comments.createdBy', 'name email');
    await followUp.populate('timeline.by', 'name email');

    return res.status(200).json({
      success: true,
      data: followUp,
      message: 'Task updated successfully'
    });
  } catch (error) {
    console.error('updateFollowUp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete a follow-up
export const deleteFollowUp = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Find the follow-up
    const followUp = await FollowUp.findById(id);
    if (!followUp) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up not found'
      });
    }

    // Check permissions
    if (!user.roles.includes('admin') && !user.roles.includes('manager') && followUp.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await FollowUp.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Follow-up deleted successfully'
    });
  } catch (error) {
    console.error('deleteFollowUp error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get upcoming reminders for a user
export const getUpcomingReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    const limit = parseInt(req.query.limit, 10) || 5;

    // Build filter conditions based on user role
    let filterConditions = { status: 'pending' };

    if (user.roles.includes('admin')) {
      // Admin can see all upcoming reminders
    } else if (user.roles.includes('manager')) {
      // Manager can see team's upcoming reminders
      const teamMembers = await User.find({ managerId: userId });
      const teamMemberIds = teamMembers.map(member => member._id);
      filterConditions.userId = { $in: [userId, ...teamMemberIds] };
    } else {
      // Executive/Sales can only see their own reminders
      filterConditions.userId = userId;
    }

    // Get upcoming follow-ups within next 7 days
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    filterConditions.date = {
      $gte: now,
      $lte: nextWeek
    };

    const reminders = await FollowUp.find(filterConditions)
      .populate({
        path: 'clientId',
        select: 'name company'
      })
      .sort({ date: 1, time: 1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: reminders
    });
  } catch (error) {
    console.error('getUpcomingReminders error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all reminder dates for a user (for login popup)
export const getAllReminderDates = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    // Build filter conditions based on user role
    let filterConditions = {};

    if (user.roles.includes('admin')) {
      // Admin can see all reminders
    } else if (user.roles.includes('manager')) {
      // Manager can see team's reminders
      const teamMembers = await User.find({ managerId: userId });
      const teamMemberIds = teamMembers.map(member => member._id);
      filterConditions.userId = { $in: [userId, ...teamMemberIds] };
    } else {
      // Executive/Sales can only see their own reminders
      filterConditions.userId = userId;
    }

    // Get all follow-ups with pending status (upcoming and today)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfYear = new Date(now.getFullYear(), 11, 31);

    filterConditions.date = {
      $gte: todayStart,
      $lte: endOfYear
    };
    filterConditions.status = { $ne: 'completed' };

    // Get all follow-ups and group by date
    const reminders = await FollowUp.find(filterConditions)
      .populate({
        path: 'clientId',
        select: 'name company'
      })
      .populate('userId', 'name')
      .sort({ date: 1, time: 1 })
      .select('date time title description clientId userId status priority');

    // Group by date
    const remindersByDate = {};
    reminders.forEach(reminder => {
      const dateKey = reminder.date.toISOString().split('T')[0];
      if (!remindersByDate[dateKey]) {
        remindersByDate[dateKey] = [];
      }
      remindersByDate[dateKey].push({
        _id: reminder._id,
        title: reminder.title,
        description: reminder.description,
        time: reminder.time,
        clientName: reminder.clientId?.name || 'Unknown',
        clientCompany: reminder.clientId?.company || '',
        handledBy: reminder.userId?.name || 'Unknown',
        status: reminder.status,
        priority: reminder.priority
      });
    });

    // Convert to array format
    const reminderDates = Object.keys(remindersByDate).map(date => ({
      date,
      count: remindersByDate[date].length,
      reminders: remindersByDate[date]
    }));

    return res.status(200).json({
      success: true,
      data: reminderDates,
      totalReminders: reminders.length,
      totalDates: reminderDates.length
    });
  } catch (error) {
    console.error('getAllReminderDates error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Check for reminders that need to be triggered (called by cron job)
export const checkReminders = async (io) => {
  try {
    const now = new Date();
    const DAY = 24 * 60 * 60 * 1000;

    // `date` is stored as midnight, so combine it with `time` to get the actual moment
    const getFollowUpDateTime = (followUp) =>
      new Date(`${followUp.date.toISOString().split('T')[0]}T${followUp.time}`);

    // Candidates: pending follow-ups around today that haven't been reminded yet
    const upcomingFollowUps = await FollowUp.find({
      status: 'pending',
      reminderSent: { $ne: true },
      date: { $gte: new Date(now.getTime() - DAY), $lte: new Date(now.getTime() + 2 * DAY) }
    }).populate('userId', 'name email').populate({
      path: 'clientId',
      select: 'name company'
    });

    for (const followUp of upcomingFollowUps) {
      try {
        const followUpDateTime = getFollowUpDateTime(followUp);
        const reminderTime = new Date(followUpDateTime.getTime() - (followUp.reminderBefore || 30) * 60 * 1000);

        // Fire once, any time between the reminder time and the follow-up itself
        if (now < reminderTime || now >= followUpDateTime || !followUp.userId) continue;

        // Claim it first so overlapping cron runs don't send duplicates
        const claimed = await FollowUp.updateOne(
          { _id: followUp._id, reminderSent: { $ne: true } },
          { $set: { reminderSent: true } }
        );
        if (claimed.modifiedCount === 0) continue;

        const minutesUntil = Math.max(1, Math.round((followUpDateTime - now) / (1000 * 60)));
        const withClient = followUp.clientId?.name ? ` with ${followUp.clientId.name}` : '';
        const message = `You have a follow-up${withClient} at ${followUp.time} (in ${minutesUntil} min)`;

        // Send real-time popup
        if (io) {
          io.to(`activity_${followUp.userId._id}`).emit('reminderAlert', {
            followUpId: followUp._id,
            title: followUp.title,
            clientName: followUp.clientId?.name || null,
            time: followUp.time,
            minutesUntil
          });
        }

        // Create in-app notification
        await createNotification(
          followUp.userId._id,
          'warning',
          `Follow-up Reminder: ${followUp.title}`,
          message,
          '/calendar',
          io
        );

        // Send push notification
        await sendPushNotification(
          followUp.userId._id,
          'Follow-up Reminder',
          message
        ).catch(err => console.error('checkReminders push error:', err));
      } catch (err) {
        console.error(`checkReminders error for follow-up ${followUp._id}:`, err);
      }
    }

    // Mark missed follow-ups (only once their actual date + time has passed)
    const missedCandidates = await FollowUp.find({
      status: { $in: ['pending', 'in-progress'] },
      date: { $lte: now }
    }).select('date time');

    const missedIds = missedCandidates
      .filter(followUp => getFollowUpDateTime(followUp) < now)
      .map(followUp => followUp._id);

    if (missedIds.length > 0) {
      await FollowUp.updateMany({ _id: { $in: missedIds } }, { status: 'missed' });
    }

  } catch (error) {
    console.error('checkReminders error:', error);
  }
};
