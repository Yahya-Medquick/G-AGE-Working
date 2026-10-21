# MIGRATION.md
Status: Phase 5 done

## 1. FILE MAP

- **App root and mobile detection** — `src/App.tsx`, default export `App()`. No props. Uses `useTheme`, `useNotes`, `useUser`, `useChatSessions`, `useSwipeDrawers`, `useQueryLimits`, and `usePersonas`; owns active session/persona, language, panel/modal, and chat request state. A dedicated `matchMedia('(max-width: 768px)')` switch selects the mobile shell; the desktop layout remains the wider-screen path. `handleNewChat` and `handleSendMessage` are defined here.
- **Chat sidebar** — `src/components/chat/ChatSidebar.tsx`, export `ChatSidebar`. Props: `isOpen`, `onToggle`, `sessions`, `globalPersonas`, `pkPersonas`, `activeSessionId`, `onSelectSession`, `onNewChat`, `onRenameSession`, `onDeleteSession`, `onPinSession`, `onOpenNotes`, `notesCount`, `onOpenAdmin`, `onOpenApiDocs`, `onOpenProfile`, `onOpenLogin`, `onOpenPaywall`, optional `onOpenDownload`, `queryUsage`, `theme`, `toggleTheme`. Uses `useUser()` for user/login/logout/tour replay; local state `searchQuery`, `editingSessionId`, `editTitle`; derives filtered and grouped history. Renders history search, new chat, query counter/upgrade action, Notes/Tour/Admin/Theme/API actions, optional APK download action, and user/login card.
- **Chat stage** — `src/components/chat/ChatStage.tsx`, export `ChatStage`. Receives `session`, `activePersona`, `variant`, global/Pakistan persona maps, `onSendMessage`, `isLoading`, `language`, `onLanguageChange`, `onSaveToNotes`, `onOpenPaywall`, `queryUsage`, optional panel toggles, persona/topic selection, edit/regenerate, pending/streaming state, session metadata updater, and knowledge-graph opener. Owns header, session mode and language selectors, Pro/query badge, messages, and composer. Composer state includes `inputText`, `attachedImages`, privacy, image crop/processing; attachment/camera/send controls use the existing image flow and `onSendMessage`. Renders `SpecificationsAccordion` with session specs and update callback; Explore More state/data; and Visualize controls/modal state via the existing visual-card service. Preserve these controls when changing mobile presentation.
- **Expert persona panel** — `src/components/chat/PersonaPanel.tsx`, export `PersonaPanel`. Props: `isOpen`, `onToggle`, `selectedPersonaId`, `onSelectPersona`, `variant`, `onToggleVariant`, optional `onOpenPwaShortcut`, `onSelectPrompt`, `onSelectTopic`, `onOpenPaywall`, `initialGroup`, `onGroupConsumed`, `subjectPromptActive`, `onSkipSubjectPrompt`. Uses `usePersonas()` and `useUser()`; local state includes search query, panel view, active group, recently used slugs, animation, and selected slug. Renders Pakistani/Global tabs, search, suggested inquiries, and subject groups. Groups derive from persona `group_name`, falling back to `badge` and then `General`.
- **Notes** — `src/components/NotesSidePanel.tsx`, export `NotesSidePanel`. Props: `isOpen`, `onClose`, optional `persona`. Uses `useNotes()` for notes/loading/errors and delete/compile/export functions; local state tracks subject filter, selected notes, compile modal, export modal, and request errors/loading. This is the existing full notes workflow.
- **Admin modal** — `src/components/AdminDashboardModal.tsx`, export `AdminDashboardModal`. Props: `isOpen`, `onClose`. Internal state covers admin tabs, loading/data, users, personas, keys, auth/unlock, and edits.
- **Developer API modal** — `src/components/DeveloperApiModal.tsx`, export `DeveloperApiModal`. Props: `isOpen`, `onClose`; handles Escape to close.
- **Onboarding Tour** — `src/components/ProductTour.tsx`, export `ProductTour`. No props. Uses `useUser()` for `hasSeenOnboarding`, `isLoadingAuth`, `completeOnboarding`, `isTourOpen`, `setIsTourOpen`, and `tourTriggerCount`; sidebar starts manual replay through `replayTour()`.
- **Theme toggle** — no standalone toggle component. `useTheme()` in `src/hooks/useTheme.ts` owns `theme`/`toggleTheme`, persists `atlas_theme`, and toggles `.dark` on `<html>`. `App` passes the state/actions to `ChatSidebar`, which renders the control.
- **Auth and user info** — `src/components/AuthModal.tsx`, export `AuthModal`, takes `isOpen`, `onClose`, optional `onSuccessLogin`; uses `useUser()` login/register/Google/guest actions and local form state. `src/components/UserProfileModal.tsx`, export `UserProfileModal`, takes `isOpen`, `onClose`, `recentSearches`, `onSelectSearch`, `onClearHistory`, optional `onOpenDownload`; uses `useUser()` for `user`, `profile`, preference updates, and tour replay. User state/default guest name originate in `src/context/UserContext.tsx`.

