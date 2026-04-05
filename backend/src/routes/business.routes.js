const express = require("express");
const router = express.Router();
const {
  create,
  getAll,
  getOne,
  update,
  getCountries,
} = require("../controllers/business.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

// Get all countries (public, needed for register/create business form)
router.get("/countries", getCountries);

// All routes below require authentication
router.use(authenticate);

// SuperAdmin only
router.post("/", authorize("SUPERADMIN"), create);
router.get("/", authorize("SUPERADMIN"), getAll);
router.patch("/:id", authorize("SUPERADMIN"), update);

// SuperAdmin, Admin, Employee (must belong to business)
router.get("/:id", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getOne);

module.exports = router;