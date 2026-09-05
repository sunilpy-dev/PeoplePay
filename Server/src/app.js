import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import contractRoutes from './routes/contractRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import lookupRoutes from './routes/lookupRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import payrunRoutes from './routes/payrunRoutes.js';
import payslipRoutes from './routes/payslipRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';
import pool from './config/db.js';

const app = express();

// Request logging in development
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// CORS Configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman) or matching origin
    if (!origin || origin === allowedOrigin || origin === 'http://localhost:5173' || origin === 'http://127.0.0.1:5173') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/v1/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW() as db_time');
    res.status(200).json({
      status: 'healthy',
      service: 'PeoplePay360 Backend API',
      database: 'connected',
      dbTime: dbRes.rows[0].db_time,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      service: 'PeoplePay360 Backend API',
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mount Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/schedules', scheduleRoutes);
app.use('/api/v1/lookups', lookupRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/payruns', payrunRoutes);
app.use('/api/v1/payslips', payslipRoutes);
app.use('/api/v1/leaves', leaveRoutes);

// Handle 404
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find endpoint ${req.originalUrl} on this server`, 404, 'NOT_FOUND'));
});

// Central Error Handler
app.use(errorHandler);

export default app;
