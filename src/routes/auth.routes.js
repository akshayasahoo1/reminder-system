'use strict';

const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const validate = require('../middlewares/validate');
const { signupSchema, loginSchema } = require('../utils/validators/auth.validator');

/**
 * Auth Routes
 * Base path: /api/auth  (mounted in app.js)
 *
 * POST /api/auth/signup  → Create account
 * POST /api/auth/login   → Get JWT token
 */

router.post('/signup', validate(signupSchema), AuthController.signup);
router.post('/login',  validate(loginSchema),  AuthController.login);

module.exports = router;