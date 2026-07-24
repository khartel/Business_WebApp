const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  create,
  getAll,
  getOne,
  setPrimary,
  update,
  remove,
} = require("../controllers/warehouse.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize, belongsToBusiness } = require("../middleware/role.middleware");
const { validate } = require("../middleware/validate.middleware");
const {
  createWarehouseSchema,
  warehouseIdParamSchema,
  updateWarehouseSchema,
} = require("../validators/warehouse.validators");

router.use(authenticate);
router.use(belongsToBusiness);

// All roles can view warehouses
router.get("/", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getAll);
router.get(
  "/:warehouseId",
  authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"),
  validate(warehouseIdParamSchema),
  getOne
);

// Only SuperAdmin and Admin can manage warehouses
router.post("/", authorize("SUPERADMIN", "ADMIN"), validate(createWarehouseSchema), create);
router.patch(
  "/:warehouseId",
  authorize("SUPERADMIN", "ADMIN"),
  validate(updateWarehouseSchema),
  update
);
router.patch(
  "/:warehouseId/primary",
  authorize("SUPERADMIN", "ADMIN"),
  validate(warehouseIdParamSchema),
  setPrimary
);
router.delete(
  "/:warehouseId",
  authorize("SUPERADMIN", "ADMIN"),
  validate(warehouseIdParamSchema),
  remove
);

module.exports = router;