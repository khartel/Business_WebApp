/**
 * Shared, reusable zod pieces used across multiple validator files
 * (a generic UUID route-param validator and a generic pagination query).
 */
const { z } = require("zod");

/** Builds a params schema requiring `name` to be a valid UUID (e.g. uuidParam("productId")). */
const uuidParam = (name) => z.object({ [name]: z.string().uuid(`Invalid ${name}`) });

/** Generic page/limit pagination query schema; limit is capped at 100 to avoid unbounded result sets. */
const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

module.exports = { uuidParam, paginationQuery };
