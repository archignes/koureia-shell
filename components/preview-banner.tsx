"use client"

import { useState } from "react"

export function PreviewBanner({ variantName }: { variantName: string }) {
  const [visible, setVisible] = useState(true)

  if (!visible) return null

  return (
    <div className="sticky top-0 z-50 border-b border-stone-700 bg-stone-950 px-4 py-2 text-stone-100 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p className="text-sm">This is the {variantName} preview.</p>
        <button
          aria-label="Dismiss preview banner"
          className="inline-flex size-8 items-center justify-center border border-stone-700 text-lg leading-none text-stone-300 hover:border-stone-500 hover:text-white"
          type="button"
          onClick={() => setVisible(false)}
        >
          &times;
        </button>
      </div>
    </div>
  )
}
