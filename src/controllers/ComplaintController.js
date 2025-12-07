const Complaint = require('../models/Complaint');
const { successResponse, errorResponse } = require('../utils/response');

class ComplaintController {
  // ✅ CREATE COMPLAINT
  static async create(req, res) {
    try {
      const userId = req.user.id; // Dari middleware auth
      const { title, category, description } = req.body;

      if (!title || !category) {
        return res.status(400).json(
          errorResponse('Judul dan kategori wajib diisi')
        );
      }

      const complaintData = {
        id: `complaint_${Date.now()}`,
        user_id: userId,
        title,
        category,
        description: description || '',
        status: 'pending'
      };

      const complaint = await Complaint.create(complaintData);

      res.status(201).json(
        successResponse(complaint, 'Komplain berhasil dibuat')
      );

    } catch (error) {
      console.error('Create complaint error:', error);
      res.status(500).json(
        errorResponse('Gagal membuat komplain')
      );
    }
  }

  // ✅ GET COMPLAINT HISTORY
  static async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (page) filters.page = parseInt(page);
      if (limit) filters.limit = parseInt(limit);

      const { data: complaints, total } = await Complaint.findByUserId(userId, filters);

      res.json(
        successResponse({
          complaints,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            total_pages: Math.ceil(total / limit)
          }
        }, 'History komplain berhasil diambil')
      );

    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json(
        errorResponse('Gagal mengambil history komplain')
      );
    }
  }

  // ✅ GET COMPLAINT DETAIL
  static async getDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const complaint = await Complaint.findById(id);
      
      if (!complaint) {
        return res.status(404).json(
          errorResponse('Komplain tidak ditemukan')
        );
      }

      // Cek authorization (hanya pemilik atau admin/teknisi)
      if (complaint.user_id !== userId && !['admin', 'teknisi'].includes(req.user.role)) {
        return res.status(403).json(
          errorResponse('Anda tidak memiliki akses ke komplain ini')
        );
      }

      res.json(
        successResponse(complaint, 'Detail komplain berhasil diambil')
      );

    } catch (error) {
      console.error('Get detail error:', error);
      res.status(500).json(
        errorResponse('Gagal mengambil detail komplain')
      );
    }
  }
}

module.exports = ComplaintController;