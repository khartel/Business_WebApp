const prisma = require("./prisma");

/**
 * Loads the two pieces of a business's low-stock alert rule:
 * `defaultLowStockThreshold` (flat fallback) and `lowStockThresholdsByUnit`
 * (a { unit: threshold } map, e.g. {"pcs": 50, "dozen": 5}), configured from
 * Settings > Stock alerts. Every place that resolves stock-row thresholds
 * fetches this once per request rather than per row.
 *
 * @param {string} businessId
 * @returns {Promise<{defaultLowStockThreshold: number, lowStockThresholdsByUnit: Record<string, number>}>}
 */
const getThresholdSettings = async (businessId) => {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { defaultLowStockThreshold: true, lowStockThresholdsByUnit: true },
  });

  return {
    defaultLowStockThreshold: business?.defaultLowStockThreshold ?? 10,
    lowStockThresholdsByUnit: business?.lowStockThresholdsByUnit ?? {},
  };
};

/**
 * Resolves the effective low-stock threshold for one WarehouseStock row: an
 * explicit per-row override always wins; otherwise falls back to the
 * business's rule for that unit, then the business's flat default.
 *
 * @param {number|null|undefined} rawThreshold - The row's own `lowStockThreshold` column.
 * @param {string} unit - The product's unit (e.g. "pcs").
 * @param {{defaultLowStockThreshold: number, lowStockThresholdsByUnit: Record<string, number>}} settings
 * @returns {number}
 */
const resolveLowStockThreshold = (rawThreshold, unit, settings) => {
  if (rawThreshold != null) return rawThreshold;
  const byUnit = settings.lowStockThresholdsByUnit[unit];
  if (typeof byUnit === "number") return byUnit;
  return settings.defaultLowStockThreshold;
};

module.exports = { getThresholdSettings, resolveLowStockThreshold };
