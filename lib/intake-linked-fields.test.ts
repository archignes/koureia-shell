import { describe, expect, it } from "vitest"

import { filterLinkedIntakeFields } from "./intake-linked-fields"

describe("linked intake fields", () => {
  it("removes contact fields and requires remaining non-photo fields when needed", () => {
    const fields = [
      { key: "name", type: "text" as const, label: "Name", required: true },
      { key: "phone", type: "phone" as const, label: "Phone" },
      { key: "service", type: "radio" as const, label: "Service", options: ["Haircut"] },
      { key: "photo", type: "photo" as const, label: "Photo" },
      { key: "notes", type: "textarea" as const, label: "Notes" },
    ]

    expect(filterLinkedIntakeFields(fields)).toEqual([
      { key: "service", type: "radio", label: "Service", options: ["Haircut"], required: true },
      { key: "photo", type: "photo", label: "Photo" },
      { key: "notes", type: "textarea", label: "Notes", required: true },
    ])
  })
})
