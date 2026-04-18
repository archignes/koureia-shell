# Copilot Review Instructions — Koureia Shell

## Must-flag patterns

### No eslint-disable
Never add `eslint-disable` comments. If a file exceeds a lint threshold, decompose it into smaller modules. No exceptions.

### No fire-and-forget async in API routes
Vercel kills the process after the response is sent. Every async call in an API route must be awaited before returning. Flag any unawaited promise, `void fn()`, or `.then()` without `await` in route handlers.

### No process.env in shared packages
Shared `@hypandra/*` packages must receive config via function parameters or constructor options, never `process.env`. Flag direct env var access in any `@hypandra/*` import.

### No hardcoded secrets
Flag hardcoded phone numbers, API keys, tokens, or credentials anywhere in source.

### Missing await on database calls
Every database or API call must be awaited. Flag any fetch or data call without `await`.

### UI honesty
Never ship UI that claims to do something it doesn't. If a button says "Book" it must book. If a feature isn't built, don't show the control.

## Shell-specific context

- **Stateless**: No database connection. All data comes from the Koureia internal API.
- **No auth**: All routes are public. Never add authentication to this project.
- **Styling**: Tailwind CSS only. No BEM, no custom CSS classes, no CSS modules.
- **Routing**: Hostname-based multi-tenant. `middleware.ts` reads `Host` header and rewrites to `/{domain}/{slug}`.
- **Tenant data**: Never hardcode tenant data (except mock fallback for local dev).
