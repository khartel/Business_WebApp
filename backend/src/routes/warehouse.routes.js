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
const { authorize } = require("../middleware/role.middleware");

router.use(authenticate);

// All roles can view warehouses
router.get("/", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getAll);
router.get("/:warehouseId", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getOne);

// Only SuperAdmin and Admin can manage warehouses
router.post("/", authorize("SUPERADMIN", "ADMIN"), create);
router.patch("/:warehouseId", authorize("SUPERADMIN", "ADMIN"), update);
router.patch("/:warehouseId/primary", authorize("SUPERADMIN", "ADMIN"), setPrimary);
router.delete("/:warehouseId", authorize("SUPERADMIN", "ADMIN"), remove);

module.exports = router;