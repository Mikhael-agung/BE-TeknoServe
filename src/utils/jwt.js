const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET =
    process.env.JWT_SECRET || "complaint-service-secret-key-change-in-production";

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
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};
``;
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
