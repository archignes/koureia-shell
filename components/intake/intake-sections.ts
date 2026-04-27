import type { IntakeField } from "@/lib/intake"

export interface Section {
  id: string
  label: string
  fields: IntakeField[]
}

const SECTION_LABELS: Record<string, string> = {
  service: "Service",
  inspiration: "Style",
  selfie: "Photo",
  notes: "Notes",
  hair_history: "History",
  hair_type: "Hair type",
  hair_labels: "Type",
  goals: "Goals",
  experience: "Experience",
  maintenance: "Schedule",
  photos: "Photos",
  availability_ack: "Confirm",
}

export function buildSections(fields: IntakeField[]): Section[] {
  const sections: Section[] = []
  const contactFields = fields.filter((field) => field.type === "text" || field.type === "email" || field.type === "phone")
  const hairHistoryField = fields.find((field) => field.key === "hair_history")
  const otherFields = fields.filter((field) =>
    field.type !== "text" &&
    field.type !== "email" &&
    field.type !== "phone" &&
    field.key !== "hair_history",
  )

  if (contactFields.length > 0) {
    sections.push({
      id: "contact",
      label: "Contact",
      fields: contactFields,
    })
  }

  if (hairHistoryField) {
    sections.push({
      id: "hair_history",
      label: "History",
      fields: [hairHistoryField],
    })
  }

  for (let index = 0; index < otherFields.length; index += 1) {
    const field = otherFields[index]
    const nextField = otherFields[index + 1]

    if (field.type === "photo" && nextField?.type === "photo") {
      sections.push({
        id: "photos",
        label: "Photos",
        fields: [field, nextField],
      })
      index += 1
      continue
    }

    const label = SECTION_LABELS[field.key] ?? (field.type === "checkbox" ? "Confirm" : field.label.split(" ").slice(0, 2).join(" "))
    sections.push({
      id: field.key,
      label,
      fields: [field],
    })
  }

  return sections
}
