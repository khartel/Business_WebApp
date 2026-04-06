const { sendError } = require("../utils/response.utils");

const validateMasterKey = (req, res, next) => {
  const masterKey = req.headers["x-master-key"];

  if (!masterKey) {
    return sendError(res, {
      message: "Access denied. Master key required.",
      statusCode: 401,
    });
  }

  if (masterKey !== process.env.MASTER_KEY) {
    return sendError(res, {
      message: "Access denied. Invalid master key.",
      statusCode: 403,
    });
  }

  next();
};

module.exports = { validateMasterKey };