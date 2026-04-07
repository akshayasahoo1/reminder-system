'use strict';

/**
 * Send a standardized success response.
 */
const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Send a standardized error response.
 */
const sendError = (res, message = 'Something went wrong', statusCode = 500, code = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(code && { code }),
    timestamp: new Date().toISOString(),
  });
};

module.exports = { sendSuccess, sendError };