## 2. DATA SOURCES

- **Personas/mentors:** `usePersonas()` in `src/hooks/usePersonas.ts` returns `rawPersonas`, `globalExperts`, and `pkExperts`; it loads through `fetchPersonas()` in `src/stores/personaStore.ts` and falls back to `EXPERTS`/`EXPERTS_PK` in `src/data/experts.ts`. Persona fields include `name`, `role`, `initials`, `badge`, `specialties`, `domains`, `avatar_color`, `variant`, and optional `group_name`.
- **Subject groups:** `PersonaPanel` derives groups from the active persona list's `group_name`, falling back to `badge`/`General`. Suggested inquiries are dynamically derived in the same panel from active persona data. `src/data/personaGroups.ts` contains group query/helper functions, but the panel's displayed groups are locally derived as described above.
- **Notes:** `useNotes()` in `src/hooks/useNotes.ts` returns `notes`, loading/error state, and note actions. Guests use `localStorage` key `bifrost_notes`; signed-in notes use the existing `/api/notes` routes.
- **Chat sessions/history:** `useChatSessions()` in `src/hooks/useChatSessions.ts` owns sessions and active session state, persisting browser-local data under `bifrost_chat_sessions_v2` and the associated active-session key. It exposes `createSession`, `selectSession`, and session update actions.
- **User name:** `useUser()` from `src/context/UserContext.tsx` provides `user` and `profile`; the default profile name is `Guest Explorer`, while authenticated identity is populated by auth. Do not hard-code the screenshot name.
- **Send/new chat:** `App.handleSendMessage(content, modeOverride?, images?, savePublic?)` sends through the existing chat flow and creates a session with `createSession()` if there is no active session. `App.handleNewChat()` calls `createSession()` and selects the new chat. Keep these as the dashboard ask/new-chat entry points.

## 3. THEME

