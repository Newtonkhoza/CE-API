const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');

const router = express.Router();

router.get('/', authenticateToken, getAllStudents);
router.get('/:id', authenticateToken, getStudentById);
router.post('/', authenticateToken, requireRole(['admin', 'teacher']), createStudent);
router.put('/:id', authenticateToken, requireRole(['admin', 'teacher']), updateStudent);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteStudent);

module.exports = router;