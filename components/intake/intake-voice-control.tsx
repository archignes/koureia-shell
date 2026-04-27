"use client"

import { useEffect } from "react"

import { useRecorder } from "@hypandra/voice/recorder"

const INTAKE_TRANSCRIPTION_PROMPT =
  "Salon intake form. Terms: balayage, highlights, toner, developer, Shades EQ, K18, foils, extensions, fine hair, medium hair, thick hair, straight hair, curly hair, coarse hair."

export function useVoiceField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const recorder = useRecorder({
    transcribeEndpoint: "/api/intake/dictation/transcribe",
    transcriptionPrompt: INTAKE_TRANSCRIPTION_PROMPT,
  })

  useEffect(() => {
    if (!recorder.transcript) return
    onChange(appendTranscript(value, recorder.transcript))
    recorder.clearTranscript()
  }, [onChange, recorder, value])

  return recorder
}

export function VoiceControl({
  state,
  elapsed,
  formatDuration,
  startRecording,
  stopRecording,
}: {
  state: "idle" | "recording" | "transcribing"
  elapsed: number
  formatDuration: (seconds: number) => string
  startRecording: () => Promise<void>
  stopRecording: () => void
}) {
  const isRecording = state === "recording"
  const isBusy = state === "transcribing"
  const label = isRecording
    ? `Stop recording (${formatDuration(elapsed)})`
    : isBusy
      ? "Transcribing voice input"
      : "Start voice input"

  return (
    <button
      aria-label={label}
      className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
        isRecording
          ? "border-red-500/50 bg-red-500/15 text-red-300"
          : isBusy
            ? "border-[var(--shell-border)] bg-[var(--shell-bg-soft)] text-[var(--shell-text-subtle)]"
            : "border-[var(--shell-border)] bg-[var(--shell-bg-soft)] text-[var(--shell-accent)] hover:border-[var(--shell-accent)]/55"
      }`}
      disabled={isBusy}
      onClick={isRecording ? stopRecording : () => void startRecording()}
      title={isRecording ? `Recording ${formatDuration(elapsed)}` : "Tap to speak"}
      type="button"
    >
      {isBusy ? <SpinnerIcon /> : <MicIcon crossed={false} />}
    </button>
  )
}

export function VoiceStatus({
  state,
  elapsed,
  error,
  formatDuration,
}: {
  state: "idle" | "recording" | "transcribing"
  elapsed: number
  error: string | null
  formatDuration: (seconds: number) => string
}) {
  if (error) {
    return <p className="text-xs text-red-400">{error}</p>
  }
  if (state === "recording") {
    return <p className="text-xs text-red-300">Recording {formatDuration(elapsed)}. Tap again to stop.</p>
  }
  if (state === "transcribing") {
    return <p className="text-xs text-[var(--shell-text-subtle)]">Transcribing…</p>
  }
  return null
}

export function VoiceNotAvailable({ message }: { message: string }) {
  return <p className="text-xs text-red-400">{message}</p>
}

function appendTranscript(currentValue: string, transcript: string) {
  const trimmedCurrent = currentValue.trim()
  const trimmedTranscript = transcript.trim()
  if (!trimmedTranscript) return currentValue
  if (!trimmedCurrent) return trimmedTranscript
  return `${trimmedCurrent} ${trimmedTranscript}`
}

function MicIcon({ crossed }: { crossed: boolean }) {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path d="M12 4a2 2 0 0 1 2 2v5a2 2 0 1 1-4 0V6a2 2 0 0 1 2-2Zm5 7a5 5 0 0 1-10 0M12 16v4m-3 0h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      {crossed ? <path d="M6 18 18 6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /> : null}
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" opacity="0.2" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
    </svg>
  )
}
