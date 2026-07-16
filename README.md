# Personal Task Manager

A calm, dark, mobile-ready personal task manager — the kind where **nothing slips**.
Open the app → see **Today** → check things off. Everything else (calendar,
projects, recurrence) feeds that one view.

[![CI](https://github.com/suriya911/Personal-task-Tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/suriya911/Personal-task-Tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-8b5cf6.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ecf8e?logo=supabase)](https://supabase.com)
[![Tests](https://img.shields.io/badge/tests-43%20passing-brightgreen)](./lib)

---

## Features

- **Today view** — overdue, today, and no-date buckets with a live progress ring
- **Instant capture** — quick-add with `useOptimistic` (no spinners), auto-categorized by keyword
- **Postpone** — one-click "→ tomorrow" with Undo; tracks how many times a task slipped
- **Calendar** — month grid as a load heat-map; tap any day to work in it
- **Scheduled** — everything upcoming, grouped by day, empty days skipped
- **Recurrence** — daily/weekly/monthly/yearly, every-N intervals; instances generated lazily on read
- **Projects & categories** — group tasks, per-item progress, colored dots
- **Priority + Important** — two independent axes that drive sort order
- **Notes & attachments** — notes and file uploads to Supabase Storage
- **Command palette** — `⌘K` to search tasks, jump anywhere, switch theme
- **Mobile-first** — bottom tab bar, safe-area aware, installable web-app meta
- **Secure by default** — Row Level Security on every table (`auth.uid() = user_id`)

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, Turbopack) |
| UI | shadcn/ui + Tailwind CSS v4, lucide icons, Geist font |
| Database / Auth | Supabase (Postgres + Auth + RLS + Storage) |
| Dates | date-fns · **Validation** zod · **Forms** react-hook-form |
| Tests | Vitest (43 unit tests) · **CI** GitHub Actions |
| Hosting | Vercel |

## Getting started

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase keys
npm run dev                         # http://localhost:3000
```

Full setup (Supabase schema, RLS, Google OAuth, Storage bucket) is documented in
the project's `INSTRUCTIONS.md`.

### Environment variables

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # server only
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Vitest unit tests |
| `npm run types` | Regenerate Supabase types |

## Testing

Pure business logic (recurrence math, postpone rules, auto-categorization,
scheduling, calendar grid, validation) is extracted into unit-tested functions —
the UI and server actions call the same code the tests cover.

```bash
npm test
```

CI runs **typecheck → lint → test → build** on every push and pull request.

## License

[MIT](./LICENSE) © 2026 Suriya
