'use strict';

/**
 * Custom operational error class.
 * Distinguishes expected app errors from unexpected programming bugs.
 */
class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code]   - Optional machine-readable error code
   */
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // flag: this is a known, handled error

    // Capture clean stack trace (excludes AppError constructor frame)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;