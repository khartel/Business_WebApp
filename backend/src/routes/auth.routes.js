const express = require("express");
const router = express.Router();
const { register, login, logout, me, changePassword } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { validate } = require("../middleware/validate.middleware");
const { registerSchema, loginSchema, changePasswordSchema } = require("../validators/auth.validators");

// Public routes
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

// Protected routes (must be logged in)
router.get("/me", authenticate, me);
router.post("/change-password", authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;