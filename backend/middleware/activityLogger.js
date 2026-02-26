import UserActivity from '../models/UserActivity.js';

const activityLogger = (activityType, description, io = null) => {
  return async (req, res, next) => {
    // Get io instance from app if not provided
    const socketIo = io || req.app.get('io');

    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;
    const originalStatus = res.status;

    // Override res.json to log after response
    res.json = function(data) {
      // Log activity after successful response
      if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
        UserActivity.create({
          userId: req.user.id,
          activityType,
          description: description(req, data),
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
            query: req.query
          }
        }).then(activity => {
          // Emit real-time activity update if socket.io is available
          if (socketIo) {
            // Emit to user's activity room
            socketIo.to(`activity_${req.user.id}`).emit('new-activity', {
              activity: activity,
              timestamp: new Date()
            });

            // Also emit to admin/manager activity rooms for monitoring
            if (req.user.roles && (req.user.roles.includes('admin') || req.user.roles.includes('manager'))) {
              socketIo.to('activity_admin').emit('new-activity', {
                activity: activity,
                timestamp: new Date()
              });
              socketIo.to('activity_manager').emit('new-activity', {
                activity: activity,
                timestamp: new Date()
              });
            }
          }
        }).catch(err => console.error('Activity logging error:', err));
      }
      return originalJson.call(this, data);
    };

    // Override res.send for non-JSON responses
    res.send = function(data) {
      if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
        UserActivity.create({
          userId: req.user.id,
          activityType,
          description: description(req, data),
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          metadata: {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            params: req.params,
            query: req.query
          }
        }).then(activity => {
          // Emit real-time activity update if socket.io is available
          if (socketIo) {
            // Emit to user's activity room
            socketIo.to(`activity_${req.user.id}`).emit('new-activity', {
              activity: activity,
              timestamp: new Date()
            });

            // Also emit to admin/manager activity rooms for monitoring
            if (req.user.roles && (req.user.roles.includes('admin') || req.user.roles.includes('manager'))) {
              socketIo.to('activity_admin').emit('new-activity', {
                activity: activity,
                timestamp: new Date()
              });
              socketIo.to('activity_manager').emit('new-activity', {
                activity: activity,
                timestamp: new Date()
              });
            }
          }
        }).catch(err => console.error('Activity logging error:', err));
      }
      return originalSend.call(this, data);
    };

    next();
  };
};

export default activityLogger;
