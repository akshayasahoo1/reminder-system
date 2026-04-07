'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./src/routes/auth.routes');
const reminderRoutes = require('./src/routes/reminder.routes');
const errorHandler = require('./src/middlewares/errorHandler');
const { notFound } = require('./src/middlewares/notFound');
const logger = require('./src/utils/logger');

const app = express();

// ─────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // max requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ─────────────────────────────────────────
// BODY PARSING
// ─────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────
// REQUEST LOGGER
// ─────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`[${req.method}] ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// ─────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Distributed Event Reminder System is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/reminders', reminderRoutes);

// ─────────────────────────────────────────
// ERROR HANDLING
// ─────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;