const express = require("express");
const router = express.Router();
const { register, login, logout, me } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Protected routes (must be logged in)
router.get("/me", authenticate, me);

module.exports = router;