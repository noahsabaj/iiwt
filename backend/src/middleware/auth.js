import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: { 
        message: 'Access token required',
        status: 401 
      } 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        error: { 
          message: 'Invalid or expired token',
          status: 403 
        } 
      });
    }

    req.user = user;
    next();
  });
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }

  next();
};

// Role-based access control
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: { 
          message: 'Authentication required',
          status: 401 
        } 
      });
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: { 
          message: 'Insufficient permissions',
          status: 403 
        } 
      });
    }

    next();
  };
};