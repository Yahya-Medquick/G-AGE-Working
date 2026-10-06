# UI self-review

## Scope and result

This is a code- and test-based review of the redesign work in the current
worktree. No interactive browser session, Railway PR environment, staging
credentials, or staging database was available; those checks are not claimed
as verified.

## Phase 2 verification pass

| # | Acceptance item | Result | Evidence and remaining verification |
|---|---|---|---|
| 1 | Class step | Partial | `shouldPromptForClass` and class-level validation are unit-tested; user/profile/home class selectors and the additive `PATCH /api/user/class-level` handler are wired. “Later” now persists per account. Auth-provider payloads and the prompt lifecycle still need browser/staging observation. |
| 2 | First-run overlay | Partial | Overlay condition excludes signed-in users and guests; it traps focus and blocks Escape/backdrop dismissal. Google, username and guest flows are present. `/terms` and `/privacy` links are still missing pending the trust-pages step; live auth and mobile dismissal behavior were not exercised. |
| 3 | New-device login | Partial | Unsupported device verification displays an explanation and configured WhatsApp support link. Completion and support configuration require staging credentials and the owner's test support number. |
| 4 | Variant removal and identity | Partial | No variant selector was found in the mounted home, PersonaPanel or chat header; shared `VariantBadge` is used for surfaced teachers and recent chats. Existing persona identity/group tests pass. Old-browser localStorage migration and both-variant suggested-group behavior were not browser-tested. |
| 5 | Public sharing | Partial | Chat sends default to `savePublic: false`; a reply action first shows the public-visibility notice, then calls `/api/public-qa/share`. Image-associated answers are hidden/rejected, and the public link uses `/q/:slug`. No staging database was available to test persisted/indexed public pages. |
| 6 | Camera and attachments | Partial | Both inputs use `image/*`; selection filters image MIME types and caps each message at four; crop remains in the flow. Non-Pro users receive an inline Pro notice instead of starting an upload. Device camera, crop, and entitlement behavior need browser/API verification. |
| 7 | Quota | Verified (code/tests) | Client quota constants were removed. `readServerUsage` requires count/limit/remaining from `/api/usage`; tests cover server-derived values and malformed responses. A repository search found no client `25`/`200` quota constants in mounted code. |
| 8 | Empty catalog home | Partial | Catalog data remains empty by design; the home renders catalog empty/error states and teacher rows independently of catalog results. A selected class appears in the home header. Empty-catalog behavior has not been exercised in a browser against an API response. |
| 9 | i18n | Partial | New redesign copy is routed through `uiCopy` in English, Roman Urdu and Urdu. Some legacy copy in modified, still-mounted chat/persona surfaces remains hard-coded; no claim of complete localization is made. |
| 10 | Night mode | Partial | `npm run check:tokens` passes the shared semantic-token contrast checks. Every new/modified surface still needs visual review in night mode. |
| 11 | Owner-facing catalog administration | Partial | Admin-session-protected list, create, edit, delete, status and reorder endpoints plus the Catalog tab are implemented. Validation and unauthorized-session tests pass; an available row without an active teacher is returned unavailable and shown as coming soon. No staging database CRUD run was possible. |
| 12 | Catalog seed workflow | Partial | Only a clearly fake `_example` JSON file is committed; the real seed file is ignored. The script requires staging/preview plus a production-host guard and stable IDs with `ON CONFLICT DO NOTHING`; production refusal was exercised. No import was run against a database. |
| 13 | Desktop sidebar and profile navigation | Partial | The sidebar now groups recent chats, has per-chat pin/rename/delete actions, Subjects/Notes/Practice links, collapsible Tools, and a profile menu with class/profile/settings/theme/support/developer/admin actions. Practice, Progress, Privacy and Terms remain explicitly marked “Coming soon”; Plan & usage still opens the existing paywall rather than a dedicated usage screen. Browser, keyboard and theme behavior remain unobserved. |
| 14 | Continue with the same teacher | Partial | The chat header menu offers “New chat with this teacher” and opens a fresh session with the current teacher and variant. Ctrl+K now opens Subjects and requests focus in the localized subject/teacher search; search filters catalog entries and teachers. The keyboard/focus behavior still needs browser observation. |
| 15 | Mobile Me tab | Partial | A dedicated mobile Me screen now groups account, study, settings, app, help, developer, account-safety and admin actions. Existing profile/class/settings/paywall/theme/install/tour/support/API/admin actions are wired; unfinished Practice, Progress, Privacy, Terms, export and deletion are visibly marked “Coming soon”. No viewport or device observation has been performed. |
| 16 | Settings screen | Partial | Response and app language can be controlled independently, with app language following response language by default; preferred Learning/Research mode persists through the existing user API; class uses the existing validated update; default chat filters share `gage_specs_prefs` with Tune and can be reset; theme supports system/light/dark. Type/build/tests pass, but browser persistence, account sync and visual behavior remain unobserved. |
| 17 | Plan & usage | Partial | `/api/usage` additively returns `tier`, `used`, `resetsAt` and `proExpiresAt` while preserving existing quota fields. The screen maps numbers directly from the response, shows Pro expiry when supplied, handles retry/error/empty states, lists only the server-enforced image gate and reported allowance, and uses the existing WhatsApp helper for context with a staging prefix outside production. Mapper tests use non-default server values; no live staging response was available. |
| 18 | Persona chat header | Partial | The header is reduced to back/sidebar, teacher identity with `VariantBadge` and role, response-language chip, teacher selector and an options menu for same-teacher chat, public questions, support report and Plan & usage. Mobile back returns to Subjects; mode selection is retained in the composer. Browser and keyboard behavior remain unobserved. |
| 19 | Notes | Partial | The Notes panel now has subject chips and text search, existing AI compile and question-generation flows, `.md` download and print, and an explicit local-to-account migration with per-note progress and retry-safe import markers. Saved chat notes use the active teacher's subject tag. Browser interaction and authenticated migration/API behavior still need staging verification. |

