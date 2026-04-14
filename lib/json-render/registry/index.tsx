"use client"

import { defineRegistry } from "@json-render/react"

import { catalog } from "../catalog"
import { requestComponents } from "./request"
import { siteComponents } from "./site"

export const { registry } = defineRegistry(catalog, {
  components: {
    ...siteComponents,
    ...requestComponents,
  },
  actions: {},
})
