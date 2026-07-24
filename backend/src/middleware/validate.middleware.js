const { ZodError } = require("zod");

/**
 * Validates req.body / req.params / req.query against a zod schema shaped as
 * { body?, params?, query? }. Only the keys present on the schema are checked.
 * Parsed (and coerced/defaulted) values are written back onto req.
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
      req.query = { ...req.query, ...schema.query.parse(req.query) };
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
