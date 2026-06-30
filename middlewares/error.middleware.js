import logger from '../utils/logger.js';

export const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log inside development/production configurations
  if (process.env.NODE_ENV === 'development') {
    logger.error(`Error [${err.statusCode}] at ${req.method} ${req.originalUrl}: ${err.message}\nStack: ${err.stack}`);
  } else {
    logger.error(`Error [${err.statusCode}] at ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  // Handle specific MongoDB/Mongoose validation issues
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(el => el.message);
    return res.status(400).json({
      status: 'fail',
      message: `Invalid input details: ${messages.join('. ')}`
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid field path location parameter: ${err.path}`
    });
  }

  if (err.code === 11000) {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    return res.status(409).json({
      status: 'fail',
      message: `Duplicate field key value: ${value}. Please use another value.`
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Invalid session token key. Please log in again.'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status: 'fail',
      message: 'Your session token has expired. Please refresh your session.'
    });
  }

  // Standard response formatting
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    });
  }

  // Fallback for system bugs
  return res.status(500).json({
    status: 'error',
    message: 'An unexpected internal error occurred on server.'
  });
};
