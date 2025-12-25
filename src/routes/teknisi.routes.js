const express = require('express');
const router = express.Router();
const TeknisiController = require('../controllers/TeknisiController');
const { authMiddleware, authorize } = require('../middleware/auth');

// SEMUA endpoint butuh auth + role teknisi
router.use(authMiddleware);
router.use(authorize('teknisi')); // HANYA teknisi yang boleh akses

// Endpoints untuk teknisi dashboard
router.get('/dashboard/stats', TeknisiController.getDashboardStats);

// Endpoints untuk komplain management
router.get('/complaints/ready', TeknisiController.getReadyComplaints);
router.get('/complaints/progress', TeknisiController.getProgressComplaints);
router.get('/complaints/completed', TeknisiController.getCompletedComplaints);
router.patch('/complaints/:id/take', TeknisiController.takeComplaint);

// Endpoint untuk update status (alternatif ke existing route)
router.patch('/complaints/:id/status', TeknisiController.updateStatus);

module.exports = router;