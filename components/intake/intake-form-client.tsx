"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { IntakeFormData } from "@/lib/intake"
import { filterLinkedIntakeFields } from "@/lib/intake-linked-fields"
import type { IntakeAnswerValue, MissingField } from "./intake-form-types"
import { buildSections } from "./intake-sections"
import {
  canSubmitForm,
  clearDraftStorage,
  getMissingRequiredFields,
  getOrCreateDraftSubmissionId,
  loadSessionJson,
  submitIntakeForm,
  uploadIntakePhoto,
} from "./intake-form-utils"
import { IntakePageView, SuccessState } from "./intake-form-view"

export function IntakeFormClient({
  form,
  intakeLinkToken,
  tenantName,
  returnHref,
}: {
  form: IntakeFormData
  intakeLinkToken?: string | null
  tenantName: string
  returnHref: string
}) {
  const effectiveForm = useMemo(
    () => form.linkedClient ? { ...form, fields_json: filterLinkedIntakeFields(form.fields_json) } : form,
    [form],
  )
  const storageKey = `shell-intake-${form.shop_id}-${form.form_type}${intakeLinkToken ? "-linked" : ""}`
  const [draftSubmissionId] = useState(() => getOrCreateDraftSubmissionId(storageKey))
  const [answers, setAnswers] = useState<Record<string, IntakeAnswerValue>>(() => loadSessionJson(`${storageKey}-answers`, {}))
  const [photosByField, setPhotosByField] = useState<Record<string, string[]>>(() => loadSessionJson(`${storageKey}-photos`, {}))
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const scrollRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    localStorage.setItem(`${storageKey}-answers`, JSON.stringify(answers))
  }, [answers, storageKey])

  useEffect(() => {
    localStorage.setItem(`${storageKey}-photos`, JSON.stringify(photosByField))
  }, [photosByField, storageKey])

  const sections = useMemo(() => buildSections(effectiveForm.fields_json), [effectiveForm.fields_json])
  const totalSections = sections.length + 1

  const setAnswer = useCallback((key: string, value: IntakeAnswerValue) => {
    setAnswers((current) => ({ ...current, [key]: value }))
  }, [])

  const addPhoto = useCallback(async (fieldKey: string, file: File) => {
    const upload = await uploadIntakePhoto({
      file,
      shopId: effectiveForm.shop_id,
      submissionId: draftSubmissionId || undefined,
    })

    setPhotosByField((current) => ({
      ...current,
      [fieldKey]: [...(current[fieldKey] ?? []), upload.url],
    }))
  }, [draftSubmissionId, effectiveForm.shop_id])

  const removePhoto = useCallback((fieldKey: string, index: number) => {
    setPhotosByField((current) => ({
      ...current,
      [fieldKey]: (current[fieldKey] ?? []).filter((_, photoIndex) => photoIndex !== index),
    }))
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const index = sectionRefs.current.indexOf(entry.target as HTMLDivElement)
            if (index !== -1) setActiveIndex(index)
          }
        }
      },
      { root: scrollRef.current, threshold: 0.6 },
    )

    for (const ref of sectionRefs.current) {
      if (ref) observer.observe(ref)
    }

    return () => observer.disconnect()
  }, [sections])

  const scrollTo = useCallback((index: number) => {
    sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return

      const next = () => {
        event.preventDefault()
        scrollTo(Math.min(activeIndex + 1, totalSections - 1))
      }
      const prev = () => {
        event.preventDefault()
        scrollTo(Math.max(activeIndex - 1, 0))
      }

      switch (event.key) {
        case "j":
        case "ArrowDown":
        case "ArrowRight":
          next()
          break
        case "k":
        case "ArrowUp":
        case "ArrowLeft":
          prev()
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeIndex, scrollTo, totalSections])

  const canSubmit = useMemo(() => canSubmitForm(effectiveForm, answers, photosByField), [answers, effectiveForm, photosByField])
  const hasStarted = useMemo(
    () =>
      Object.values(answers).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value?.trim())) ||
      Object.values(photosByField).some((photos) => photos.length > 0),
    [answers, photosByField],
  )
  const missingFields = useMemo<MissingField[]>(
    () =>
      getMissingRequiredFields(effectiveForm, answers, photosByField).map((field) => ({
        key: field.key,
        label: field.label,
        sectionIndex: sections.findIndex((section) => section.fields.some((sectionField) => sectionField.key === field.key)),
      })),
    [answers, effectiveForm, photosByField, sections],
  )

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await submitIntakeForm({
        answers,
        form: effectiveForm,
        intakeLinkToken,
        photosByField,
      })

      if (res.ok) {
        clearDraftStorage(storageKey)
        setSubmitted(true)
      } else {
        const errorData = await res.json().catch(() => null)
        setError(errorData?.error ?? `Server error (${res.status})`)
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Failed to submit. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }, [answers, canSubmit, effectiveForm, intakeLinkToken, photosByField, storageKey, submitting])

  if (submitted) {
    const photoCount = Object.values(photosByField).reduce((count, urls) => count + urls.length, 0)
    return <SuccessState formTitle={effectiveForm.title} href={returnHref} photoCount={photoCount} />
  }

  return (
    <IntakePageView
      activeIndex={activeIndex}
      answers={answers}
      canSubmit={canSubmit}
      error={error}
      form={effectiveForm}
      hasStarted={hasStarted}
      missingFields={missingFields}
      tenantName={tenantName}
      photosByField={photosByField}
      sections={sections}
      submitting={submitting}
      totalSections={totalSections}
      scrollRef={scrollRef}
      sectionRefs={sectionRefs}
      addPhoto={addPhoto}
      removePhoto={removePhoto}
      clearDraft={() => {
        setAnswers({})
        setPhotosByField({})
        clearDraftStorage(storageKey)
        scrollTo(0)
      }}
      handleSubmit={() => void handleSubmit()}
      scrollTo={scrollTo}
      setAnswer={setAnswer}
    />
  )
}
