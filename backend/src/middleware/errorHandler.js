export const errorHandler = (err, req, res, next) => {
  // Log error for debugging (in production, use proper logging service)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err.stack);
  }

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Service Unavailable';
  }

  // Never expose internal error details in production
  if (process.env.NODE_ENV === 'production' && status === 500) {
    message = 'Internal Server Error';
  }

  res.status(status).json({
    error: {
      message,
      status,
      timestamp: new Date().toISOString()
    }
  });
};