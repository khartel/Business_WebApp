/**
 * Operational error with an HTTP status code attached.
 * Thrown from services/controllers for expected failure cases
 * (not found, validation, permission denied, etc).
 */
class AppError extends Error {
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
