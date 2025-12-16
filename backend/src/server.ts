import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/env';
import pool from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import patientRoutes from './routes/patient.routes';
import doctorRoutes from './routes/doctor.routes';
import serviceRoutes from './routes/service.routes';
import appointmentRoutes from './routes/appointment.routes';
import scheduleRoutes from './routes/schedule.routes';
import timeslotRoutes from './routes/timeslot.routes';
import paymentRoutes from './routes/payment.routes';
import notificationRoutes from './routes/notification.routes';
import reportRoutes from './routes/report.routes';
import configRoutes from './routes/config.routes';
import auditRoutes from './routes/audit.routes';
import insuranceRoutes from './routes/insurance.routes';
import otpRoutes from './routes/otp.routes';
import authGoogleRoutes from './routes/auth-google.routes';
import { setupSocketIO } from './services/socket.service';
import './jobs/reminder.job';
import './jobs/schedule-generator.job';
// Security middleware
import { securityHeaders, requestSizeLimiter, securityLogger } from './middleware/security';
import { apiLimiter, otpLimiter } from './middleware/rateLimiter';
import { sanitizeMongo, sanitizeInput } from './middleware/sanitize';

const app = express();
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
  cors: {
    origin: config.frontend.url,
    methods: ['GET', 'POST'],
  },
});

// Security Middleware (apply first)
app.use(securityHeaders); // Helmet with enhanced config
app.use(securityLogger); // Security event logging
app.use(requestSizeLimiter); // Request size limiting
app.use(sanitizeMongo); // MongoDB injection prevention
app.use(sanitizeInput); // Input sanitization

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    // In production, only allow specific origins
    if (config.env === 'production') {
      const allowedOrigins = [
        config.frontend.url,
        // Add production domains here
      ];
      
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 86400, // 24 hours
}));

// Other Middleware
app.use(compression());
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global API Rate Limiting (skip for public cached endpoints)
app.use('/api', (req, res, next) => {
  // Skip rate limiting for public GET endpoints (they are cached and safe)
  if (req.method === 'GET' && (req.path.startsWith('/doctors') || req.path.startsWith('/services'))) {
    return next();
  }
  return apiLimiter(req, res, next);
});

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/time-slots', timeslotRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/config', configRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/insurance', insuranceRoutes);
app.use('/api', otpLimiter, otpRoutes);
app.use('/api/auth', authGoogleRoutes); // OTP routes

// 404 handler for undefined routes
app.use('/api/*', (req, res, next) => {
  console.log(`⚠️ 404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /api/doctors',
      'GET /api/services',
      'GET /api/appointments',
      'GET /api/patients',
      'GET /api/payments',
      'GET /api/reports/appointments',
      'GET /api/reports/revenue',
      'GET /api/reports/doctors-performance',
      'GET /api/config/clinic',
      'PUT /api/config/clinic',
    ],
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Setup Socket.IO
setupSocketIO(io);

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${config.env}`);
  console.log(`🔗 API: http://localhost:${PORT}/api`);
});

export { io };

