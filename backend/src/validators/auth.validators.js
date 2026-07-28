const { z } = require("zod");

const emailOrEmpty = z
  .string()
  .email("Invalid email address")
  .optional()
  .or(z.literal(""));

const registerSchema = {
  body: z.object({
    fullName: z.string().trim().min(1, "Full name is required"),
    username: z.string().trim().min(3, "Username must be at least 3 characters"),
    phone: z.string().trim().min(7, "Phone number is required"),
    email: emailOrEmpty,
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
};

const loginSchema = {
  body: z.object({
    username: z.string().trim().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional(),
  }),
};

const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  }),
};

const updateProfileSchema = {
  body: z.object({
    fullName: z.string().trim().min(1, "Full name is required").optional(),
    phone: z.string().trim().min(7, "Phone number is required").optional(),
    email: emailOrEmpty,
  }),
};

module.exports = { registerSchema, loginSchema, changePasswordSchema, updateProfileSchema };
