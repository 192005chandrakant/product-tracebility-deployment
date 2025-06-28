const jwt = require('jsonwebtoken');

exports.auth = (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Accepts a single role or an array of roles
exports.requireRole = (roles) => (req, res, next) => {
  if (!req.user) return res.status(403).json({ error: 'Forbidden' });
  if (Array.isArray(roles)) {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  } else {
    if (req.user.role !== roles) return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}; 