const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
  res.json({ message: 'Mentors endpoint' });
});

module.exports = router;