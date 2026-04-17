import jwt from 'jsonwebtoken';

export const requireAdmin = (req, res, next) => {
  if (!req.user?.roles?.includes('admin')) {
    return res.status(403).json({ 
      success: false, 
      message: 'Admin access required' 
    });
  }
  next();
};

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Also check for token in cookies
  const cookieToken = req.cookies?.accessToken;

  const finalToken = token || cookieToken;

  if (!finalToken) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(finalToken, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
    // Ensure roles is an array for backward compatibility
    if (user.role && !user.roles) {
      user.roles = [user.role];
    }
    // Map id to _id for consistency with MongoDB ObjectId usage
    user._id = user.id;
    req.user = user;
    next();
  });
};
