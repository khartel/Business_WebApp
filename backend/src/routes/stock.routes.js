const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  getStock,
  moveStockBetweenWarehouses,
  getMovements,
} = require("../controllers/product.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, belongsToBusiness } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const { moveStockSchema } = require("../validators/stock.validators");

router.use(authenticate);
router.use(belongsToBusiness);

// All roles can view stock
router.get("/", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getStock);
router.get("/movements", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getMovements);

// Only SuperAdmin and Admin can move stock
router.post(
  "/move",
  authorize("SUPERADMIN", "ADMIN"),
  validate(moveStockSchema),
  moveStockBetweenWarehouses
);

module.exports = router;