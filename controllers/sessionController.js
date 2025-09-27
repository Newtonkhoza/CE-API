const { query } = require('../config/database');
const { getPagination } = require('../utils/pagination');

// Get all sessions with filtering
const getAllSessions = async (req, res) => {
  try {
    const { page = 1, size = 10, subject, hoster, status, date_from, date_to } = req.query;
    const { limit, offset } = getPagination(page, size);

    let whereConditions = ['1=1'];
    let queryParams = [limit, offset];
    let paramCount = 2;

    if (subject) {
      paramCount++;
      whereConditions.push(`s.subject = $${paramCount}`);
      queryParams.push(subject);
    }

    if (hoster) {
      paramCount++;
      whereConditions.push(`s.hoster = $${paramCount}`);
      queryParams.push(hoster);
    }

    if (date_from) {
      paramCount++;
      whereConditions.push(`s.start_time >= $${paramCount}`);
      queryParams.push(date_from);
    }

    if (date_to) {
      paramCount++;
      whereConditions.push(`s.start_time <= $${paramCount}`);
      queryParams.push(date_to);
    }

    const whereClause = whereConditions.join(' AND ');

    const sessionsQuery = `
      SELECT s.*, 
        sub.name as subject_name,
        COUNT(sp.student_id) as enrolled_count,
        CASE 
          WHEN t.id IS NOT NULL THEN t.name || ' ' || t.surname
          WHEN m.id IS NOT NULL THEN m.name || ' ' || m.surname
        END as hoster_name
      FROM sessions s
      LEFT JOIN subjects sub ON s.subject = sub.id
      LEFT JOIN teachers t ON s.hoster = t.id
      LEFT JOIN mentors m ON s.hoster = m.id
      LEFT JOIN session_participants sp ON s.id = sp.session_id
      WHERE ${whereClause}
      GROUP BY s.id, sub.name, t.id, t.name, t.surname, m.id, m.name, m.surname
      ORDER BY s.start_time DESC
      LIMIT $1 OFFSET $2
    `;

    const countQuery = `
      SELECT COUNT(*) FROM sessions s WHERE ${whereClause}
    `;

    const [sessionsResult, countResult] = await Promise.all([
      query(sessionsQuery, queryParams),
      query(countQuery, queryParams.slice(2))
    ]);

    res.json({
      sessions: sessionsResult.rows,
      pagination: {
        currentPage: parseInt(page),
        pageSize: parseInt(size),
        totalCount: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new session
const createSession = async (req, res) => {
  try {
    const { hoster, capacity, name, subject, description, duration, start_time } = req.body;

    if (!hoster || !capacity || !name || !subject || !duration || !start_time) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const result = await query(`
      INSERT INTO sessions (hoster, capacity, name, subject, description, duration, start_time)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [hoster, capacity, name, subject, description, duration, start_time]);

    res.status(201).json({
      message: 'Session created successfully',
      session: result.rows[0]
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Enroll student in session
const enrollStudent = async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;

    // Check if session exists and has capacity
    const sessionResult = await query(`
      SELECT s.capacity, COUNT(sp.student_id) as current_enrollment
      FROM sessions s
      LEFT JOIN session_participants sp ON s.id = sp.session_id
      WHERE s.id = $1
      GROUP BY s.id, s.capacity
    `, [sessionId]);

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const { capacity, current_enrollment } = sessionResult.rows[0];
    if (current_enrollment >= capacity) {
      return res.status(400).json({ error: 'Session is full' });
    }

    // Check if already enrolled
    const existingEnrollment = await query(
      'SELECT * FROM session_participants WHERE session_id = $1 AND student_id = $2',
      [sessionId, studentId]
    );

    if (existingEnrollment.rows.length > 0) {
      return res.status(400).json({ error: 'Student already enrolled in this session' });
    }

    await query(`
      INSERT INTO session_participants (session_id, student_id)
      VALUES ($1, $2)
    `, [sessionId, studentId]);

    res.json({ message: 'Student enrolled successfully' });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllSessions,
  createSession,
  enrollStudent
};