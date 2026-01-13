const express = require("express");
const router = express.Router();
const TeknisiDiskusiController = require("../controllers/TeknisiDiskusiController");
const { authMiddleware, authorize } = require("../middleware/auth");

router.use(authMiddleware);
router.use(authorize("teknisi"));

router.post("/complaints/diskusi", TeknisiDiskusiController.addDiskusi);
router.get("/complaints/diskusi", TeknisiDiskusiController.getAllDiskusi);


module.exports = router;
