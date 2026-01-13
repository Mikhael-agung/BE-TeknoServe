// KEMBALIKAN KE VERSI SEBELUMNYA:
const express = require('express');
const router = express.Router();
const ComplaintController = require('../controllers/ComplaintController');
const { authMiddleware, authorize } = require('../middleware/auth');

// SEMUA endpoint butuh auth
router.use(authMiddleware);

// Customer bisa buat dan lihat komplainnya sendiri
router.post('/', ComplaintController.create);
router.get('/', ComplaintController.getHistory);  // ✅ INI SUDAH ADA
router.get('/:id', ComplaintController.getDetail);
router.get('/:id/history', ComplaintController.getStatusHistory);


router.patch('/:id/status', authorize('teknisi', 'admin'), ComplaintController.updateStatus);

module.exports = router;