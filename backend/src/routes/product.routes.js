const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  create,
  getAll,
  getOne,
  update,
  remove,
  addStockToWarehouse,
  getStock,
  moveStockBetweenWarehouses,
  getMovements,
} = require("../controllers/product.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(authenticate);

// ─────────────────────────────────────────
// PRODUCT ROUTES
// ─────────────────────────────────────────

// All roles can view products
router.get("/", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getAll);
router.get("/:productId", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getOne);

// Only SuperAdmin and Admin can manage products
router.post("/", authorize("SUPERADMIN", "ADMIN"), create);
router.patch("/:productId", authorize("SUPERADMIN", "ADMIN"), update);
router.delete("/:productId", authorize("SUPERADMIN", "ADMIN"), remove);

// Stock management
router.post("/:productId/stock", authorize("SUPERADMIN", "ADMIN"), addStockToWarehouse);

module.exports = router;