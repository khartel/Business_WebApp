const express = require("express");
const router = express.Router({ mergeParams: true });
const { getAll } = require("../controllers/audit-log.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, belongsToBusiness } = require("../middleware/role.middleware");

// Mounted under /api/businesses/:businessId/audit-log. Restricted to
// SuperAdmin/Admin, same gate as Team management - this exposes who deleted
// what and team membership changes, not something Employees should see.
router.use(authenticate);
router.use(belongsToBusiness);

router.get("/", authorize("SUPERADMIN", "ADMIN"), getAll);

module.exports = router;
