export const requestLogger = (req, res, next) => {
  // Only log in development to avoid exposing information
  if (process.env.NODE_ENV === 'development') {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });
  }
  
  next();
};