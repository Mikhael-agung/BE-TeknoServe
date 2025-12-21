const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === "fallback") {
    console.error("❌ [JWT] ERROR: JWT_SECRET not set in environment");
    console.error("❌ [JWT] Please set JWT_SECRET in .env file");
    process.exit(1); // Stop server if no secret
}

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            userId: user.id,
            username: user.username,
            role: user.role,
            email: user.email,
        },
        JWT_SECRET,
        { expiresIn: "7d" } // Token valid 7 hari
    );
};

const verifyToken = (token) => {
    try {
        console.log('🔐 [JWT] Verifying token with secret:', JWT_SECRET.substring(0, 10) + '...');
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('✅ [JWT] Token verified successfully for user:', decoded.username);
        return decoded;
    } catch (error) {
        console.error('❌ [JWT] Verify Error:', error.message);
        console.error('❌ [JWT] Token:', token ? token.substring(0, 50) + '...' : 'null');
        return null;
    }
};


const decodeToken = (token) => {
    try {
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
    decodeToken,
    JWT_SECRET,
};
