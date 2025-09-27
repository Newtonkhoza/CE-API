const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getAllSessions,
  createSession,
  enrollStudent
} = require('../controllers/sessionController');

const router = express.Router();

router.get('/', authenticateToken, getAllSessions);
router.post('/', authenticateToken, requireRole(['admin', 'teacher', 'mentor']), createSession);
router.post('/enroll', authenticateToken, enrollStudent);

module.exports = router;