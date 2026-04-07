'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

// ─────────────────────────────────────────
// CUSTOM LOG FORMAT
// ─────────────────────────────────────────
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),   // capture stack traces
    logFormat
  ),
  transports: [
    // Console transport (always on)
    new transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        errors({ stack: true }),
        logFormat
      ),
    }),
    // File transport for errors only
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

module.exports = logger;