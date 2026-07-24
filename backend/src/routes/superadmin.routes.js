const express = require("express");
const router = express.Router();
const {
  getAllSuperAdmins,
  deleteSuperAdmin,
  resetPassword,
} = require("../controllers/superadmin.controller");
const { validateMasterKey } = require("../middleware/masterkey.middleware");
const { validate } = require("../middleware/validate.middleware");
const { userIdParamSchema } = require("../validators/superadmin.validators");

// All routes protected by master key
router.use(validateMasterKey);

router.get("/superadmins", getAllSuperAdmins);
router.delete("/superadmins/:userId", validate(userIdParamSchema), deleteSuperAdmin);
router.post(
  "/superadmins/:userId/reset-password",
  validate(userIdParamSchema),
  resetPassword
);

module.exports = router;