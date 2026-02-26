import Task from '../models/Task.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

// Get all tasks with filtering and pagination
export const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      assignedTo,
      search,
      dateRange,
      overdue,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    let filter = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Assigned to filter
    if (assignedTo && assignedTo !== 'all') {
      filter.assignedTo = { $in: [assignedTo] };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateRange) {
      const { start, end } = JSON.parse(dateRange);
      if (start || end) {
        filter.dueDate = {};
        if (start) filter.dueDate.$gte = new Date(start);
        if (end) filter.dueDate.$lte = new Date(end);
      }
    }

    // Overdue filter
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'completed' };
    }

    // Role-based filtering
    if (req.user.roles.includes('executive')) {
      // Executives can only see tasks assigned to them
      filter.assignedTo = { $in: [req.user._id] };
    } else if (req.user.roles.includes('manager')) {
      // Managers can see all tasks
      // No additional filter needed
    } else if (req.user.roles.includes('admin')) {
      // Admins can see all tasks
      // No additional filter needed
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.createdBy', 'name email')
      .populate('clientId', 'name email phone type serviceType')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// Get single task by ID
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.createdBy', 'name email')
      .populate('clientId', 'name email phone type serviceType');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user has permission to view this task
    if (req.user.roles.includes('executive') &&
        !task.assignedTo.some(user => user._id.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });

  } catch (error) {
    logger.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message
    });
  }
};

// Create new task
export const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status = 'pending',
      priority = 'medium',
      progress = 0,
      assignedTo = [],
      category,
      dueDate,
      subTasks = [],
      clientId
    } = req.body;

    // Validate required fields
    if (!title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and due date are required'
      });
    }

    // Validate assigned users exist and are executives
    if (assignedTo && assignedTo.length > 0) {
      const users = await User.find({ _id: { $in: assignedTo }, roles: 'executive' });
      if (users.length !== assignedTo.length) {
        return res.status(400).json({
          success: false,
          message: 'All assigned users must be executives'
        });
      }
    }

    // Create task
    const task = new Task({
      title,
      description,
      status,
      priority,
      progress,
      assignedTo,
      category,
      dueDate,
      subTasks,
      createdBy: req.user._id,
      clientId
    });

    await task.save();

    // Populate the created task
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('clientId', 'name email phone type serviceType');

    logger.info(`Task created: ${task.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });

  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// Update task
export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the task first
    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.user.roles.includes('executive') &&
        !task.assignedTo.some(user => user.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate assigned users if being updated
    if (updates.assignedTo && updates.assignedTo.length > 0) {
      const users = await User.find({ _id: { $in: updates.assignedTo }, roles: 'executive' });
      if (users.length !== updates.assignedTo.length) {
        return res.status(400).json({
          success: false,
          message: 'All assigned users must be executives'
        });
      }
    }

    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .populate('comments.createdBy', 'name email')
    .populate('clientId', 'name email phone type serviceType');

    logger.info(`Task updated: ${updatedTask.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      data: updatedTask,
      message: 'Task updated successfully'
    });

  } catch (error) {
    logger.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// Delete task
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Only admin and manager can delete tasks
    if (!req.user.roles.includes('admin') && !req.user.roles.includes('manager')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Task.findByIdAndDelete(id);

    logger.info(`Task deleted: ${task.title} by ${req.user.email}`);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

// Add comment to task
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment text is required'
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.user.roles.includes('executive') &&
        !task.assignedTo.some(user => user.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const comment = {
      text: text.trim(),
      createdBy: req.user._id,
      createdAt: new Date()
    };

    task.comments.push(comment);
    await task.save();

    // Populate the new comment
    await task.populate('comments.createdBy', 'name email');

    const newComment = task.comments[task.comments.length - 1];

    res.status(200).json({
      success: true,
      data: newComment,
      message: 'Comment added successfully'
    });

  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding comment',
      error: error.message
    });
  }
};

// Update task status
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'in-progress', 'blocked', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check permissions
    if (req.user.roles.includes('executive') &&
        !task.assignedTo.some(user => user.toString() === req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    task.status = status;
    if (status === 'completed') {
      task.progress = 100;
    }
    await task.save();

    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      data: task,
      message: 'Task status updated successfully'
    });

  } catch (error) {
    logger.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating task status',
      error: error.message
    });
  }
};

// Get task statistics
export const getTaskStats = async (req, res) => {
  try {
    let filter = {};

    // Role-based filtering for stats
    if (req.user.roles.includes('executive')) {
      filter.assignedTo = { $in: [req.user._id] };
    }

    const stats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          blocked: { $sum: { $cond: [{ $eq: ['$status', 'blocked'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'completed'] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      blocked: 0,
      completed: 0,
      overdue: 0
    };

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error fetching task stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task statistics',
      error: error.message
    });
  }
};
