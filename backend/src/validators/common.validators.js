const { z } = require("zod");

const uuidParam = (name) => z.object({ [name]: z.string().uuid(`Invalid ${name}`) });

const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { uuidParam, paginationQuery };
