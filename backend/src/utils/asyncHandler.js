/**
 * Wraps an async route handler so rejected promises reach
 * the global error handler instead of needing a try/catch in every controller.
 * @param {Function} fn - An async (req, res, next) => {} Express handler.
 * @returns {Function} A standard Express handler that forwards any thrown/rejected error to next().
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
