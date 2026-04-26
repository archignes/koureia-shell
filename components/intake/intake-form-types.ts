import type { IntakeField, IntakeFormData } from "@/lib/intake"
import type { Section } from "./intake-sections"

export type IntakeAnswerValue = string | string[]
export type IntakeAnswers = Record<string, IntakeAnswerValue>
export type IntakePhotosByField = Record<string, string[]>
export type MissingField = {
  key: string
  label: string
  sectionIndex: number
}

export type DynamicFieldProps = {
  field: IntakeField
  value: IntakeAnswerValue
  onChange: (value: IntakeAnswerValue) => void
  photos: string[]
  onAddPhoto: (file: File) => Promise<void>
  onRemovePhoto: (index: number) => void
}

export type IntakePageViewProps = {
  activeIndex: number
  answers: IntakeAnswers
  canSubmit: boolean
  error: string | null
  form: IntakeFormData
  hasStarted: boolean
  missingFields: MissingField[]
  tenantName: string
  photosByField: IntakePhotosByField
  sections: Section[]
  submitting: boolean
  totalSections: number
  scrollRef: React.RefObject<HTMLDivElement | null>
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>
  addPhoto: (fieldKey: string, file: File) => Promise<void>
  removePhoto: (fieldKey: string, index: number) => void
  clearDraft: () => void
  handleSubmit: () => void
  scrollTo: (index: number) => void
  setAnswer: (key: string, value: IntakeAnswerValue) => void
}
