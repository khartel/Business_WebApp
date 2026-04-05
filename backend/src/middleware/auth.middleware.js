const { verifyToken } = require("../utils/jwt.utils");
const { sendError } = require("../utils/response.utils");

const authenticate = (req, res, next) => {
  try {
    // Get token from header or cookie
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.token;

    let token = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      return sendError(res, {
        message: "Access denied. No token provided.",
        statusCode: 401,
      });
    }

    // Verify the token
    const decoded = verifyToken(token);

    // Attach user info to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, {
        message: "Session expired. Please log in again.",
        statusCode: 401,
      });
    }

    return sendError(res, {
      message: "Invalid token. Please log in again.",
      statusCode: 401,
    });
  }
};

module.exports = { authenticate };