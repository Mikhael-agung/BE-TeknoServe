// src/middleware/auth.js
const { verifyToken } = require("../utils/jwt");
const { errorResponse } = require("../utils/response");
const authMiddleware = (req, res, next) => {
  console.log("Authorization Header:", req.headers.authorization);

  try {
    // console.log('🔐 [AUTH] Checking authorization header...');
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ [AUTH] No Bearer token found. Header:", authHeader);
      return res.status(401).json(errorResponse("Token tidak ditemukan", 401));
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("❌ [AUTH] Empty token after Bearer");
      return res.status(401).json(errorResponse("Token tidak ditemukan", 401));
    }
    //  console.log('🔐 [AUTH] Token received, length:', token.length);
    // console.log('🔐 [AUTH] Token sample:', token.substring(0, 30) + '...');

    const decoded = verifyToken(token);

    if (!decoded) {
      console.log("❌ [AUTH] Token verification failed");
      return res
        .status(401)
        .json(errorResponse("Token tidak valid atau sudah expired", 401));
    }

    //  console.log('✅ [AUTH] Token verified for user:', decoded.username);
    // console.log('✅ [AUTH] User role:', decoded.role);

    // Attach user info to request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(401).json(errorResponse("Token tidak valid", 401));
  }
};

// Middleware untuk authorize role
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse("Tidak terautentikasi", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json(
          errorResponse("Anda tidak memiliki akses untuk tindakan ini", 403)
        );
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  authorize,
};
