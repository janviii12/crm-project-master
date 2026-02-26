import logger from '../utils/logger.js';

const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    user: req.user ? req.user.id : 'unauthenticated'
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    success: false,
    message: isDevelopment ? err.message : 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack })
  });
};

export default errorHandler;
