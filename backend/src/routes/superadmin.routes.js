const express = require("express");
const router = express.Router();
const {
  getAllSuperAdmins,
  deleteSuperAdmin,
} = require("../controllers/superadmin.controller");
const { validateMasterKey } = require("../middleware/masterkey.middleware");

// All routes protected by master key
router.use(validateMasterKey);

router.get("/superadmins", getAllSuperAdmins);
router.delete("/superadmins/:userId", deleteSuperAdmin);

module.exports = router;