const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  create,
  getAll,
  getOne,
  update,
  remove,
  addStockToWarehouse,
} = require("../controllers/product.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, belongsToBusiness } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  productIdParamSchema,
  createProductSchema,
  updateProductSchema,
  addStockSchema,
} = require("../validators/product.validators");

router.use(authenticate);
router.use(belongsToBusiness);

// ─────────────────────────────────────────
// PRODUCT ROUTES
// ─────────────────────────────────────────

// All roles can view products
router.get("/", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getAll);
router.get(
  "/:productId",
  authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"),
  validate(productIdParamSchema),
  getOne
);

// Only SuperAdmin and Admin can manage products
router.post("/", authorize("SUPERADMIN", "ADMIN"), validate(createProductSchema), create);
router.patch(
  "/:productId",
  authorize("SUPERADMIN", "ADMIN"),
  validate(updateProductSchema),
  update
);
router.delete(
  "/:productId",
  authorize("SUPERADMIN", "ADMIN"),
  validate(productIdParamSchema),
  remove
);

// Stock management
router.post(
  "/:productId/stock",
  authorize("SUPERADMIN", "ADMIN"),
  validate(addStockSchema),
  addStockToWarehouse
);

module.exports = router;