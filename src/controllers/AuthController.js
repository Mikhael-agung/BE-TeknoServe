const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenStore = require('../utils/tokenStore');

class AuthController {
  static async login(req, res) {
    try {
      const { username, password } = req.body;

      // Cari user
      const user = await User.findByUsernameOrEmail(username);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah'
        });
      }

      // Generate SIMPLE TOKEN: user_id + random string
      const randomStr = Math.random().toString(36).substring(2, 10);
      const token = `${user.id}_${randomStr}`;
      
      // Simpan token ke store
      tokenStore.set(token, {
        userId: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      });

      // Response
      const { password_hash, ...userData } = user;
      
      res.json({
        success: true,
        message: 'Login berhasil',
        data: {
          token, 
          user: userData
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }

  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (token) {
        tokenStore.delete(token);
      }
      
      res.json({
        success: true,
        message: 'Logout berhasil'
      });
      
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }

  // ✅ REGISTER
  static async register(req, res) {
    try {
      const { username, email, password, full_name, phone } = req.body;

      // 1. Cek apakah user sudah ada
      const existingUser = await User.findByUsernameOrEmail(username) || 
                          await User.findByUsernameOrEmail(email);
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username atau email sudah terdaftar'
        });
      }

      // 2. Hash password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // 3. Buat user baru pakai MODEL
      const newUser = await User.create({
        id: `user_${Date.now()}`,
        username,
        email,
        password_hash: passwordHash,
        full_name,
        phone: phone || null,
        role: 'customer'
      });

      // 4. Generate token
      const token = `${newUser.id}_${Date.now()}`;

      // 5. Hapus password dari response
      const { password_hash, ...userData } = newUser;

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        data: {
          token,
          user: userData
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan server'
      });
    }
  }
}

module.exports = AuthController;