- `useTheme()` stores the choice as `atlas_theme`, applies/removes the root `.dark` class, and exposes `theme` and `toggleTheme`.
- CSS tokens in `src/index.css`: `--color-background`, `--color-surface`, `--color-border`, `--color-text`, `--color-text-muted`, `--color-primary`, `--color-primary-text`, `--color-accent`, `--color-accent-text`, `--color-tint-green`, `--color-tint-gold`, and `--color-link`.
- Semantic aliases: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-card`, `--border-color`, `--text-primary`, `--text-secondary`, `--text-tertiary`, `--text-accent`, and `--text-on-accent`.
- Use existing tokens for both light and dark modes. Typography is Baloo 2 (headings), Nunito Sans (body), and Noto Nastaliq Urdu (Urdu/RTL).

## 4. TARGET SCREEN INVENTORY

From `docs/target-mobile.png`, top to bottom:

1. Greeting block: “Assalam-o-Alaikum”, personalized name, learning prompt, and notification bell/status dot.
2. Search/ask bar: study-question prompt, language hint, leading sparkle action, and send action.
3. Specialist Mentors carousel: section title, View all link, horizontally scrolling mentor cards with portraits, status dots, names, specialty labels, and ratings.
4. Quick Subjects chips: section title, See all subjects link, and subject chips with icons.
5. Recent Notes list: section title, View all link, note rows with document icons, titles, edit time, subject/page metadata, preview lines, and overflow action.
6. Persistent bottom tab bar: Home, Mentors, Notes, Profile; Home is selected in the reference.

## RELOCATION TABLE

| FILE MAP feature (one row each) | Mobile destination |
| --- | --- |
| - [x] App root and mobile detection (`App`) | Mobile shell: Home, Mentors, Notes, Profile, and Chat screen state. Home ask opens the Chat screen and starts a new chat using the existing send flow; Chat back returns Home. Keep the bottom bar visible on the four tabs and hide it on Chat. Add mobile-specific detection at `<=768px`; preserve the existing desktop layout above 768px. |
| - [x] Chat sidebar (`ChatSidebar`) | Profile tab: user card, query counter, Pro/upgrade, Notes/Tour/Admin/Developer API/theme controls, APK download, sign out, and full chat history with search. Home Recent Chats is a compact list sourced from the same existing sessions; ChatSidebar's separate sidebar presentation is not shown on mobile. |
| - [x] Chat stage (`ChatStage`) | Chat screen, opened from any mentor tap or Home ask bar: existing header, mode selector, language selector, Pro badge, messages, Specifications & Filters, Explore More, Visualize, and composer with attach/camera/send. Back arrow returns to Home; hide bottom tab bar while this screen is active. |
| - [x] Expert persona panel (`PersonaPanel`) | Mentors tab: full existing panel with Pakistani/Global tabs, search, suggested inquiries, and subject groups. Home Specialist Mentors carousel is a compact preview; View all opens this same full panel. |
| - [x] Notes (`NotesSidePanel`) | Notes tab: existing Notes component and its full workflows; retain its existing data and actions. |
| - [x] Admin modal (`AdminDashboardModal`) | Open from Profile tab's Admin action; retain the existing modal. |
| - [x] Developer API modal (`DeveloperApiModal`) | Open from Profile tab's Developer API action; retain the existing modal. |
| - [x] Onboarding Tour (`ProductTour`) | Tour action in Profile tab; retain existing onboarding state and replay handler. |
| - [x] Theme toggle (`useTheme`) | Theme toggle in Profile tab; retain `useTheme()` persistence and document `.dark` behavior. |
| - [x] Auth and user info (`AuthModal`, `UserProfileModal`, `UserContext`) | Profile tab: user card and account/profile actions, including sign in/register/guest through the existing AuthModal; retain account data from `useUser()`. Also contains Profile tab's language selector, APK download, and sign-out action by reusing existing handlers/components. |

## GAPS

- Mentor portrait photos are not in the documented persona fields: use initials with the existing `avatar_color` as the avatar; do not invent portraits.
- Mentor ratings are not in the documented persona fields: hide rating UI rather than fabricate scores.
- The screenshot bell/notification dot has no documented notification source or behavior: hide the bell.
- Mentor online/status dots have no documented status source: hide status dots.
- There is no dedicated quick-subject catalog or icon mapping: derive chips from existing persona specialties/domains or subject groups; use existing iconography and omit unsupported subjects.
- Greeting name comes from existing `useUser()` identity/profile; for signed-out users use its guest profile name, not the screenshot's sample name.

## FILES TO CREATE/EDIT

- Edit `src/App.tsx` for `<=768px` detection, mobile screen routing, and preservation of the desktop layout above 768px.
- Create `src/components/MobileShell.tsx` for Home/Mentors/Notes/Profile/Chat screen state and the tab bar; keep screens as stubs around existing mapped components.
- Create `src/components/MobileShell.css` for responsive shell layout, safe-area padding, and styling with existing theme tokens.
- Keep the existing screen components and their feature logic unchanged; do not build out the detailed Home or Profile experiences in this shell phase.
- Reuse `src/components/chat/ChatStage.tsx`, `src/components/chat/PersonaPanel.tsx`, `src/components/NotesSidePanel.tsx`, and existing modal/tour components; avoid replacing their feature logic.

## 5. PHASE 1

- [x] Phase 1 done: reference and README reviewed; component map, data sources, theme mechanism/tokens, and target screen inventory documented.

## 6. PHASE 2

- [x] Phase 2 done: mobile destinations, complete feature relocation, data gaps/fallbacks, and implementation file list documented.

## 7. PHASE 3

- [x] Phase 3 done: created `src/components/MobileShell.tsx` with mobile screen state and bottom navigation, plus `src/components/MobileShell.css` for token-based styling and safe-area padding. `src/App.tsx` switches to the shell at `<=768px`; Home is a minimal stub, and Mentors, Notes, Profile, and Chat reuse their mapped components. The desktop render branch remains unchanged.

## 8. PHASE 4

- [x] Phase 4 done: implemented all Home sections with existing hook data and handlers; completed the mobile Mentors, Notes, Profile, and Chat destinations; added scroll-snap mentor cards, 20px card radii, mobile language selection and RTL direction; applied documented portrait/rating/status/notification fallbacks; preserved desktop rendering and marked every relocation row complete.

## 9. PHASE 5

- [x] Phase 5 done: confirmed all relocation rows are checked and exposed from the mobile UI; verified the desktop rendering branch remains unchanged apart from shared root wiring; removed hardcoded colors from the new mobile shell styles; bumped the service worker cache to `gage-ai-v2`; lint, tests, and build pass.
