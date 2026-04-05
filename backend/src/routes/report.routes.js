const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  daily,
  weekly,
  monthly,
  employees,
  products,
  stockAlerts,
} = require("../controllers/report.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(authenticate);

// Only SuperAdmin and Admin can see reports
router.get("/daily", authorize("SUPERADMIN", "ADMIN"), daily);
router.get("/weekly", authorize("SUPERADMIN", "ADMIN"), weekly);
router.get("/monthly", authorize("SUPERADMIN", "ADMIN"), monthly);
router.get("/employees", authorize("SUPERADMIN", "ADMIN"), employees);
router.get("/products", authorize("SUPERADMIN", "ADMIN"), products);
router.get("/stock", authorize("SUPERADMIN", "ADMIN"), stockAlerts);

module.exports = router;