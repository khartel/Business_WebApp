const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  create,
  getAll,
  getSummary,
  getOne,
} = require("../controllers/transaction.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(authenticate);

// All roles can make and view transactions
router.post(
  "/",
  authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"),
  create
);

router.get(
  "/",
  authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"),
  getAll
);

// Summary only for SuperAdmin and Admin
router.get(
  "/summary",
  authorize("SUPERADMIN", "ADMIN"),
  getSummary
);

router.get(
  "/:transactionId",
  authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"),
  getOne
);

module.exports = router;