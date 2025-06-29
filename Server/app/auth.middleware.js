const jwt = require('jsonwebtoken');
const { dbGet } = require("./dbHelpers.js");
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

const authMiddleware = async (req, res, next) => {
    const sessionToken = req.headers['x-authorization'];

    if (!sessionToken) {
        req.user = null; // Proceed as unauthenticated
        return next();
    }

    try {
        const user = await dbGet('SELECT * FROM users WHERE session_token = ?', [sessionToken]);
        if (!user) {
            req.user = null; // Proceed as unauthenticated
            return next();
        }
        req.user = user; // Attach user to request
        next();
    } catch (error) {
        console.error("[Middleware] Error during token validation:", error);
        req.user = null; // Proceed as unauthenticated
        next();
    }
};

module.exports = authMiddleware;
