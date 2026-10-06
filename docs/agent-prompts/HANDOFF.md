# G-AGE redesign — handoff for the next agent

Branch: `redesign/staging-safe-ui` (draft PR to `main`, DO NOT MERGE). Read docs/FEATURE_MAP.md, docs/UI_AUDIT.md, docs/UI_STRATEGY.md, docs/UI_REVIEW.md, docs/STAGING.md first, then `git log --oneline -30`. Do not restart or redo finished work.

## Rules
- Staging config only; never touch production URL, database, keys or API.
- Backend changes additive only (CREATE/ALTER ... IF NOT EXISTS); keep tests/route-baseline.json green (routes may be added, never removed).
- No invented data (book titles, boards, legal text, prices, package ids). Use TODO(owner) markers.
- Small commits; lint, test and build must pass after each step.
- All UI strings through src/i18n/ui.ts (English + Roman Urdu); colors/spacing from tokens only (`npm run check:tokens`).

## Already done (25 commits)
Staging safety (APP_ENV, prod-DB guard, jobs switch, noindex, smoke script, route contract); design tokens + UI primitives; persona /recent fix + identity resolver; class-level catalog API; Subjects home; first-run welcome; class prompt; empty-chat hero; chat shell + composer; Explore disclosure; reply actions; Tune popover; New Chat -> Subjects; mobile nav; admin catalog + safe seed script; progressive sidebar + profile menu; Me screen; Settings; Plan & usage; Notes search/export/migrate; Terms/Privacy/Install/Export (verify they really work).

## Still to do (in order)
1. Verify by running the app: /terms, /privacy, Export my data, Install app, Share (must use public Q&A mechanism, explicit tap, hidden on image answers), mobile tab bar.
2. Fix build warnings: missing Nastaleeq font asset, CompiledNotesModal mixed static/dynamic import, main bundle size (measure baseline from the commit before this branch; budget +20% gzip; lazy-load Admin, Graph, Compare, Timeline, Developer API, Tour).
3. Pro-locked camera card (non-Pro sees inline upgrade card, no server error).
4. DELETE /api/auth/account (two-step confirm, cascade tests, clears local keys).
5. Practice quiz (GET /api/mcqs) + result screen with "save mistakes to Notes" + practice_attempts table (additive) + Progress screen. Reachable from Subjects home row, Notes tab segment, Explore MCQs tab.
6. Equation / exam-tip callouts (:::equation / :::examtip markers, fallback to plain markdown) and localized follow-up chips.
7. Admin: Pro-expiry control, Q&A moderation tab (admin-session wrappers under /api/admin/qa/*), Maintenance tab (confirm dialogs, SIMULATION ON badge).
8. Hardening: admin-protect /api/debug/sources and /api/v1/metrics in production; require session or guest quota + AI limiter on /api/notes/generate-questions and /compile; general limiter on Explore routes; admin token out of long-lived localStorage.
9. Complete API response-shape tests (chat/message, personas, usage, auth/me, auth/google, notes).
10. Add Playwright as devDependency only + `npm run qa:screens` (320/375/390/430/768/1024/1280, light + dark, fail on horizontal page scroll).
11. Update docs/UI_REVIEW.md with verified / partial / not done per item; open a draft PR; report what is unverified.

## Owner inputs still needed
Real catalog data (data/catalog.seed.json), staging env vars + Firebase staging project, Terms/Privacy text, Pro plan details, correct Android package id, test WhatsApp number.
