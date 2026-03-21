# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

No test runner or linter is configured in this project.

## Environment Setup

Set `GEMINI_API_KEY` in `.env.local` before running. The app degrades gracefully without it, falling back to the local job database.

## Architecture

This is a client-only React 19 + TypeScript SPA (no backend) bundled with Vite. All state lives in `App.tsx` — a single root managing `currentView` (which panel is shown) and `userProfile` (the user's professional data).

**Data flow**: Component → `services/geminiService.ts` → Gemini API or `data/jobDatabase.ts` → structured JSON response → component re-render.

### Key files

- `types.ts` — all shared TypeScript interfaces (`Job`, `UserProfile`, `EmailDraft`, `EmailMessage`, `ChatMessage`, `AppView`)
- `App.tsx` — root state + view routing; seeds initial profile data
- `services/geminiService.ts` — all Gemini API calls; uses `gemini-2.5-flash`, structured JSON output schemas, and Google Search grounding for job search
- `data/jobDatabase.ts` — curated static job listings (Indian tech companies); used as primary/fallback source
- `components/Layout.tsx` — sidebar nav (desktop) + hamburger menu (mobile)
- `components/JobSearch.tsx` — merges curated DB matches (95% score) with live Gemini/Google Search results (80% score)
- `components/EmailAssistant.tsx` — Smart Inbox simulation + email response drafting with tone selection
- `components/Profile.tsx` — profile editing, skill management, resume upload + Gemini-powered PDF parsing

### Gemini service patterns

- All functions accept `UserProfile` for personalization context
- `cleanJsonString()` helper strips markdown code fences from API responses before `JSON.parse`
- Structured output schemas are defined inline per function for reliable parsing
- Functions gracefully return mock/local data when `API_KEY` is absent

### Styling

Tailwind CSS is loaded via CDN (`cdn.tailwindcss.com`) — no build-time CSS compilation. Primary color scheme: indigo/purple. All responsive breakpoints use `md:` and `lg:` prefixes.

### Path aliases

`@/` maps to the repo root (configured in both `tsconfig.json` and `vite.config.ts`).

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
