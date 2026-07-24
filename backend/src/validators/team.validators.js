const { z } = require("zod");

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

const businessUserIdParamSchema = {
  params: z.object({
    businessId: z.string().uuid("Invalid business id"),
    businessUserId: z.string().uuid("Invalid team member id"),
  }),
};

const updateRoleSchema = {
  params: businessUserIdParamSchema.params,
  body: z.object({
    role: z.enum(["ADMIN", "EMPLOYEE"], {
      message: "Role must be either ADMIN or EMPLOYEE",
    }),
  }),
};

module.exports = { addTeamMemberSchema, businessUserIdParamSchema, updateRoleSchema };
