# CLAUDE.md — koureia-shell

## Overview

The **koureia-shell** is the single Vercel project that serves all Koureia tenant public sites. One deployment handles all shops via hostname-based routing. New tenants are onboarded by attaching their domain to this project via the Vercel API — no new project, no rebuild.

**Linear:** DEV-2414
**GitHub:** `danielsgriffin/koureia-shell`
**Live:** `*.koureia.com` (wildcard domain, NS delegated to Vercel)

Full architecture docs: `~/projects/cb/builds/koureia/docs/multi-tenant-provisioning.md`

## Stack

- Next.js 15+, React 19, Bun, Tailwind CSS 4, TypeScript
- No database connection — reads from Koureia internal API
- No auth — public sites only

## Commands

```bash
bun dev      # Local dev (serves mock tenants, no real domain lookup)
bun build    # Production build
bun lint     # ESLint
```

## How routing works

1. `middleware.ts` reads the `Host` header, normalizes it, rewrites to `/{domain}/{slug}`
2. `app/[domain]/[[...slug]]/page.tsx` catches all routes
3. `lib/tenant.ts` calls `GET {KOUREIA_API_URL}/api/shops/by-domain?domain={domain}`
4. Returns `TenantSpec` → page renders the shop

In local dev (no `KOUREIA_API_URL`), `lib/tenant.ts` falls back to hardcoded mock tenants.

## Key files

| File | Purpose |
|---|---|
| `middleware.ts` | Host → domain rewrite. Has `matcher` to exclude `/_next`, `/api`, static files |
| `app/[domain]/[[...slug]]/page.tsx` | Catch-all. Resolves tenant, handles all states |
| `lib/tenant.ts` | Tenant resolution. Live API or mock fallback |
| `app/page.tsx` | Dev-only index — never shown in production |

## Env vars

| Var | Value | Notes |
|---|---|---|
| `KOUREIA_API_URL` | `https://koureia.com` | Set in Vercel. Omit for local dev (uses mock) |

## Current phase

**Phase 1:** Branded placeholder page — confirms routing works end-to-end. Shows shop name, domain, gold/dark branding.

**Phase 2 (next):** Wire `@json-render/react` + `@json-render/shadcn` + Koureia custom component registry. Replace placeholder with real spec-driven site.

## Deployment

Deploys via GitHub push to `main` → Vercel auto-deploys. Do not use `vercel --prod` directly.

Adding a new tenant domain: handled by `POST /api/admin/provision-site` in the Koureia internal app — no changes to this repo needed.

## What NOT to do

- Do not add a database connection — this project is stateless
- Do not add auth — all routes are public
- Do not hardcode tenant data (except in the mock fallback for dev)
- Do not use `vercel --prod` — deploys go through GitHub
