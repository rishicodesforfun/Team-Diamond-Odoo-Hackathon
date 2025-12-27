import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  // BYPASS AUTH - Allow requests without token for development
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Set a default userId for bypass mode
    req.userId = 1; // Default user ID
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', (err, user) => {
    if (err) {
      // If token is invalid, still allow with default user
      req.userId = 1;
      return next();
    }
    req.userId = user.userId;
    next();
  });
}

