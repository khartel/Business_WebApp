import { describe, expect, test } from "vitest"
import { getUnitChoices } from "./units"

describe("getUnitChoices", () => {
  test("always includes the base unit first, at factor 1", () => {
    const choices = getUnitChoices({ unit: "carton", units: [] })
    expect(choices[0]).toEqual({ label: "carton", factor: 1 })
  })

  test("includes configured alternate units alongside the base unit", () => {
    const choices = getUnitChoices({
      unit: "carton",
      units: [{ label: "pcs", factor: 1 / 24 }],
    })
    expect(choices).toEqual([
      { label: "carton", factor: 1 },
      { label: "pcs", factor: 1 / 24 },
    ])
  })

  test("adds an implicit dozen option when base unit is pcs and dozen isn't already configured", () => {
    const choices = getUnitChoices({ unit: "pcs", units: [] })
    expect(choices).toEqual([
      { label: "pcs", factor: 1 },
      { label: "dozen", factor: 12 },
    ])
  })

  test("adds an implicit pcs option when base unit is dozen and pcs isn't already configured", () => {
    const choices = getUnitChoices({ unit: "dozen", units: [] })
    expect(choices).toEqual([
      { label: "dozen", factor: 1 },
      { label: "pcs", factor: 1 / 12 },
    ])
  })

  test("doesn't add a duplicate dozen option if one is already explicitly configured", () => {
    const choices = getUnitChoices({
      unit: "pcs",
      units: [{ label: "dozen", factor: 6 }],
    })
    expect(choices).toEqual([
      { label: "pcs", factor: 1 },
      { label: "dozen", factor: 6 },
    ])
  })

  test("doesn't add pcs/dozen pairing for a base unit that is neither pcs nor dozen and has no configured units", () => {
    const choices = getUnitChoices({ unit: "carton", units: [] })
    expect(choices).toEqual([{ label: "carton", factor: 1 }])
  })

  test("de-duplicates a configured unit that matches the base unit case-insensitively", () => {
    const choices = getUnitChoices({
      unit: "Carton",
      units: [{ label: "carton", factor: 2 }],
    })
    expect(choices).toEqual([{ label: "Carton", factor: 1 }])
  })
})
