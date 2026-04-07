'use strict';

const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { signToken } = require('../utils/jwt');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

/**
 * Auth Service
 * Handles all authentication business logic.
 * Called by AuthController — never called from routes directly.
 */
const AuthService = {
  /**
   * Register a new user.
   * - Checks for duplicate email
   * - Hashes password with bcrypt
   * - Returns user record + signed JWT
   *
   * @param {{ email: string, password: string }} data
   * @returns {Promise<{ user: object, token: string }>}
   */
  signup: async ({ email, password }) => {
    // 1. Check duplicate email
    const exists = await UserModel.existsByEmail(email);
    if (exists) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_TAKEN');
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Persist user
    const user = await UserModel.create({ email, password: hashedPassword });
    logger.info(`New user registered: ${user.email} (${user.id})`);

    // 4. Issue token
    const token = signToken({ id: user.id, email: user.email });

    return { user, token };
  },

  /**
   * Authenticate an existing user.
   * - Finds user by email (includes password hash)
   * - Compares password using bcrypt.compare (timing-safe)
   * - Returns safe user record + signed JWT
   *
   * @param {{ email: string, password: string }} data
   * @returns {Promise<{ user: object, token: string }>}
   */
  login: async ({ email, password }) => {
    // 1. Find user — include password for comparison
    const user = await UserModel.findByEmail(email);

    // 2. Use a constant-time comparison even if user not found
    //    to prevent timing attacks that reveal valid emails
    const dummyHash = '$2a$12$invaliddummyhashfortimingsafety000000000000000000000000';
    const isMatch = await bcrypt.compare(
      password,
      user ? user.password : dummyHash
    );

    if (!user || !isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    logger.info(`User logged in: ${user.email} (${user.id})`);

    // 3. Issue token (strip password from response)
    const token = signToken({ id: user.id, email: user.email });
    const { password: _pw, ...safeUser } = user;

    return { user: safeUser, token };
  },
};

module.exports = AuthService;
