'use strict';

const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

const SECRET  = process.env.JWT_SECRET;
const EXPIRES = process.env.JWT_EXPIRES_IN || '7d';

if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is not set');
}

/**
 * Sign a JWT token with the given payload.
 * @param {{ id: string, email: string }} payload
 * @returns {string} signed JWT
 */
const signToken = (payload) =>
  jwt.sign(payload, SECRET, { expiresIn: EXPIRES });

/**
 * Verify and decode a JWT token.
 * Throws AppError on invalid or expired token.
 * @param {string} token
 * @returns {{ id: string, email: string, iat: number, exp: number }}
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Token expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    }
    throw new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
  }
};

module.exports = { signToken, verifyToken };
