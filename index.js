require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: 'postgres',
    host: 'schoolmentorship.ctm44wy40k1z.eu-north-1.rds.amazonaws.com',
    database: 'SchoolManagement',
    password: 'MazibukoKhoza',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    max: 20
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Database connection error:', err);
});

app.post('/schools', async (req, res) => {
    try {
        const { name, province, district } = req.body;
        const result = await pool.query('INSERT INTO Schools (name, province, district) VALUES ($1, $2, $3) RETURNING *', [name, province, district]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/schools', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Schools');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/schools/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, province, district } = req.body;
        const result = await pool.query('UPDATE Schools SET name = $1, province = $2, district = $3 WHERE id = $4 RETURNING *', [name, province, district, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/schools/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Schools WHERE id = $1', [id]);
        res.json({ message: 'School deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/groups', async (req, res) => {
    try {
        const { name, number, description, school } = req.body;
        const result = await pool.query('INSERT INTO Groups (name, number, description, school) VALUES ($1, $2, $3, $4) RETURNING *', [name, number, description, school]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/groups', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Groups');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, number, description, school } = req.body;
        const result = await pool.query('UPDATE Groups SET name = $1, number = $2, description = $3, school = $4 WHERE id = $5 RETURNING *', [name, number, description, school, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/groups/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Groups WHERE id = $1', [id]);
        res.json({ message: 'Group deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/students', async (req, res) => {
    try {
        const { name, surname, email, grade, id_num, province, address, password, group_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO Students (name, surname, email, grade, id_num, province, address, password, group_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [name, surname, email, grade, id_num, province, address, hashedPassword, group_id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/students', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Students');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, surname, email, grade, id_num, province, address, password, group_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('UPDATE Students SET name = $1, surname = $2, email = $3, grade = $4, id_num = $5, province = $6, address = $7, password = $8, group_id = $9 WHERE id = $10 RETURNING *', [name, surname, email, grade, id_num, province, address, hashedPassword, group_id, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/students/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Students WHERE id = $1', [id]);
        res.json({ message: 'Student deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/mentors', async (req, res) => {
    try {
        const { name, surname, email, id_num, province, address, password, incentives, group_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO Mentors (name, surname, email, id_num, province, address, password, incentives, group_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [name, surname, email, id_num, province, address, hashedPassword, incentives, group_id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/mentors', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Mentors');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/mentors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, surname, email, id_num, province, address, password, incentives, group_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('UPDATE Mentors SET name = $1, surname = $2, email = $3, id_num = $4, province = $5, address = $6, password = $7, incentives = $8, group_id = $9 WHERE id = $10 RETURNING *', [name, surname, email, id_num, province, address, hashedPassword, incentives, group_id, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/mentors/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Mentors WHERE id = $1', [id]);
        res.json({ message: 'Mentor deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/teachers', async (req, res) => {
    try {
        const { name, surname, email, id_num, province, address, password, salary, group_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO Teachers (name, surname, email, id_num, province, address, password, salary, group_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [name, surname, email, id_num, province, address, hashedPassword, salary, group_id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/teachers', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Teachers');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/teachers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, surname, email, id_num, province, address, password, salary, group_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('UPDATE Teachers SET name = $1, surname = $2, email = $3, id_num = $4, province = $5, address = $6, password = $7, salary = $8, group_id = $9 WHERE id = $10 RETURNING *', [name, surname, email, id_num, province, address, hashedPassword, salary, group_id, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/teachers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Teachers WHERE id = $1', [id]);
        res.json({ message: 'Teacher deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/admin', async (req, res) => {
    try {
        const { name, surname, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('INSERT INTO Admin (name, surname, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *', [name, surname, email, hashedPassword, role]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Admin');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/admin/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, surname, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query('UPDATE Admin SET name = $1, surname = $2, email = $3, password = $4, role = $5 WHERE id = $6 RETURNING *', [name, surname, email, hashedPassword, role, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/admin/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Admin WHERE id = $1', [id]);
        res.json({ message: 'Admin deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/subjects', async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query('INSERT INTO Subjects (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/subjects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Subjects');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/subjects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const result = await pool.query('UPDATE Subjects SET name = $1, description = $2 WHERE id = $3 RETURNING *', [name, description, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/subjects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM Subjects WHERE id = $1', [id]);
        res.json({ message: 'Subject deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/resources', async (req, res) => {
    try {
        const { upload_by, subject, type, name, description, file_path } = req.body;
        const result = await pool.query('INSERT INTO resources (upload_by, subject, type, name, description, file_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [upload_by, subject, type, name, description, file_path]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/resources', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM resources');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/resources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { upload_by, subject, type, name, description, file_path } = req.body;
        const result = await pool.query('UPDATE resources SET upload_by = $1, subject = $2, type = $3, name = $4, description = $5, file_path = $6 WHERE id = $7 RETURNING *', [upload_by, subject, type, name, description, file_path, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/resources/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM resources WHERE id = $1', [id]);
        res.json({ message: 'Resource deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/sessions', async (req, res) => {
    try {
        const { hoster, capacity, name, subject, description, duration, start_time } = req.body;
        const result = await pool.query('INSERT INTO sessions (hoster, capacity, name, subject, description, duration, start_time) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *', [hoster, capacity, name, subject, description, duration, start_time]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/sessions', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM sessions');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { hoster, capacity, name, subject, description, duration, start_time } = req.body;
        const result = await pool.query('UPDATE sessions SET hoster = $1, capacity = $2, name = $3, subject = $4, description = $5, duration = $6, start_time = $7 WHERE id = $8 RETURNING *', [hoster, capacity, name, subject, description, duration, start_time, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM sessions WHERE id = $1', [id]);
        res.json({ message: 'Session deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/quizzes', async (req, res) => {
    try {
        const { upload_by, subject, type, name, description, file_path } = req.body;
        const result = await pool.query('INSERT INTO quizzes (upload_by, subject, type, name, description, file_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [upload_by, subject, type, name, description, file_path]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/quizzes', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM quizzes');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/quizzes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { upload_by, subject, type, name, description, file_path } = req.body;
        const result = await pool.query('UPDATE quizzes SET upload_by = $1, subject = $2, type = $3, name = $4, description = $5, file_path = $6 WHERE id = $7 RETURNING *', [upload_by, subject, type, name, description, file_path, id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/quizzes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM quizzes WHERE id = $1', [id]);
        res.json({ message: 'Quiz deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/session_participants', async (req, res) => {
    try {
        const { session_id, student_id } = req.body;
        const result = await pool.query('INSERT INTO session_participants (session_id, student_id) VALUES ($1, $2) RETURNING *', [session_id, student_id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/session_participants', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM session_participants');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/session_participants', async (req, res) => {
    try {
        const { session_id, student_id } = req.body;
        await pool.query('DELETE FROM session_participants WHERE session_id = $1 AND student_id = $2', [session_id, student_id]);
        res.json({ message: 'Participant removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'School Management API is running',
        endpoints: {
            schools: '/schools',
            groups: '/groups',
            students: '/students',
            teachers: '/teachers',
            mentors: '/mentors',
            admin: '/admin',
            subjects: '/subjects',
            resources: '/resources',
            sessions: '/sessions',
            quizzes: '/quizzes',
            session_participants: '/session_participants'
        }
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    
});