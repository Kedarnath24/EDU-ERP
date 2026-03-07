require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const recruitmentRoutes = require('./routes/recruitment');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5001;

// --------------- Middleware ---------------
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (file://, mobile apps, curl, etc.)
    // and any localhost origin (frontend, career-landing page)
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:5176',
      'http://localhost:5176',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5500', // Live Server extension
    ];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true,
}));
app.use(express.json());

// --------------- Routes ---------------
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --------------- Global Error Handler ---------------
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --------------- Start ---------------
app.listen(PORT, () => {
  console.log(`✅ EDU-ERP Backend running on http://localhost:${PORT}`);
});
