// middleware/auth.js
// Verifies JWT from HTTP-only cookie OR Authorization: Bearer header.
// Attaches decoded user to req.user for downstream controllers.

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Prefer HTTP-only cookie (most secure in browser context)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Fall back to Authorization header (useful for Postman / mobile clients)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated — no token" });
    }

    // Throws JsonWebTokenError or TokenExpiredError on failure
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user — ensures revoked / deleted accounts are rejected
    const user = await User.findById(decoded.id);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User no longer exists" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Session expired — please log in again" });
    }
    return res
      .status(401)
      .json({ success: false, message: "Invalid token" });
  }
};

module.exports = { protect };
