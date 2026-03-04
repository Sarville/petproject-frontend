# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint

# Database
docker compose up -d               # Start PostgreSQL (wishlist_db on port 5432)
npm run prisma:generate            # Regenerate Prisma client after schema changes
npx prisma migrate deploy          # Apply migrations (use this — NOT migrate dev, which fails in non-TTY)
```

**Important**: `prisma migrate dev` is blocked in non-interactive environments. Always write migration SQL manually in `prisma/migrations/YYYYMMDDHHMMSS_name/migration.sql` and apply with `prisma migrate deploy`.

After any schema change: run `prisma migrate deploy` → `npm run prisma:generate` → `npm run build`.

## Architecture

**Stack**: Next.js 16 (App Router) + TypeScript + PostgreSQL 16 + Prisma 7 + Tailwind CSS 4

### Critical version-specific behaviors

- **Next.js 16**: Middleware is called `proxy` — the file is `src/proxy.ts` and exports `async function proxy(...)`. Do NOT use `middleware.ts` or `export function middleware`. Route segment configs (`export const runtime`, `export const config`) are NOT allowed in `src/proxy.ts`; the proxy always runs on Node.js.
- **Prisma 7**: The `datasource` block in `schema.prisma` has NO `url` field — the connection string lives in `prisma.config.ts` via `defineConfig({ datasource: { url: env("DATABASE_URL") } })`. PrismaClient requires the `@prisma/adapter-pg` driver adapter (see `src/lib/prisma.ts`).
- **Tailwind CSS 4**: CSS uses `@import "tailwindcss"` (not `@tailwind` directives). PostCSS plugin is `"@tailwindcss/postcss"` (not `"tailwindcss"`).

### Request logging (proxy)

`src/proxy.ts` intercepts every HTTP request before it reaches any route handler. It reads the body (for POST/PATCH/PUT with JSON or text content-type), then fire-and-forgets a write to the `request_logs` table. The matcher skips `_next/static`, `_next/image`, `favicon.ico`, and `api/request-logs` (to avoid an infinite loop).

### Database models (`prisma/schema.prisma`)

| Model | Table | Purpose |
|---|---|---|
| `Wish` | `wishes` | Core entity — title (≤50), optional description |
| `WishLog` | `wish_logs` | Audit log for CRUD on wishes (oldValues/newValues as JSON) |
| `RequestLog` | `request_logs` | Every HTTP request — method, url, body, timestamp |

### API routes (`src/app/api/`)

| Route | Methods | Notes |
|---|---|---|
| `/api/wishes` | GET, POST | Paginated list with ILIKE search; POST creates + writes WishLog |
| `/api/wishes/[id]` | GET, PATCH, DELETE | UUID validated via `src/lib/validate.ts`; PATCH merges then re-validates; DELETE returns 204 |
| `/api/wish-logs` | GET | Paginated wish audit log — filter by action, search by title, sortDir |
| `/api/request-logs` | GET | Paginated HTTP request log — filter by method, search by URL, sortDir |
| `/api/artsearch/[...path]` | ALL | Reverse proxy — forwards to artsearch.io with API key header; returns 418 on upstream error |

All API routes use `export const runtime = "nodejs"` so Prisma can connect.

### Frontend (`src/app/`)

Single-page app (`page.tsx` → `WishList.tsx`). All state lives in `WishList.tsx` (client component). Layout uses `h-screen overflow-hidden` with a fixed header/pagination and a scrollable-only wish list (`flex-1 overflow-y-auto min-h-0`).

- `WishModal.tsx` — handles both create and edit (null `wish` prop = create). Title capped at 50 chars, description at 300, with live counters.
- `LogPanel.tsx` — slide-in panel (right side) showing HTTP request logs from `/api/request-logs`.
- Shared types: `src/types/wish.ts` — `Wish`, `WishLog`, `RequestLog` and their paginated variants.
- Validation helpers: `src/lib/validate.ts` — `isValidUUID()` and `validateWishPayload()`.

### Color scheme

Background `#0a1628`, cards `#1e3a5f` (hover `#234876`), accent `blue-600`, text `slate-200`.
