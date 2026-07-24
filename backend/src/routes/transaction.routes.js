const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  create,
  getAll,
  getSummary,
  getOne,
} = require("../controllers/transaction.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, belongsToBusiness } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  transactionIdParamSchema,
  createTransactionSchema,
  listTransactionsQuerySchema,
} = require("../validators/transaction.validators");

router.use(authenticate);
router.use(belongsToBusiness);

// All roles can make and view transactions
router.post(
  "/",
  authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"),
  validate(createTransactionSchema),
  create
);

router.get(
  "/",
  authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"),
  validate(listTransactionsQuerySchema),
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
  validate(transactionIdParamSchema),
  getOne
);

module.exports = router;