'use strict';

const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

// ─────────────────────────────────────────
// SPECIFIC ERROR TRANSFORMERS
// Convert known infrastructure errors → AppError
// ─────────────────────────────────────────

const handlePrismaNotFound = () =>
  new AppError('Resource not found', 404, 'NOT_FOUND');

const handlePrismaUniqueConstraint = (err) => {
  const field = err.meta?.target?.[0] || 'field';
  return new AppError(`${field} already exists`, 409, 'DUPLICATE_ENTRY');
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Token expired. Please log in again.', 401, 'TOKEN_EXPIRED');

const handleValidationError = (err) =>
  new AppError(err.message, 400, 'VALIDATION_ERROR');

// ─────────────────────────────────────────
// RESPONSE SENDERS
// ─────────────────────────────────────────

const sendDevError = (err, res) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
    code: err.code || 'INTERNAL_ERROR',
    stack: err.stack,
  });
};

const sendProdError = (err, res) => {
  if (err.isOperational) {
    // Known, safe to expose
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code,
    });
  } else {
    // Unknown error — don't leak internals
    logger.error('UNEXPECTED ERROR:', err);
    res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
      code: 'INTERNAL_ERROR',
    });
  }
};

// ─────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Must have 4 params for Express to recognize it as error middleware
// ─────────────────────────────────────────
const errorHandler = (err, _req, res, _next) => {
  logger.error(`[ErrorHandler] ${err.message}`, { stack: err.stack });

  let error = { ...err, message: err.message };

  // Prisma errors
  if (err.code === 'P2025') error = handlePrismaNotFound();
  if (err.code === 'P2002') error = handlePrismaUniqueConstraint(err);

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Joi validation errors
  if (err.name === 'ValidationError') error = handleValidationError(err);

  if (process.env.NODE_ENV === 'development') {
    sendDevError(error, res);
  } else {
    sendProdError(error, res);
  }
};

module.exports = errorHandler;