# UI audit

## Current architecture

The frontend is a React 19/Vite SPA with Tailwind CSS v4 utilities, one global
stylesheet (`src/index.css`), Lucide icons, and a class-based `.dark` theme
persisted as `atlas_theme`. `src/main.tsx` mounts `ErrorBoundary`, `UserProvider`
and `App`. The active product is the three-column chat shell in `App.tsx`:
`ChatSidebar`, `ChatStage` and `PersonaPanel`. Public Q&A and download surfaces
are mounted separately. Chat sessions and guest notes are browser-local.

The active UI already has responsive panel defaults, lazy-loaded secondary
modals, theme-aware utilities, image cropping, Markdown/KaTeX rendering, and
working chat/persona/notes flows. The existing component library is mostly
feature-specific markup rather than shared primitives. `FEATURE_MAP.md` is the
source of truth for the current routes, features and data relationships.

## Current friction

- The mounted product opens directly into a feature-dense chat workspace, so
  first-time students must interpret several controls before knowing where to
  start.
- The sidebar and chat header expose secondary tools, quota, theme, account,
  language, variants and filters simultaneously; chat replies and Explore More
  compete visually with the answer.
- Persona variants are separate browsing modes. This hides teachers that
  should be discoverable together and leaves older messages dependent on a
  current variant-specific lookup.
- Existing styling mixes semantic CSS variables with many ad-hoc Tailwind
  colors, dimensions, radii and shadows. Dark styling is not consistently
  derived from one palette, and the stylesheet contains several overlapping
  global treatments.
- Before the redesign, the shell had no student class/catalog home or first-run
  guest choice; the redesign now adds those entry points and mobile bottom tabs.
- The mounted chat contains multiple always-visible controls and large
  Explore More surfaces; on narrow screens the hierarchy is less thumb-first
  than the target.
- Important correctness friction identified in the feature inventory includes
  divergent local quota fallback values, a shadowed recent-persona route,
  missing new-device verification UI, and historical assistant turns without
  stable persona labels.

## Redesign direction

- Keep the existing working chat API, quota enforcement, local sessions, notes,
  image crop flow, persona registry, and Explore More integrations.
- Do not mount or revive legacy category/search/history components or cards.
- Make Subjects the home and keep the first action obvious; put account,
  installation, advanced tools and low-frequency actions behind Me/profile.
- Merge persona discovery across variants and label each teacher in place.
- Simplify chat chrome: centered readable messages, flat assistant answers,
  one filled user bubble, collapsed Explore and filters, and a compact composer.
- Use a single neutral/accent palette with only the defined semantic subject
  tints; preserve both light and night modes and improve focus/touch behavior.
- Add staging protections before the product work so preview builds cannot
  reach production data, become indexable, or run unnecessary background jobs.

## Implemented since the audit

The mounted app now has a class-aware Subjects home, first-run guest/sign-in
choice, mobile Subjects/Chats/Notes/Me tabs, a flat-answer chat layout, quiet
Explore disclosure, Tune-based response settings, and accessible touch-sized
reply actions. New Chat returns to Subjects rather than creating a generic
conversation. These changes retain the existing chat, note, image, quota, and
Explore integrations.

## Scope exclusions

No legacy UI is to be remounted. No payment, email/OTP, analytics vendor, legal
copy, real catalog titles/boards, or Android package-id decision is inferred.
Those owner-controlled items remain explicit `TODO(owner)` decisions.
