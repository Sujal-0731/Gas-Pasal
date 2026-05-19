process.env.TZ = 'Asia/Kathmandu';
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const queueRoutes = require('./routes/queueRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const stockRoutes = require('./routes/stockRoutes');
const refillRoutes = require('./routes/refillRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pushroutes=require('./routes/pushRoutes');
const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// ========== CORS CONFIGURATION ==========
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://gas-pasal.vercel.app'
].filter(Boolean);

if (!isProduction) {
  allowedOrigins.push('http://localhost:5173', 'http://192.168.1.188:5173');
}

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      if (!isProduction) {
        logger.warn(`CORS blocked request from origin: ${origin}`);
      }
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-pin']
}));

app.use(express.json());
app.use(cookieParser());

// ========== DEBUG MIDDLEWARE (Development Only) ==========
if (!isProduction) {
  app.use((req, res, next) => {
    logger.debug(`Request: ${req.method} ${req.path}`);
    next();
  });
}

// ========== SECURITY HEADERS ==========
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: isProduction ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.removeHeader('X-Powered-By');
  next();
});

// ========== REQUEST TIMEOUT ==========
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    res.status(408).json({ success: false, message: 'Request timeout' });
  });
  res.setTimeout(30000, () => {
    res.status(408).json({ success: false, message: 'Request timeout' });
  });
  next();
});

// ========== RATE LIMITING ==========
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProduction ? 100 : 1000,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

app.use('/api/', apiLimiter);

// Health check (public)
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/refills', refillRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/push', pushroutes);
// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: isProduction ? 'An error occurred. Please try again.' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Mode: ${isProduction ? 'production' : 'development'}`);
});