# G-AGE AI

G-AGE AI is a free AI tutor and study assistant for Pakistani students. It provides chat-based learning, exam practice, research discovery, expert personas, notes, and Urdu/English response options.

## Features

- Three chat modes: **Concept** for explanations, **Exam** for practice and problems, and **Research** for papers and citations.
- Pakistani and Global expert-persona variants.
- A per-chat **Specifications & Filters** panel. Concept mode selects a learning level; Exam mode accepts board/university, subject, question nature, and class/grade; Research mode filters paper recency and citations and toggles repositories and datasets.
- **Explore More** below assistant answers. Research mode has Papers, Repos, and Research News. Concept and Exam modes have Videos, News, and MCQs.
- Save notes, export notes as PDF, and compile selected notes.
- Public Q&A pages at `/q/...` and persona question pages at `/persona/.../questions`.
- Sidebar tools include Notes, an onboarding tour, the Admin modal, the Developer API modal/reference, and light/dark theme controls. The app also includes a TWA download page.
- A web app manifest and service worker are registered by the page.

### Chat modes, preferences, and filters

The chat mode belongs to each chat session and is saved with that session. The chat-mode selector offers Concept, Exam, and Research. A separate global Research/Learning preference is stored for the user (or in browser storage when signed out); it is not the per-chat mode.

Each chat stores specifications in separate `concept`, `exam`, and `research` objects. The Specifications & Filters panel also saves a global browser preference, which supplies defaults; the active chat's saved values take precedence. Requests to `/api/chat/message` include the selected mode and the session's specifications as `specs`.

### Personas and mobile layout

The persona panel switches between Pakistani and Global variants. The PostgreSQL `expert_personas` table stores persona identity and presentation fields (`slug`, `name`, `initials`, `role`, `affiliation`, `badge`, `avatar_color`), expertise and prompt fields (`specialties`, `domains`, `description`, `personality`, `opener_template`, `system_prompt`), and status/order fields (`is_active`, `is_default`, `display_order`, `variant`, `group_name`, `created_at`, `updated_at`). `GET /api/v1/personas/recent` returns up to three recently used personas for the selected variant when the user is signed in. It is registered before `/api/v1/personas/:slug` so the literal `recent` path is handled as the recent-personas endpoint rather than as a slug.

On narrow screens the chat header wraps, with **Open chats** and **Open expert panel** buttons when their panels are closed. The sidebar and persona panel open as slide-in drawers with a backdrop. The mobile sidebar includes the API Reference action. On screens up to 768px wide, the open Specifications & Filters content has its own vertical scroll area with a viewport-based maximum height.

Visible filter controls:

| Mode | Controls |
|---|---|
| Concept | Target depth: beginner, intermediate, advanced, or expert |
| Exam | Board/university; subject; question nature (long, short, or MCQ); class/grade |
| Research | Paper recency (2 years, last 5 years, or all-time); minimum citations (any, 50+, or 500+); include repositories; include datasets |

### Explore More endpoints

| Tab | Request |
|---|---|
| Papers | `GET /api/explore/papers` |
| Repos | `GET /api/explore/repos` |
| Research News | `GET /api/explore/research-news` |
| Videos | `GET /api/category/videos` |
| News | `GET /api/category/news` |
| MCQs | `GET /api/mcqs` |

### Query limits

| Account/device type | Daily or lifetime allowance |
|---|---|
| Signed-in free account | 25 queries per UTC day per account, subject to the shared device cap |
| Device cap | 200 queries per UTC day across accounts on that device |
| Guest | 5 lifetime queries per device |
| Paid / Pro / unlimited tier | No daily query cap |

Daily counters use UTC dates and reset at midnight UTC (05:00 Pakistan Standard Time). In-memory per-minute request limits are also applied: general API requests 150/minute; auth, AI ask, learning, and counseling/chat limiters 25/minute; admin requests 30/minute. These limiters are layered on applicable routes. Paid tiers receive a 10x burst allowance.

## Stack and commands

The app uses React 19, TypeScript, Vite, and an Express server. PostgreSQL is used when `DATABASE_URL` or `POSTGRES_URL` is configured; the server also has in-memory fallbacks for several data stores. The package requires Node.js 20 or newer.

```bash
npm run dev       # Run the Express server with tsx
npm run lint      # TypeScript check (tsc --noEmit)
npm test          # Run Vitest
npm run build     # Build the Vite app and bundled Express server
npm start         # Run dist/server.cjs after building
```

### Database tables

