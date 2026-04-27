import type { IntakeFormData } from "@/lib/intake"
import type { IntakeAnswerValue, IntakeAnswers, IntakePhotosByField } from "./intake-form-types"

export function loadSessionJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback

  try {
    const saved = localStorage.getItem(key)
    return saved ? (JSON.parse(saved) as T) : fallback
  } catch {
    return fallback
  }
}

export function clearDraftStorage(storageKey: string) {
  localStorage.removeItem(`${storageKey}-answers`)
  localStorage.removeItem(`${storageKey}-photos`)
  localStorage.removeItem(`${storageKey}-submission-id`)
}

export function getOrCreateDraftSubmissionId(storageKey: string) {
  if (typeof window === "undefined") return ""

  const key = `${storageKey}-submission-id`
  const existing = localStorage.getItem(key)
  if (existing) return existing

  const nextId = crypto.randomUUID()
  localStorage.setItem(key, nextId)
  return nextId
}

export async function uploadIntakePhoto({
  file,
  shopId,
  submissionId,
}: {
  file: File
  shopId: string
  submissionId?: string
}) {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("shopId", shopId)
  if (submissionId) formData.append("submissionId", submissionId)

  const res = await fetch("/api/intake/upload", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => null)
    throw new Error(errorData?.error ?? `Upload failed (${res.status})`)
  }

  const data = await res.json() as { upload: { path: string; url: string } }
  return data.upload
}

export function canSubmitForm(form: IntakeFormData | null, answers: IntakeAnswers, photosByField: IntakePhotosByField) {
  return getMissingRequiredFields(form, answers, photosByField).length === 0
}

export function getMissingRequiredFields(
  form: IntakeFormData | null,
  answers: IntakeAnswers,
  photosByField: IntakePhotosByField,
) {
  if (!form) return []

  const missingFields = []

  for (const field of form.fields_json) {
    if (!field.required) continue
    if (field.type === "photo") {
      if (!(photosByField[field.key]?.length > 0)) missingFields.push(field)
      continue
    }
    if (field.type === "photo-selfie") continue
    const value = answers[field.key]
    if (Array.isArray(value)) {
      if (value.length === 0) missingFields.push(field)
      continue
    }
    if (!value?.trim()) missingFields.push(field)
  }

  return missingFields
}

export async function submitIntakeForm({
  answers,
  form,
  photosByField,
}: {
  answers: IntakeAnswers
  form: IntakeFormData
  photosByField: IntakePhotosByField
}) {
  const responsesJson: Record<string, unknown> = { ...answers }
  const photosJson: Record<string, unknown>[] = []

  for (const [fieldKey, urls] of Object.entries(photosByField)) {
    for (const url of urls) {
      photosJson.push({ field_key: fieldKey, url })
    }
  }

  return fetch("/api/intake/submissions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      form_id: form.id,
      respondent_name: scalarValue(answers.name),
      respondent_email: scalarValue(answers.email),
      respondent_phone: scalarValue(answers.phone),
      responses_json: responsesJson,
      photos_json: photosJson,
    }),
  })
}

function scalarValue(value: IntakeAnswerValue | undefined) {
  return typeof value === "string" ? value : null
}
