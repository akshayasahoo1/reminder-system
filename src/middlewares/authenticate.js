'use strict';

const { verifyToken } = require('../utils/jwt');
const UserModel = require('../models/user.model');
const AppError = require('../utils/AppError');

/**
 * Auth Middleware
 * Protects routes by verifying the Bearer JWT in the Authorization header.
 *
 * On success: attaches req.user = { id, email, createdAt }
 * On failure: passes AppError(401) to global error handler
 *
 * Usage:
 *   router.get('/reminders', authenticate, reminderController.getAll);
 */
const authenticate = async (req, _res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication required. Please provide a Bearer token.', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token signature and expiry
    const decoded = verifyToken(token);

    // 3. Confirm user still exists in DB
    //    (handles case where user was deleted after token was issued)
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      throw new AppError('User no longer exists.', 401, 'USER_NOT_FOUND');
    }

    // 4. Attach user to request for downstream handlers
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
