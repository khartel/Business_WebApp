/**
 * Zod request-validation schemas for team-management endpoints (adding
 * team members to a business and changing their role).
 */
const { z } = require("zod");

/** Validates POST .../team - creates a new team member (ADMIN or EMPLOYEE) under a business. */
const addTeamMemberSchema = {
  params: z.object({ businessId: z.string().uuid("Invalid business id") }),
  body: z.object({
    fullName: z.string().trim().min(1, "Full name is required"),
    username: z.string().trim().min(3, "Username must be at least 3 characters"),
    phone: z.string().trim().min(7, "Phone number is required"),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    role: z.enum(["ADMIN", "EMPLOYEE"], {
      message: "Role must be either ADMIN or EMPLOYEE",
    }),
  }),
};

/** Validates routes that target a specific team member (the BusinessUser join-row id) within a business. */
const businessUserIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    businessUserId: z.string().uuid("Invalid team member id"),
  }),
};

/** Validates PATCH .../team/:businessUserId/role - changes a team member's role to ADMIN or EMPLOYEE. */
const updateRoleSchema = {
  params: businessUserIdParamSchema.params,
  body: z.object({
    role: z.enum(["ADMIN", "EMPLOYEE"], {
      message: "Role must be either ADMIN or EMPLOYEE",
    }),
  }),
};

module.exports = { addTeamMemberSchema, businessUserIdParamSchema, updateRoleSchema };
