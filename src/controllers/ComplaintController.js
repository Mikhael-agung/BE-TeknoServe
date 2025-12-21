const Complaint = require('../models/Complaint');
const { successResponse, errorResponse } = require('../utils/response');
const supabase = require('../config/supabase');

class ComplaintController {
  static async create(req, res) {
    try {
      console.log('\n=== 📝 CREATE COMPLAINT START ===');
      console.log('👤 User:', req.user.username, 'ID:', req.user.id);
      console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));

      const userId = req.user.id;
      const {
        judul,
        kategori,
        deskripsi,
        alamat,
        kota,
        kecamatan,
        telepon_alamat,
        catatan_alamat
      } = req.body;

      // Validasi
      if (!judul || !kategori) {
        console.log('❌ Validation failed: judul or kategori missing');
        return res.status(400).json(
          errorResponse('Judul dan kategori wajib diisi', 400)
        );
      }

      if (!alamat || alamat.trim() === '') {
        console.log('❌ Validation failed: alamat missing or empty');
        return res.status(400).json(
          errorResponse('Alamat wajib diisi', 400)
        );
      }

      // ✅ FIXED: JANGAN BUAT ID MANUAL - biar database generate
      const complaintData = {
        user_id: userId,
        judul: judul.trim(),
        kategori: kategori.trim(),
        deskripsi: (deskripsi || '').trim(),
        alamat: alamat.trim(),
        kota: (kota || '').trim(),
        kecamatan: (kecamatan || '').trim(),
        telepon_alamat: (telepon_alamat || '').trim(),
        catatan_alamat: (catatan_alamat || '').trim(),
        // Status akan di-set oleh model
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('💾 Complaint data to save:', complaintData);

      const complaint = await Complaint.create(complaintData);

      console.log('✅ Complaint created successfully');
      console.log('✅ Complaint ID:', complaint.id);
      console.log('=== 📝 CREATE COMPLAINT END ===\n');

      res.status(201).json({
        success: true,
        message: 'Komplain berhasil dibuat',
        data: complaint,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ CREATE COMPLAINT ERROR:', error);
      res.status(500).json({
        success: false,
        message: 'Gagal membuat komplain: ' + error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  static async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { status, page = 1, limit = 10 } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (page) filters.page = parseInt(page);
      if (limit) filters.limit = parseInt(limit);
      if (req.query.kategori) filters.kategori = req.query.kategori;

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
        errorResponse('Gagal mengambil history komplain', 500)
      );
    }
  }

  static async getDetail(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const complaint = await Complaint.findById(id);

      if (!complaint) {
        return res.status(404).json(
          errorResponse('Komplain tidak ditemukan', 404)
        );
      }

      // Access check
      if (complaint.user_id !== userId && !['admin', 'teknisi'].includes(req.user.role)) {
        return res.status(403).json(
          errorResponse('Anda tidak memiliki akses ke komplain ini', 403)
        );
      }

      // get status history
      const statusHistory = await Complaint.getStatusHistory(id);

      res.json(
        successResponse({
          ...complaint,
          status_history: statusHistory
        }, 'Detail komplain berhasil diambil')
      );

    } catch (error) {
      console.error('Get detail error:', error);
      res.status(500).json(
        errorResponse('Gagal mengambil detail komplain', 500)
      );
    }
  }

  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, alasan } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Validasi
      if (!['teknisi', 'admin'].includes(userRole)) {
        return res.status(403).json(
          errorResponse('Hanya teknisi atau admin yang dapat mengupdate status', 403)
        );
      }

        const validStatuses = ['complaint', 'on_progress', 'pending', 'completed'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json(
          errorResponse(`Status tidak valid. Pilihan: ${validStatuses.join(', ')}`, 400)
        );
      }

      // insert Ke complaint_statuses (AUDIT TRAIL)
      const { error: historyError } = await supabase
        .from('complaint_statuses')
        .insert([{
          complaint_id: id,
          status: status,
          teknisi_id: userRole === 'teknisi' ? userId : null,
          alasan: alasan || 'Status diperbarui'
        }]);

      if (historyError) throw historyError;

      // update complaints.status 
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (userRole === 'teknisi') {
        updateData.teknisi_id = userId;
      }

      const complaint = await Complaint.update(id, updateData);

      if (!complaint) {
        return res.status(404).json(
          errorResponse('Komplain tidak ditemukan', 404)
        );
      }

      // 3. GET FULL STATUS HISTORY untuk response
      const statusHistory = await Complaint.getStatusHistory(id);

      res.json(
        successResponse({
          complaint,
          status_history: statusHistory
        }, 'Status komplain berhasil diupdate')
      );

    } catch (error) {
      console.error('Update status error:', error);
      res.status(500).json(
        errorResponse('Gagal mengupdate status komplain', 500)
      );
    }
  }

  static async getStatusHistory(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Cek apakah complaint exists
      const complaint = await Complaint.findById(id);
      if (!complaint) {
        return res.status(404).json(
          errorResponse('Komplain tidak ditemukan', 404)
        );
      }

      // Cek akses: user hanya bisa lihat komplainnya sendiri
      if (complaint.user_id !== userId && !['admin', 'teknisi'].includes(userRole)) {
        return res.status(403).json(
          errorResponse('Anda tidak memiliki akses ke komplain ini', 403)
        );
      }

      // Get status history dari model
      const statusHistory = await Complaint.getStatusHistory(id);

      res.json(
        successResponse(statusHistory, 'Riwayat status berhasil diambil')
      );

    } catch (error) {
      console.error('Get status history error:', error);
      res.status(500).json(
        errorResponse('Gagal mengambil riwayat status', 500)
      );
    }
  }
}

module.exports = ComplaintController;