"use client"

import { useMemo, useRef, useState } from "react"

import type { DynamicFieldProps } from "./intake-form-types"

export function PhotoField({
  field,
  photos,
  onAdd,
  onRemove,
  textValue,
  onTextChange,
  showPrivacyNotice = true,
}: {
  field: DynamicFieldProps["field"]
  photos: string[]
  onAdd: (file: File) => Promise<void>
  onRemove: (index: number) => void
  textValue: string
  onTextChange: (value: string) => void
  showPrivacyNotice?: boolean
}) {
  const [uploadQueue, setUploadQueue] = useState<Array<{ name: string; progress: number }>>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const uploadInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const remainingSlots = useMemo(() => Math.max(0, 5 - photos.length), [photos.length])
  const hasUploads = photos.length + uploadQueue.length > 0

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return
    setUploadError(null)

    const files = Array.from(fileList)
    if (files.length > remainingSlots) {
      setUploadError("You can upload up to 5 photos. Remove one before adding more.")
    }

    for (const file of files.slice(0, remainingSlots)) {
      setUploadQueue((current) => [...current, { name: file.name, progress: 20 }])
      try {
        setUploadQueue((current) => current.map((item) => item.name === file.name ? { ...item, progress: 65 } : item))
        await onAdd(file)
        setUploadQueue((current) => current.map((item) => item.name === file.name ? { ...item, progress: 100 } : item))
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : "Upload failed")
      } finally {
        setTimeout(() => {
          setUploadQueue((current) => current.filter((item) => item.name !== file.name))
        }, 240)
      }
    }
  }

  return (
    <div className="space-y-2">
      <input
        accept="image/*"
        className="hidden"
        multiple
        ref={uploadInputRef}
        type="file"
        onChange={(event) => {
          void handleFiles(event.target.files)
          event.currentTarget.value = ""
        }}
      />
      <input
        accept="image/*"
        capture="environment"
        className="hidden"
        multiple
        ref={cameraInputRef}
        type="file"
        onChange={(event) => {
          void handleFiles(event.target.files)
          event.currentTarget.value = ""
        }}
      />
      <div className="border-b border-[var(--shell-border)] pb-3">
        <FieldLabel field={field} />
        {field.helpText ? <p className="mt-1 text-xs leading-5 text-[var(--shell-text-subtle)]">{field.helpText}</p> : null}
      </div>

      <>
          {field.placeholder || textValue ? (
            <div className="relative">
              <textarea
                className="w-full resize-none rounded-[20px] border border-[var(--shell-border)] bg-[var(--shell-bg-elevated)] px-4 py-3 text-base text-[var(--shell-text)] placeholder:text-[var(--shell-text-subtle)] focus:border-[var(--shell-accent)] focus:outline-none"
                placeholder={field.placeholder ?? "Describe the look, tone, or inspiration you have in mind."}
                rows={3}
                value={textValue}
                onChange={(event) => onTextChange(event.target.value)}
              />
            </div>
          ) : null}

          {hasUploads ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {photos.map((photo, index) => (
                  <div key={photo} className="group relative aspect-square overflow-hidden rounded-[22px] border border-[var(--shell-border)] bg-[var(--shell-bg-elevated)]">
                    <img alt="" className="h-full w-full object-cover" src={photo} />
                    <button
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--shell-bg)]/85 text-[var(--shell-text)] opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                      type="button"
                      onClick={() => onRemove(index)}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}

                {uploadQueue.map((item) => (
                  <div key={item.name} className="aspect-square overflow-hidden rounded-[22px] border border-[var(--shell-border)] bg-[var(--shell-bg-soft)] p-3">
                    <div className="flex h-full min-w-0 flex-col justify-between">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium leading-5 text-[var(--shell-text-muted)]">{item.name}</p>
                        <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-[var(--shell-accent)]/80">Uploading</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 rounded-full bg-[var(--shell-border)]">
                          <div className="h-2 rounded-full bg-[var(--shell-accent)] transition-all" style={{ width: `${item.progress}%` }} />
                        </div>
                        <p className="text-[11px] leading-none text-[var(--shell-text-subtle)]">{item.progress}%</p>
                      </div>
                    </div>
                  </div>
                ))}

                {photos.length + uploadQueue.length < 5 ? (
                  <button
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-[var(--shell-border-strong)] bg-[var(--shell-bg-soft)]/85 transition-colors hover:border-[var(--shell-accent)]"
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    <UploadIcon />
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--shell-accent)]/85">Add photo</p>
                      {photos.length + uploadQueue.length > 0 ? (
                        <p className="text-[10px] text-[var(--shell-text-subtle)]">{remainingSlots} left</p>
                      ) : null}
                    </div>
                  </button>
                ) : null}
              </div>
              {photos.length + uploadQueue.length < 5 ? (
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--shell-border)] px-4 text-xs font-medium text-[var(--shell-text-muted)] transition-colors hover:border-[var(--shell-accent)]/55 hover:text-[var(--shell-text)]"
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    Take photo
                  </button>
                  <button
                    className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--shell-border)] px-4 text-xs font-medium text-[var(--shell-text-muted)] transition-colors hover:border-[var(--shell-accent)]/55 hover:text-[var(--shell-text)]"
                    type="button"
                    onClick={() => uploadInputRef.current?.click()}
                  >
                    Upload
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="space-y-3 py-1">
              <div className="flex justify-center">
                <button
                  className="flex min-h-24 w-full max-w-[13rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-[20px] border-2 border-dashed border-[var(--shell-border-strong)] bg-[var(--shell-bg-soft)]/85 px-5 transition-colors hover:border-[var(--shell-accent)]"
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  <UploadIcon />
                  <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--shell-accent)]/85">Add photo</p>
                </button>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--shell-border)] px-4 text-xs font-medium text-[var(--shell-text-muted)] transition-colors hover:border-[var(--shell-accent)]/55 hover:text-[var(--shell-text)]"
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  Take photo
                </button>
                <button
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--shell-border)] px-4 text-xs font-medium text-[var(--shell-text-muted)] transition-colors hover:border-[var(--shell-accent)]/55 hover:text-[var(--shell-text)]"
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                >
                  Upload
                </button>
              </div>
            </div>
          )}

          {uploadError ? (
            <div className="rounded-[18px] border border-red-900/40 bg-red-950/40 px-3 py-2 text-xs text-red-300">
              {uploadError}
            </div>
          ) : null}

          {showPrivacyNotice ? (
            <div className="flex items-start gap-1.5">
              <LockIcon />
              <p className="text-[10px] text-[var(--shell-text-subtle)]">
                Photos are shared only with your stylist and used for consultation purposes only.
              </p>
            </div>
          ) : null}
      </>
    </div>
  )
}

function FieldLabel({ field }: Pick<DynamicFieldProps, "field">) {
  return (
    <label className="text-sm font-medium text-[var(--shell-text)]">
      {field.label}
      {field.required ? <span className="ml-0.5 text-red-500">*</span> : null}
    </label>
  )
}

function UploadIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5 text-[var(--shell-accent)]" fill="none" viewBox="0 0 24 24">
      <path d="M12 16V7m0 0-3.5 3.5M12 7l3.5 3.5M5 17.5v.5A2 2 0 0 0 7 20h10a2 2 0 0 0 2-2v-.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0 text-[var(--shell-text-subtle)]" fill="none" viewBox="0 0 24 24">
      <path d="M8 10V7a4 4 0 1 1 8 0v3m-9 0h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  )
}