When PostgreSQL is configured, the server initializes these tables: `users`, `phone_otp_logs`, `user_tab_usage`, `user_search_history`, `search_topics`, `category_cache`, `knowledge_graph`, `api_keys`, `api_key_usage`, `topic_pages`, `searched_pages`, `personas`, `counseling_sessions`, `notes`, `persona_qa_log`, `public_qa_pages`, `expert_personas`, `user_persona_usage`, `device_limits`, and `guest_device_limits`.

## Environment variable names

The following server-side names are read by the code; configuration requirements vary by feature. No values are included here.

`ADMIN_TOKEN`, `APP_URL`, `DATABASE_URL`, `EXCHANGE_RATE_API_KEY`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_PROJECT_ID`, `GEMINI_API_KEY`, `GEMINI_QA_API_KEY`, `GITHUB_TOKEN`, `GOOGLE_BOOKS_API_KEY`, `INDEXNOW_KEY`, `JWT_SECRET`, `NEWSDATA_API_KEY`, `NODE_ENV`, `OPENROUTER_API_KEY`, `PORT`, `POSTGRES_URL`, `PUBLIC_BASE_URL`, `RAILWAY_GIT_COMMIT_SHA`, `SESSION_SECRET`, `SIMULATE_PRIMARY_KEY_FAILURE`, `TAVILY_API_KEY`, `YOUTUBE_API_KEY`.

The frontend also reads `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, and `VITE_WHATSAPP_SUPPORT_NUMBER`.

## Project structure

- `src/App.tsx` — selects public pages and mounts the main chat interface and modals.
- `src/components/chat/` — chat sidebar, chat stage, expert-persona panel, and specifications.
- `src/components/` and `src/components/cards/` — other pages, modals, notes, and answer cards.
- `src/hooks/`, `src/context/`, `src/stores/` — client state and data hooks.
- `src/utils/`, `src/data/`, `src/types/` — shared utilities, persona data, and types.
- `server.ts` — Express routes, server-side limits, database schema, and static-file serving.
- `tests/` — Vitest tests, including `tests/queryLimitPolicy.test.ts`.
- `public/` — static assets, manifest, and service worker.

`Header.tsx`, `SearchBar.tsx`, and `CategoryViewer.tsx` are legacy components not imported by the mounted app. `HistoryViewer.tsx` is only referenced by the legacy `CategoryViewer`; the current chat-session history is shown in `ChatSidebar`. `MCQCard` remains used by Explore More.

## Deployment

Build with `npm run build`, then run the Node server with `npm start`. The build creates the Vite frontend and `dist/server.cjs`; the server serves the built frontend. Configure environment variables in the deployment environment. This repository does not contain a Dockerfile.

## Design tokens

| Token | Light | Dark |
|---|---|---|
| Background | `#F3F6F1` | `#0B1612` |
| Surface | `#FFFFFF` | `#12231C` |
| Border | `#D5E0D8` | `#27403A` |
| Text | `#10231C` | `#E8F2EC` |
| Muted text | `#4F6359` | `#9DB5A8` |
| Primary | `#0A5C45` | `#0F8056` |
| Accent | `#F4B400` | `#F4B400` |

Fonts are Baloo 2 for headings, Nunito Sans for body text, and Noto Nastaliq Urdu with Jameel Noori Nastaleeq as a fallback for Urdu. Card and chat-bubble radii are 20px; button and input radii are 14px. The design sets a 44px minimum height for its targeted interactive controls; chips and toggles are exceptions.

## Not implemented

- Voice or microphone chat input.
- Payment-provider checkout. The Pro/paywall action opens WhatsApp; it does not process a payment.
- Server-side chat-session history. Chat sessions and messages are stored in browser `localStorage`.
- The legacy multi-category `CategoryViewer` is not mounted in the current app.

## Known caveat

`public/sw.js` uses a fixed `gage-ai-v1` cache name and cache-first behavior for `/assets/` requests. A cached response can therefore be returned for an asset URL after deployment if that URL is reused. Other same-origin GET requests try the network first and use a cache/offline page on failure.

## Recent changes

- Restored the Explore More row and its mode-specific tabs.
- Persisted the selected chat mode per chat session.
- Unified daily query limits: 25 per day for signed-in free accounts, 5 lifetime for guests, and a 200-per-day shared device cap.
- Restyled the brand palette and quota controls.
- Preserved the persona name in chat openers.
- Registered `/api/v1/personas/recent` before the parameterized `/:slug` route.
- Restored mobile sidebar and expert-panel buttons.
- Made the mobile filters panel scroll within its available height.
- Fixed filter selection, text entry, and session persistence after replacing direct mutation of session specifications.
