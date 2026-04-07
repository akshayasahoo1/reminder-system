'use strict';

const AppError = require('../utils/AppError');

/**
 * Catch-all for routes that don't exist.
 * Must be registered AFTER all valid routes in app.js.
 */
const notFound = (req, _res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, 'ROUTE_NOT_FOUND'));
};

module.exports = { notFound };