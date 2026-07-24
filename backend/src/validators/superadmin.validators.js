const { z } = require("zod");

const userIdParamSchema = {
  params: z.object({ userId: z.string().uuid("Invalid user id") }),
};

module.exports = { userIdParamSchema };
