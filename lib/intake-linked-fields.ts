import type { IntakeField } from "@/lib/intake"

export const INTAKE_LINK_TOKEN_PARAM = "ilt"

const LINKED_CONTACT_FIELD_KEYS = new Set(["name", "email", "phone"])

export type LinkedIntakeClient = {
  displayName: string
}

export function isLinkedContactField(field: Pick<IntakeField, "key" | "type">) {
  return LINKED_CONTACT_FIELD_KEYS.has(field.key) || field.type === "email" || field.type === "phone"
}

export function filterLinkedIntakeFields<T extends Pick<IntakeField, "key" | "type" | "required">>(fields: T[]) {
  const visibleFields = fields.filter((field) => !isLinkedContactField(field))
  if (visibleFields.some((field) => field.required)) return visibleFields

  return visibleFields.map((field) => (
    field.type === "photo"
      ? field
      : { ...field, required: true }
  ))
}
