'use strict';

const AppError = require('../utils/AppError');

/**
 * Middleware factory: validates req.body against a Joi schema.
 * On failure, passes a 400 AppError to the global error handler.
 *
 * Usage:
 *   router.post('/signup', validate(signupSchema), authController.signup);
 *
 * @param {import('joi').Schema} schema
 * @returns {import('express').RequestHandler}
 */
const validate = (schema) => (req, _res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // collect ALL errors, not just first
    stripUnknown: true,  // remove fields not in schema
  });

  if (error) {
    const message = error.details.map((d) => d.message).join('; ');
    return next(new AppError(message, 400, 'VALIDATION_ERROR'));
  }

  // Replace req.body with sanitized, validated value
  req.body = value;
  next();
};

module.exports = validate;
