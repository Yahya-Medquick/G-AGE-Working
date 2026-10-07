# UI self-review

## Scope and result

This is a code- and test-based review of the redesign work in the current
worktree. No interactive browser session, Railway PR environment, staging
credentials, or staging database was available; those checks are not claimed
as verified.

## Initial runtime verification

A local production build was served with `APP_ENV=staging`, empty database
URLs, and disposable local-only credentials. No production URL, credential, or
database was used.

| Surface | Result | Evidence and remaining verification |
|---|---|---|
| `/terms`, `/privacy`, `/download` | Partial | Each route returned the SPA shell with HTTP 200. Modal content, browser back/forward behavior, and install prompts were not exercised in a browser. Approved Terms/Privacy text is still an owner input. |
| Export my data | Not done | The Me screen still renders this action disabled as “Coming soon”; the separate Notes export does not export account data. |
| Install app | Partial | APK metadata returned HTTP 200 and the APK path returned HTTP 200 with the expected attachment MIME type and `X-Robots-Tag: noindex, nofollow`. PWA prompt and on-device install remain untested. |
| Share answer | Partial | Source inspection confirms a separate confirmation tap before posting to `/api/public-qa/share`, and the action is hidden for image answers. A persisted public-link round trip was not attempted without a staging database. |
| Mobile tab bar | Partial | Source inspection confirms four mobile tabs and keyboard-aware hiding; viewport layout and tab interaction remain untested in a browser. |

The local health endpoint reported `appEnv: staging`. The staging smoke test
reached its catalog check but could not complete because this local run has no
database; the check now supplies the required supported `classLevel=1`
parameter rather than failing with an invalid-request 400.

## Phase 2 verification pass

| # | Acceptance item | Result | Evidence and remaining verification |
|---|---|---|---|
| 1 | Class step | Partial | `shouldPromptForClass` and class-level validation are unit-tested; user/profile/home class selectors and the additive `PATCH /api/user/class-level` handler are wired. “Later” now persists per account. Auth-provider payloads and the prompt lifecycle still need browser/staging observation. |
| 2 | First-run overlay | Partial | Overlay condition excludes signed-in users and guests; it traps focus and blocks Escape/backdrop dismissal. Google, username and guest flows are present. `/terms` and `/privacy` links are still missing pending the trust-pages step; live auth and mobile dismissal behavior were not exercised. |
| 3 | New-device login | Partial | Unsupported device verification displays an explanation and configured WhatsApp support link. Completion and support configuration require staging credentials and the owner's test support number. |
| 4 | Variant removal and identity | Partial | No variant selector was found in the mounted home, PersonaPanel or chat header; shared `VariantBadge` is used for surfaced teachers and recent chats. Existing persona identity/group tests pass. Old-browser localStorage migration and both-variant suggested-group behavior were not browser-tested. |
| 5 | Public sharing | Partial | Chat sends default to `savePublic: false`; a reply action first shows the public-visibility notice, then calls `/api/public-qa/share`. Image-associated answers are hidden/rejected, and the public link uses `/q/:slug`. No staging database was available to test persisted/indexed public pages. |
| 6 | Camera and attachments | Partial | Both inputs use `image/*`; selection filters image MIME types and caps each message at four; crop remains in the flow. Non-Pro users receive an inline Pro notice without opening the picker; composer, edit, and regenerate paths now block image-bearing sessions from reaching the server. The API independently returns an explicit Pro-paywall response. Device camera, crop, and entitlement behavior need browser verification. |
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
| `npm run build` | Pass; no Nastaleeq asset-resolution or mixed `CompiledNotesModal` import warning. Vite still reports the large main-chunk warning. |
| Main JS gzip baseline | 306.73 kB at pre-redesign commit `3fbb4ca3b3826848505ffa2d6d377b9cd62e02d1`. |
| Current main JS gzip | 328.67 kB; +7.15% from baseline, within the baseline +20% budget of 368.08 kB. |
| Current main JS raw | 1,119.46 kB; still above Vite's 500 kB warning threshold, which was also exceeded by the pre-redesign baseline. |
| Heavy surfaces | Admin, Knowledge Graph, Compare, Timeline, Developer API, Product Tour, and Compiled Notes use lazy imports. Markdown rendering is also behind `React.lazy`; their separate chunks are present in the build output. |

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
