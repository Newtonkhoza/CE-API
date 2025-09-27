const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { validateEmail, validateGrade, validateIdNumber, sanitizeInput } = require('../utils/validation');
const { getPagination } = require('../utils/pagination');

// Get all students with pagination
const getAllStudents = async (req, res) => {
  try {
    const { page = 1, size = 10, grade, group_id, search } = req.query;
    const { limit, offset } = getPagination(page, size);

    let whereConditions = ['1=1'];
    let queryParams = [limit, offset];
    let paramCount = 2;

    if (grade) {
      paramCount++;
      whereConditions.push(`grade = $${paramCount}`);
      queryParams.push(grade);
    }

    if (group_id) {
      paramCount++;
      whereConditions.push(`group_id = $${paramCount}`);
      queryParams.push(group_id);
    }

    if (search) {
      paramCount++;
      whereConditions.push(`(name ILIKE $${paramCount} OR surname ILIKE $${paramCount} OR email ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const studentsQuery = `
      SELECT s.*, g.name as group_name, sch.name as school_name
      FROM students s
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN schools sch ON g.school = sch.id
      WHERE ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) FROM students s WHERE ${whereClause}
    `;

    const [studentsResult, countResult] = await Promise.all([
      query(studentsQuery, queryParams),
      query(countQuery, queryParams.slice(2))
    ]);

    res.json({
      students: studentsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(size),
        totalCount: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT s.*, g.name as group_name, sch.name as school_name
      FROM students s
      LEFT JOIN groups g ON s.group_id = g.id
      LEFT JOIN schools sch ON g.school = sch.id
      WHERE s.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new student
const createStudent = async (req, res) => {
  try {
    const {
      name, surname, email, grade, id_num, province, address, password, group_id
    } = req.body;

    // Validation
    if (!name || !surname || !email || !grade || !id_num || !province || !address || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validateGrade(grade)) {
      return res.status(400).json({ error: 'Grade must be between 1 and 12' });
    }

    // Check if email or ID number already exists
    const existingStudent = await query(
      'SELECT id FROM students WHERE email = $1 OR id_num = $2',
      [email, id_num]
    );

    if (existingStudent.rows.length > 0) {
      return res.status(400).json({ error: 'Email or ID number already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await query(`
      INSERT INTO students (name, surname, email, grade, id_num, province, address, password, group_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, surname, email, grade, created_at
    `, [
      sanitizeInput(name), sanitizeInput(surname), email, grade, 
      id_num, province, sanitizeInput(address), hashedPassword, group_id
    ]);

    res.status(201).json({
      message: 'Student created successfully',
      student: result.rows[0]
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update student
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, surname, email, grade, id_num, province, address, group_id
    } = req.body;

    // Check if student exists
    const existingStudent = await query('SELECT id FROM students WHERE id = $1', [id]);
    if (existingStudent.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if email or ID number conflicts with other students
    if (email || id_num) {
      const conflictQuery = `
        SELECT id FROM students 
        WHERE id != $1 AND (email = $2 OR id_num = $3)
      `;
      const conflictResult = await query(conflictQuery, [id, email, id_num]);
      if (conflictResult.rows.length > 0) {
        return res.status(400).json({ error: 'Email or ID number already exists' });
      }
    }

    const updateFields = [];
    const values = [];
    let paramCount = 0;

    if (name) { updateFields.push(`name = $${++paramCount}`); values.push(sanitizeInput(name)); }
    if (surname) { updateFields.push(`surname = $${++paramCount}`); values.push(sanitizeInput(surname)); }
    if (email) { updateFields.push(`email = $${++paramCount}`); values.push(email); }
    if (grade) { updateFields.push(`grade = $${++paramCount}`); values.push(grade); }
    if (id_num) { updateFields.push(`id_num = $${++paramCount}`); values.push(id_num); }
    if (province) { updateFields.push(`province = $${++paramCount}`); values.push(province); }
    if (address) { updateFields.push(`address = $${++paramCount}`); values.push(sanitizeInput(address)); }
    if (group_id !== undefined) { updateFields.push(`group_id = $${++paramCount}`); values.push(group_id); }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    const queryText = `
      UPDATE students 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await query(queryText, values);
    res.json({
      message: 'Student updated successfully',
      student: result.rows[0]
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query('DELETE FROM students WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};