"use client"

import { JSONUIProvider, Renderer } from "@json-render/react"
import { registry } from "@/lib/json-render/registry"
import type { Spec } from "@json-render/core"

export function SiteRendererJR({ spec }: { spec: Spec }) {
  return (
    <JSONUIProvider handlers={{}} initialState={{}} registry={registry}>
      <Renderer registry={registry} spec={spec} />
    </JSONUIProvider>
  )
}
