const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  add,
  getAll,
  remove,
  updateRole,
} = require("../controllers/team.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { authorize } = require("../middleware/role.middleware");

router.use(authenticate);

// All roles can view team
router.get("/", authorize("SUPERADMIN", "ADMIN", "EMPLOYEE"), getAll);

// Only SuperAdmin and Admin can manage team
router.post("/", authorize("SUPERADMIN", "ADMIN"), add);
router.patch("/:businessUserId", authorize("SUPERADMIN", "ADMIN"), updateRole);
router.delete("/:businessUserId", authorize("SUPERADMIN", "ADMIN"), remove);

module.exports = router;