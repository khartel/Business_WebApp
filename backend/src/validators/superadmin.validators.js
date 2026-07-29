/**
 * Zod request-validation schemas for platform/superadmin-only endpoints.
 */
const { z } = require("zod");

/** Validates routes that target a specific user by id (platform-level user management). */
const userIdParamSchema = {
  params: z.object({ userId: z.string().uuid("Invalid user id") }),
};

module.exports = { userIdParamSchema };
