const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/students');
const sessionRoutes = require('./routes/sessions');
const teacherRoutes = require('./routes/teachers');
const mentorRoutes = require('./routes/mentors');
const schoolRoutes = require('./routes/schools');
const groupRoutes = require('./routes/groups');
const resourceRoutes = require('./routes/resources');
const quizRoutes = require('./routes/quizzes');
const subjectRoutes = require('./routes/subjects');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/subjects', subjectRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: 'SchoolManagement'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'School Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      students: '/api/students',
      teachers: '/api/teachers',
      mentors: '/api/mentors',
      schools: '/api/schools',
      sessions: '/api/sessions',
      groups: '/api/groups',
      resources: '/api/resources',
      quizzes: '/api/quizzes',
      subjects: '/api/subjects'
    }
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/students',
      'GET /api/students/:id',
      'POST /api/students',
      'PUT /api/students/:id',
      'DELETE /api/students/:id',
      'GET /api/sessions',
      'POST /api/sessions',
      'POST /api/sessions/enroll'
    ]
  });
});

// 404 handler for all other routes - FIXED: Use proper wildcard handling
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.status(404).json({ 
      error: 'Endpoint not found',
      message: 'Use /api endpoints for the School Management System',
      example: 'GET /api/health'
    });
  }
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/`);
});