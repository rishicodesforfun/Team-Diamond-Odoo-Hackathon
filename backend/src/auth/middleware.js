import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  // BYPASS AUTH - Allow requests without token for development
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Set a default userId for bypass mode
    req.userId = 1; // Default user ID
    req.user = { id: 1, role: 'manager' }; // Default to manager for dev
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', (err, user) => {
    if (err) {
      // If token is invalid, still allow with default user
      req.userId = 1;
      req.user = { id: 1, role: 'manager' };
      return next();
    }
    req.userId = user.userId;
    req.user = { id: user.userId, email: user.email, role: user.role };
    next();
  });
}

// Role-based access control middleware
export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
}

