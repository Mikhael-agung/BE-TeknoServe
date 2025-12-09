// src/middleware/auth.js
const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response'); // ✅ TAMBAH INI!

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        errorResponse('Token tidak ditemukan', 401)
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json(
        errorResponse('Token tidak ditemukan', 401)
      );
    }

    // ✅ VERIFY JWT TOKEN
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json(
        errorResponse('Token tidak valid atau sudah expired', 401)
      );
    }

    // Attach user info to request
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json(
      errorResponse('Token tidak valid', 401)
    );
  }
};

// Middleware untuk authorize role
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        errorResponse('Tidak terautentikasi', 401)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse('Anda tidak memiliki akses untuk tindakan ini', 403)
      );
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  authorize
};