import { describe, expect, it } from "vitest"

import type { SiteSpec } from "@/lib/site-spec"

import { getMapsUrl, getTheme } from "./theme"

const baseBranding: SiteSpec["branding"] = {
  primaryColor: "#ff0000",
  secondaryColor: "#00ff00",
  backgroundColor: "#000000",
  textColor: "#ffffff",
  accentColor: "#0000ff",
  displayFont: "Georgia",
  bodyFont: "Arial",
}

describe("getTheme", () => {
  it("wraps font names in font-family syntax", () => {
    const theme = getTheme(baseBranding)
    expect(theme.displayFont).toBe("'Georgia', Georgia, serif")
    expect(theme.bodyFont).toBe("'Arial', sans-serif")
  })

  it("passes through color values", () => {
    const theme = getTheme(baseBranding)
    expect(theme.primaryColor).toBe("#ff0000")
    expect(theme.secondaryColor).toBe("#00ff00")
    expect(theme.backgroundColor).toBe("#000000")
    expect(theme.textColor).toBe("#ffffff")
    expect(theme.accentColor).toBe("#0000ff")
  })

  it("applies defaults for empty color strings", () => {
    const theme = getTheme({
      ...baseBranding,
      primaryColor: "",
      backgroundColor: "",
      textColor: "",
      displayFont: "",
      bodyFont: "",
    })
    expect(theme.primaryColor).toBe("#c9a84c")
    expect(theme.backgroundColor).toBe("#1a1410")
    expect(theme.textColor).toBe("#e8ddd0")
    expect(theme.displayFont).toBe("'Playfair Display', Georgia, serif")
    expect(theme.bodyFont).toBe("'Inter', sans-serif")
  })

  it("preserves optional logoUrl and heroImageUrl", () => {
    const theme = getTheme({
      ...baseBranding,
      logoUrl: "https://example.com/logo.png",
      heroImageUrl: "https://example.com/hero.jpg",
    })
    expect(theme.logoUrl).toBe("https://example.com/logo.png")
    expect(theme.heroImageUrl).toBe("https://example.com/hero.jpg")
  })
})

const baseShop: SiteSpec["shop"] = {
  name: "Test Shop",
  slug: "test",
  domain: "test.koureia.com",
  timezone: "America/Los_Angeles",
  paymentMethods: [],
}

describe("getMapsUrl", () => {
  it("returns coordinates URL when mapCoordinates exist", () => {
    const url = getMapsUrl({
      ...baseShop,
      mapCoordinates: { lat: 47.6062, lng: -122.3321 },
      address: "123 Main St",
    })
    expect(url).toBe(
      "https://www.google.com/maps/search/?api=1&query=47.6062,-122.3321",
    )
  })

  it("prefers coordinates over address", () => {
    const url = getMapsUrl({
      ...baseShop,
      mapCoordinates: { lat: 0, lng: 0 },
      address: "Some Address",
    })
    expect(url).toContain("query=0,0")
    expect(url).not.toContain("Some")
  })

  it("falls back to address when no coordinates", () => {
    const url = getMapsUrl({
      ...baseShop,
      address: "123 Main St, Seattle WA",
    })
    expect(url).toBe(
      "https://www.google.com/maps/search/?api=1&query=123%20Main%20St%2C%20Seattle%20WA",
    )
  })

  it("returns null when neither coordinates nor address exist", () => {
    expect(getMapsUrl(baseShop)).toBeNull()
  })
})
