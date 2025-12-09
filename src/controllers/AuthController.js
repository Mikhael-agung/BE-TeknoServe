const User = require('../models/User');
const bcrypt = require('bcryptjs');  
const tokenStore = require('../utils/tokenStore');
const { successResponse, errorResponse } = require('../utils/response');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validasi input
      if (!username || !password) {
        return res.status(400).json(
          errorResponse('Username dan password harus diisi', 400)
        );
      }

      // Cari user
      const user = await User.findByUsernameOrEmail(username);
      
      if (!user) {
        return res.status(401).json(
          errorResponse('Username atau password salah', 401)
        );
      }

      // BCRYPT COMPARE (8 rounds - secure & fast enough)
      const validPassword = await bcrypt.compare(password, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json(
          errorResponse('Username atau password salah', 401)
        );
      }

      // Generate token
      const randomStr = Math.random().toString(36).substring(2, 10);
      const token = `${user.id}_${randomStr}`;
      
      // Simpan token
      tokenStore.set(token, {
        userId: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      });

      // Hapus password dari response
      const { password_hash, ...userData } = user;
      
      res.json(
        successResponse(
          {
            token, 
            user: userData
          },
          'Login berhasil'
        )
      );

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json(
        errorResponse('Terjadi kesalahan server', 500)
      );
    }
  }

  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        tokenStore.delete(token);
      }
      
      res.json(
        successResponse(null, 'Logout berhasil')
      );
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json(
        errorResponse('Terjadi kesalahan server', 500)
      );
    }
  }

  static async register(req, res) {
    try {
      const { username, email, password, full_name, phone } = req.body;

      // Validasi
      if (!username || !email || !password || !full_name) {
        return res.status(400).json(
          errorResponse('Semua field wajib diisi', 400)
        );
      }

      // Cek user sudah ada
      const existingUser = await User.findByUsernameOrEmail(username) || 
                          await User.findByUsernameOrEmail(email);
      
      if (existingUser) {
        return res.status(400).json(
          errorResponse('Username atau email sudah terdaftar', 400)
        );
      }

      //  BCRYPT HASH dengan 8 rounds 
      const salt = await bcrypt.genSalt(8);
      const passwordHash = await bcrypt.hash(password, salt);

      // Buat user baru
      const newUser = await User.create({
        id: `user_${Date.now()}`,
        username,
        email,
        password_hash: passwordHash,
        full_name,
        phone: phone || null,
        role: 'customer'
      });

      // Generate token
      const token = `${newUser.id}_${Date.now()}`;
      
      // Simpan token
      tokenStore.set(token, {
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role,
        email: newUser.email
      });

      // Hapus password dari response
      const { password_hash, ...userData } = newUser;

      res.status(201).json(
        successResponse(
          {
            token,
            user: userData
          },
          'Registrasi berhasil'
        )
      );

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json(
        errorResponse('Terjadi kesalahan server', 500)
      );
    }
  }
}

module.exports = AuthController;