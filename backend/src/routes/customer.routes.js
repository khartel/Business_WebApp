const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  create,
  getAll,
  getOne,
  update,
  remove,
  getDeleted,
  restore,
  merge,
} = require("../controllers/customer.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, belongsToBusiness } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  customerIdParamSchema,
  createCustomerSchema,
  updateCustomerSchema,
  listCustomersQuerySchema,
  mergeCustomerSchema,
} = require("../validators/customer.validators");

// Mounted under /api/businesses/:businessId/customers (mergeParams gives
// access to :businessId). Every route requires a valid session and
// membership of the business (`belongsToBusiness`).
router.use(authenticate);
router.use(belongsToBusiness);

// ─────────────────────────────────────────
// CUSTOMER ROUTES
// ─────────────────────────────────────────

// All roles can view/search customers (needed for register autocomplete)
router.get("/", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), validate(listCustomersQuerySchema), getAll);

// Registered before "/:customerId" so "deleted" isn't swallowed as an id.
router.get("/deleted", authorize("SUPERADMIN", "ADMIN"), getDeleted);

router.get(
  "/:customerId",
  authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"),
  validate(customerIdParamSchema),
  getOne
);

// Only SuperAdmin and Admin can manage the customer directory directly
router.post("/", authorize("SUPERADMIN", "ADMIN"), validate(createCustomerSchema), create);
router.patch(
  "/:customerId",
  authorize("SUPERADMIN", "ADMIN"),
  validate(updateCustomerSchema),
  update
);
router.delete(
  "/:customerId",
  authorize("SUPERADMIN", "ADMIN"),
  validate(customerIdParamSchema),
  remove
);
router.post(
  "/:customerId/merge",
  authorize("SUPERADMIN", "ADMIN"),
  validate(mergeCustomerSchema),
  merge
);
router.post(
  "/:customerId/restore",
  authorize("SUPERADMIN", "ADMIN"),
  validate(customerIdParamSchema),
  restore
);

module.exports = router;
