/**
 * Operational error with an HTTP status code attached.
 * Thrown from services/controllers for expected failure cases
 * (not found, validation, permission denied, etc).
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message sent to the client.
   * @param {number} [statusCode=400] - HTTP status code the error handler should respond with.
   * @param {*} [errors=null] - Optional extra error detail (e.g. field-level validation errors).
   */
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
