import jwt from 'jsonwebtoken';

export const chatAccessMiddleware = (req, res, next) => {
  // First authenticate the token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    // Ensure roles is an array for backward compatibility
    if (user.role && !user.roles) {
      user.roles = [user.role];
    }

    // Check if user has chat access roles
    const hasAccess = user.roles && user.roles.includes('developer');
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Chat access requires developer role.'
      });
    }

    req.user = user;
    next();
  });
};

// Middleware to check if user can moderate (delete messages)
export const chatModeratorMiddleware = (req, res, next) => {
  const hasAccess = req.user.roles && req.user.roles.includes('developer') && req.user.isChatModerator;
  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Message moderation requires chat moderator permission.'
    });
  }
  next();
};
