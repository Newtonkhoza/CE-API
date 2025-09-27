const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and get their role
const userQueries = [
  query("SELECT id, email, role FROM admin WHERE id = $1 AND EXISTS (SELECT 1 FROM admin WHERE id = $1)", [decoded.userId]),
  query("SELECT id, email, 'teacher' as role FROM teachers WHERE id = $1", [decoded.userId]),
  query("SELECT id, email, 'mentor' as role FROM mentors WHERE id = $1", [decoded.userId]),
  query("SELECT id, email, 'student' as role FROM students WHERE id = $1", [decoded.userId])
];
    const results = await Promise.all(userQueries);
    const user = results.find(result => result.rows.length > 0);
    
    if (!user) {
      return res.status(403).json({ error: 'User not found' });
    }

    req.user = { ...user.rows[0], userId: decoded.userId };
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };