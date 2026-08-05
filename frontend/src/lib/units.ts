// Shared "which pack sizes can this product be sold/restocked in" logic, used
// by both the POS product picker and the restock dialog.
export interface UnitChoice {
  label: string
  factor: number
}

// Preset unit choices offered wherever a product's unit is picked (the
// product form's "Unit" dropdown, and Settings > Stock alerts' per-unit
// threshold rules) - shared so both stay in sync instead of drifting apart.
export const PRESET_UNITS = [
  "pcs",
  "dozen",
  "pack",
  "box",
  "carton",
  "bag",
  "kg",
  "g",
  "litre",
  "millilitre",
  "pair",
  "roll",
  "bundle",
  "set",
]

const PCS = "pcs"
const DOZEN = "dozen"
const DOZEN_FACTOR = 12

/**
 * Builds the full list of pack-size choices for a product: its base unit
 * (factor 1), its configured alternate units, and — only if not already
 * covered by configuration — an implicit "pcs" <-> "dozen" pairing. 1 dozen
 * always equals 12 pcs, so that pairing is offered for free at the register
 * and when restocking even when nothing was set up for that specific
 * product. No other unit gets this treatment: a product tracked in
 * "carton" with no configured pcs conversion stays single-choice, since
 * there's nothing to compute a pcs price/quantity from.
 */
export function getUnitChoices(product: {
  unit: string
  units: { label: string; factor: number }[]
}): UnitChoice[] {
  const choices: UnitChoice[] = [{ label: product.unit, factor: 1 }]
  const seen = new Set([product.unit.trim().toLowerCase()])
  for (const u of product.units) {
    const key = u.label.trim().toLowerCase()
    if (seen.has(key)) continue
    choices.push({ label: u.label, factor: u.factor })
    seen.add(key)
  }

  const base = product.unit.trim().toLowerCase()
  if (base === PCS && !seen.has(DOZEN)) {
    choices.push({ label: DOZEN, factor: DOZEN_FACTOR })
  } else if (base === DOZEN && !seen.has(PCS)) {
    choices.push({ label: PCS, factor: 1 / DOZEN_FACTOR })
  }

  return choices
}
