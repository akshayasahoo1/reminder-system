'use strict';

const AuthService = require('../services/auth.service');
const { sendSuccess } = require('../utils/response');

/**
 * Auth Controller
 * Responsibilities:
 *  - Extract validated data from req.body (already sanitized by validate middleware)
 *  - Delegate to AuthService
 *  - Send HTTP response
 *  - Forward errors to global error handler via next(err)
 *
 * No business logic lives here.
 */
const AuthController = {
  /**
   * POST /api/auth/signup
   */
  signup: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.signup({ email, password });

      sendSuccess(
        res,
        { user, token },
        'Account created successfully',
        201
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   */
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const { user, token } = await AuthService.login({ email, password });

      sendSuccess(res, { user, token }, 'Login successful');
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AuthController;
