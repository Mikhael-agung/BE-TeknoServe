const { errorResponse } = require('../utils/response'); // ← IMPORT INI
const tokenStore = require('../utils/tokenStore');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json(
        errorResponse('Token tidak ditemukan. Silakan login.', 401)
      );
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json(
        errorResponse('Format token tidak valid', 401)
      );
    }

    const session = tokenStore.get(token);
    
    if (!session) {
      return res.status(401).json(
        errorResponse('Token tidak valid atau sudah expired', 401)
      );
    }

    req.user = {
      id: session.userId,
      username: session.username,
      role: session.role
    };
    
    req.token = token;

    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json(
      errorResponse('Terjadi kesalahan autentikasi', 500)
    );
  }
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(
        errorResponse('User tidak terautentikasi', 401)
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        errorResponse(`Akses ditolak. Role yang diizinkan: ${allowedRoles.join(', ')}`, 403)
      );
    }

    next();
  };
};

module.exports = { authMiddleware, authorize };