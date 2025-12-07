const { successResponse, errorResponse } = require('../utils/response');
const User = require('../models/User'); // Jika pakai models

class UserController {
  // ✅ GET PROFILE
  static async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json(
          errorResponse('User tidak ditemukan')
        );
      }
      
      // Hapus password dari response
      const { password_hash, ...userData } = user;
      
      res.json(
        successResponse(userData, 'Profile berhasil diambil')
      );
      
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json(
        errorResponse('Gagal mengambil profile')
      );
    }
  }
  
  // ✅ UPDATE PROFILE
  static async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const { full_name, phone } = req.body;
      
      // Validasi
      if (!full_name && !phone) {
        return res.status(400).json(
          errorResponse('Minimal satu field harus diisi')
        );
      }
      
      const updates = {};
      if (full_name) updates.full_name = full_name;
      if (phone) updates.phone = phone;
      
      const updatedUser = await User.update(userId, updates);
      
      const { password_hash, ...userData } = updatedUser;
      
      res.json(
        successResponse(userData, 'Profile berhasil diupdate')
      );
      
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json(
        errorResponse('Gagal mengupdate profile')
      );
    }
  }
}

module.exports = UserController;