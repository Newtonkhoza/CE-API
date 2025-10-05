require('dotenv').config();
const cors = require('cors');
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
});

// ==================== UNIVERSAL CRUD OPERATIONS ====================

// GET ALL RECORDS FROM ANY TABLE (with search/filtering)
app.get('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { search, search_field, page = 1, limit = 10, sort_by = 'id', order = 'ASC' } = req.query;
    
    let query = `SELECT * FROM ${table}`;
    let params = [];
    let paramCount = 0;

    // Add search with wildcards if provided
    if (search && search_field) {
      query += ` WHERE ${search_field} ILIKE $${++paramCount}`;
      params.push(`%${search}%`);
    }

    // Add sorting
    query += ` ORDER BY ${sort_by} ${order.toUpperCase()}`;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(parseInt(limit), offset);

    const result = await pool.query(query, params);
    
    // Get total count for pagination info
    let countQuery = `SELECT COUNT(*) FROM ${table}`;
    if (search && search_field) {
      countQuery += ` WHERE ${search_field} ILIKE $1`;
    }
    const countResult = await pool.query(countQuery, search && search_field ? [`%${search}%`] : []);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('GET ALL Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET SINGLE RECORD BY ID
app.get('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    
    // Determine ID field name based on table
    const idField = table === 'students' ? 'student_number' : 'id';
    
    const query = `SELECT * FROM ${table} WHERE ${idField} = $1`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('GET SINGLE Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// CREATE NEW RECORD
app.post('/api/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const data = req.body;

    const fields = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const query = `INSERT INTO ${table} (${fields}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, values);

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('CREATE Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// UPDATE RECORD
app.put('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;
    const data = req.body;

    // Determine ID field name based on table
    const idField = table === 'students' ? 'student_number' : 'id';

    const setClause = Object.keys(data)
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = [...Object.values(data), id];

    const query = `UPDATE ${table} SET ${setClause} WHERE ${idField} = $${values.length} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('UPDATE Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE RECORD
app.delete('/api/:table/:id', async (req, res) => {
  try {
    const { table, id } = req.params;

    // Determine ID field name based on table
    const idField = table === 'students' ? 'student_number' : 'id';

    const query = `DELETE FROM ${table} WHERE ${idField} = $1 RETURNING *`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Record not found' });
    }

    res.json({ success: true, message: 'Record deleted successfully', deleted: result.rows[0] });
  } catch (error) {
    console.error('DELETE Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ADVANCED SEARCH WITH WILDCARDS ====================

// ADVANCED SEARCH ENDPOINT
app.get('/api/search/:table', async (req, res) => {
  try {
    const { table } = req.params;
    const { q, fields = '*', page = 1, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, error: 'Search query (q) is required' });
    }

    // Get all column names for the table
    const columnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = $1 
      AND table_schema = 'public'
    `;
    const columnResult = await pool.query(columnQuery, [table]);
    const columns = columnResult.rows.map(row => row.column_name);

    // Build WHERE clause with ILIKE and OR for all string columns
    const whereConditions = columns
      .filter(col => !col.includes('id') && col !== 'password') // Exclude IDs and passwords
      .map(col => `${col}::text ILIKE $1`)
      .join(' OR ');

    const offset = (page - 1) * limit;
    const searchQuery = `
      SELECT ${fields} FROM ${table}
      WHERE ${whereConditions}
      ORDER BY id
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(searchQuery, [`%${q}%`, parseInt(limit), offset]);

    // Count total matches
    const countQuery = `
      SELECT COUNT(*) FROM ${table}
      WHERE ${whereConditions}
    `;
    const countResult = await pool.query(countQuery, [`%${q}%`]);
    const totalCount = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: result.rows,
      search: {
        query: q,
        fields_searched: columns.filter(col => !col.includes('id') && col !== 'password'),
        total_matches: totalCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalCount / limit)
        }
      }
    });
  } catch (error) {
    console.error('SEARCH Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CUSTOM ENDPOINTS FOR SPECIFIC OPERATIONS ====================

// GET STUDENTS BY COURSE
app.get('/api/students/course/:courseId', async (req, res) => {
  try {
    const { courseId } = req.params;
    const query = `
      SELECT s.*, c.course_name 
      FROM students s 
      JOIN courses c ON s.course_id = c.id 
      WHERE s.course_id = $1
    `;
    const result = await pool.query(query, [courseId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET STUDENTS BY CAMPUS
app.get('/api/students/campus/:campusId', async (req, res) => {
  try {
    const { campusId } = req.params;
    const query = `
      SELECT s.*, camp.campus_name 
      FROM students s 
      JOIN campuses camp ON s.campus_id = camp.id 
      WHERE s.campus_id = $1
    `;
    const result = await pool.query(query, [campusId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET LINKS BETWEEN STUDENTS WITH NAMES
app.get('/api/links/with-details', async (req, res) => {
  try {
    const query = `
      SELECT l.*, 
             connector.name as connector_name, 
             connector.surname as connector_surname,
             acceptor.name as acceptor_name, 
             acceptor.surname as acceptor_surname
      FROM links l
      JOIN students connector ON l.connector = connector.student_number
      JOIN students acceptor ON l.acceptor = acceptor.student_number
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET STUDENT'S COMPLETE PROFILE
app.get('/api/students/:id/full-profile', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        s.*,
        c.course_name,
        f.faculty_name,
        camp.campus_name,
        json_agg(DISTINCT bg.*) as badges,
        json_agg(DISTINCT p.*) as posts
      FROM students s
      LEFT JOIN courses c ON s.course_id = c.id
      LEFT JOIN faculty f ON s.faculty_id = f.id
      LEFT JOIN campuses camp ON s.campus_id = camp.id
      LEFT JOIN badges bg ON s.student_number = bg.student_number
      LEFT JOIN posts p ON s.student_number = p.created_by
      WHERE s.student_number = $1
      GROUP BY s.student_number, c.course_name, f.faculty_name, camp.campus_name
    `;
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== BULK OPERATIONS ====================

// BULK INSERT
app.post('/api/:table/bulk', async (req, res) => {
  try {
    const { table } = req.params;
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, error: 'Records array is required' });
    }

    const fields = Object.keys(records[0]);
    const values = records.map(record => Object.values(record));
    const placeholders = records.map((_, recordIndex) => 
      `(${fields.map((_, fieldIndex) => `$${recordIndex * fields.length + fieldIndex + 1}`).join(', ')})`
    ).join(', ');

    const flatValues = values.flat();
    const query = `INSERT INTO ${table} (${fields.join(', ')}) VALUES ${placeholders} RETURNING *`;
    
    const result = await pool.query(query, flatValues);
    res.status(201).json({ 
      success: true, 
      message: `${result.rows.length} records created successfully`,
      data: result.rows 
    });
  } catch (error) {
    console.error('BULK INSERT Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== SERVER STARTUP ====================

// Test route to check DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ time: result.rows[0], success: true });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: 'Error connecting to the database' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to UJ Student Management API!',
    endpoints: {
      universal_crud: {
        get_all: 'GET /api/:table',
        get_single: 'GET /api/:table/:id',
        create: 'POST /api/:table',
        update: 'PUT /api/:table/:id',
        delete: 'DELETE /api/:table/:id'
      },
      advanced_search: {
        search: 'GET /api/search/:table?q=search_term',
        filtered_get: 'GET /api/:table?search=term&search_field=field_name'
      },
      custom_endpoints: {
        students_by_course: 'GET /api/students/course/:courseId',
        students_by_campus: 'GET /api/students/campus/:campusId',
        links_with_details: 'GET /api/links/with-details',
        full_profile: 'GET /api/students/:id/full-profile',
        bulk_insert: 'POST /api/:table/bulk'
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📚 UJ Student Management API Ready!`);
});