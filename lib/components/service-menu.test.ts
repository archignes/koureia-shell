import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import ts from "typescript"

function loadSplitServiceName() {
  const sourcePath = resolve(__dirname, "service-menu.tsx")
  const source = readFileSync(sourcePath, "utf8")
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: sourcePath,
  }).outputText

  const module = { exports: {} as Record<string, unknown> }
  const fakeRequire = (id: string) => {
    if (id === "react") {
      return { useCallback: (fn: unknown) => fn }
    }
    if (id === "@json-render/react") {
      return {
        useBoundProp: () => ["", () => undefined],
        useStateStore: () => ({ set: () => undefined, state: {} }),
      }
    }
    if (id === "react/jsx-runtime") {
      return {
        jsx: () => null,
        jsxs: () => null,
        Fragment: Symbol.for("react.fragment"),
      }
    }
    if (id === "@/lib/utils") {
      return { cn: (...args: unknown[]) => args.filter(Boolean).join(" ") }
    }
    throw new Error(`Unexpected import: ${id}`)
  }

  new Function("require", "module", "exports", transpiled)(
    fakeRequire,
    module,
    module.exports
  )

  return module.exports.splitServiceName as (name: string) => { label: string; badge?: string }
}

const splitServiceName = loadSplitServiceName()

describe("splitServiceName", () => {
  it("extracts a new-client badge and strips the men's prefix", () => {
    expect(splitServiceName("(NEW CLIENT) Men's Cut")).toEqual({
      badge: "NEW CLIENT",
      label: "Cut",
    })
  })

  it("maps leading plus services to the add-on badge", () => {
    expect(splitServiceName("+ Beard Clean Up")).toEqual({
      badge: "ADD-ON",
      label: "Beard Clean Up",
    })
  })

  it("strips the men's prefix when no badge is present", () => {
    expect(splitServiceName("Men's Regular Cut")).toEqual({
      label: "Regular Cut",
    })
  })

  it("leaves unrelated service names unchanged", () => {
    expect(splitServiceName("Red Light Therapy - Hair Growth")).toEqual({
      label: "Red Light Therapy - Hair Growth",
    })
  })
})
