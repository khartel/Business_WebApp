/**
 * Generic request-validation middleware factory used with the zod schemas
 * defined in `validators/`.
 */
const { ZodError } = require("zod");

/**
 * Validates req.body / req.params / req.query against a zod schema shaped as
 * { body?, params?, query? }. Only the keys present on the schema are checked.
 * Parsed (and coerced/defaulted) values are written back onto req (query
 * results go to req.validatedQuery instead of req.query - see note below).
 * On validation failure, responds 400 with a list of field-level errors
 * instead of calling next(); non-Zod errors are passed to next(error).
 */
const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.params) {
      req.params = { ...req.params, ...schema.params.parse(req.params) };
    }
    if (schema.query) {
      // Express 5 turned req.query into a getter-only property, so
      // reassigning it (as we used to) silently no-ops and coerced values
      // (e.g. z.coerce.number() on page/limit) never reach the controller.
      // Expose the parsed/coerced result separately instead.
      req.validatedQuery = schema.query.parse(req.query);
    }
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
    }
    next(error);
  }
};

module.exports = { validate };