## Build and test evidence

| Check | Result |
|---|---|
| `npm run lint` | Pass; TypeScript and design-token checks passed. |
| `npm test` | Pass; 37 tests in 12 files. |
| `npm run build` | Pass; the missing local Nastaleeq reference and mixed `CompiledNotesModal` import warning are fixed. Vite still reports the large main-chunk warning. |
| Main JS gzip baseline | 306.73 kB at pre-redesign commit `3fbb4ca3b3826848505ffa2d6d377b9cd62e02d1`. |
| Current main JS gzip | 327.11 kB; +6.64% from baseline, within the baseline +20% budget. |
| Current main JS raw | 1,120.29 kB; still above Vite's 500 kB warning threshold. |
| Heavy surfaces | Admin, Knowledge Graph, Compare, Timeline, Developer API and Product Tour use lazy imports; Markdown rendering is also behind `React.lazy`. Their separate chunks are present in the build output. |

The baseline was built in a temporary detached worktree from the commit before
the redesign branch's first commit. The temporary worktree was removed after
measurement. No production URL, credentials, database, or API was used.

## Viewport and release checks

| Area | Result | Notes |
|---|---|---|
| 320, 375, 390, 430 px | Not visually verified | Requires browser viewport testing, including keyboard-open state. |
| 768 and 1024 px | Not visually verified | Responsive layout compiles; panel transitions need observation. |
| 1280 px and wider | Not visually verified | Three-column behavior needs observation. |
| Light and night themes | Partial | Token checks pass; visual review outstanding. |
| Urdu RTL and mixed Latin text | Not visually verified | Direction-aware code exists; inspect text, controls and tab order in a browser. |
| Keyboard and screen reader | Partial | The first-run dialog and new controls include focus/ARIA behavior; no full audit run. |
| Staging smoke and database startup | Not run | Blocked on owner-configured Railway PR environment and staging-only variables/database. |
| Playwright screenshots | Not run | `@playwright/test` and browser installation are not available; no screenshot claims. |

## Remaining owner inputs

- **TODO(owner):** verified catalog rows and `data/catalog.seed.json` values.
- **TODO(owner):** staging environment variables, staging Firebase project, and Railway PR environment.
- **TODO(owner):** approved Terms and Privacy copy.
- **TODO(owner):** Pro plan details, Android package ID, and staging WhatsApp support number.
