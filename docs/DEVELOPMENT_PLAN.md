# Tennis Match Tracker -- Development Plan

> **How to get back to this plan:** Open this file in Cursor from the Explorer: `docs/DEVELOPMENT_PLAN.md`. You can also use **Quick Open** (Ctrl+P / Cmd+P) and type `DEVELOPMENT_PLAN`. If you use git, commit this file so it stays with the project everywhere.

---

## Active phase: **4** (Dashboard)

The app is currently shipping **Phase 4** only. Match preparation is **not** exposed in the UI (no **Prepare** nav item, `/prepare` redirects to dashboard).

The **tactical knowledge base** (`src/lib/match-prep/`, `docs/match-prep/`) is implemented as **internal LLM context** for Phase 5 — users do not browse tactic cards or sources in the app. See [docs/match-prep/README.md](match-prep/README.md).

Controlled by `CURRENT_APP_PHASE` in [src/lib/app-phase.ts](../src/lib/app-phase.ts).

---

## Current State (Phase 0 -- complete)

The project at `c:\apps\tennis-match-tracker` already has a solid baseline:

- **Next.js 16** (App Router) + **React 19** + **TypeScript 5.9** (strict)
- **Tailwind CSS 3** + PostCSS + Autoprefixer
- **Vitest** + Testing Library (jsdom) for unit tests
- **ESLint 9** (flat config, Next.js preset) + **Prettier**
- **Zod 4** for runtime validation
- **pnpm** as package manager
- VS Code / Cursor debug & task configs

Key files: [package.json](package.json), [tsconfig.json](tsconfig.json), [src/app/layout.tsx](src/app/layout.tsx), [src/app/page.tsx](src/app/page.tsx).

---

## Stack Additions

| Layer | Choice | Why |
|---|---|---|
| UI components | **shadcn/ui** (+ Radix primitives) | Copy-paste components, Tailwind-native, fully typed, vibecoding-friendly |
| ORM | **Drizzle ORM** + drizzle-kit | Type-safe SQL, lightweight, excellent TS inference, SQL-like syntax |
| Database | **PostgreSQL** on Railway | Managed, one-click provision, matches requirement |
| Auth | **NextAuth v5 (Auth.js)** with Google provider | First-party Next.js integration, Google OAuth only |
| Charts | **Recharts** (or tremor) | React-native, composable, works with Tailwind |
| AI (Phase 5) | **OpenAI API** (or similar LLM) via server action | Match-prep advice using profiles, match history, and the internal tactical knowledge base as prompt context |
| Hosting | **Railway** | Full-stack deploy with GitHub auto-deploys |

---

## Recommended MCPs

Install these in Cursor to accelerate the vibecoding workflow:

- **GitHub MCP** -- create branches, open PRs, review diffs without leaving Cursor
- **Postgres MCP** (`@modelcontextprotocol/server-postgres`) -- query the Railway DB directly from chat to inspect data, debug schemas, seed records
- **Context7 MCP** -- pull up-to-date docs for Next.js, Drizzle, Auth.js, shadcn, etc. inside Cursor context
- **Sequential Thinking MCP** -- help break down complex features into reasoned steps before coding

---

## Git / Deployment Workflow

```mermaid
flowchart LR
  Local["Local dev\n(pnpm dev)"] -->|"git push"| Feature["feature/* branch"]
  Feature -->|"PR via GitHub MCP"| Main["main branch"]
  Main -->|"Railway auto-deploy"| Prod["Railway\nProduction"]
```

- Each phase lives on a `feature/<phase-name>` branch
- PR into `main` after manual testing
- Railway auto-deploys `main` (configured in Phase 1)

---

## Phase 1 -- Shell App + Auth + Railway Deploy

**Goal**: A deployed, authenticated skeleton you can open on your phone.

**Branch**: `feature/phase-1-auth-deploy`

### 1a. UI framework

- Install **shadcn/ui** (CLI init), pick a theme, add components: Button, Card, Input, Sheet (mobile nav), Avatar, DropdownMenu
- Build a responsive app shell in [src/app/layout.tsx](src/app/layout.tsx): sidebar on desktop, bottom nav or hamburger on mobile
- Create placeholder pages: `/dashboard`, `/players`, `/matches` (`/prepare` added in Phase 5)

### 1b. Authentication

- Install `next-auth@beta` (v5) + `@auth/drizzle-adapter`
- Create Google OAuth credentials in Google Cloud Console (callback: `https://<railway-domain>/api/auth/callback/google` + `http://localhost:3000/...` for dev)
- Add auth config at `src/lib/auth.ts`, middleware at `src/middleware.ts` to protect all routes except `/` landing page
- Environment variables: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- Login page with Google button, user avatar + sign-out in the nav

### 1c. Railway deploy

- Create Railway account, install Railway CLI
- Create new project with a **PostgreSQL** plugin (one-click)
- Connect the GitHub repo; set `main` branch as auto-deploy trigger
- Add env vars (`DATABASE_URL`, `AUTH_*`) in Railway dashboard
- Verify the app loads on the Railway-provided domain over HTTPS

### 1d. Database foundation

- Install `drizzle-orm`, `drizzle-kit`, `postgres` (driver)
- Create `src/db/index.ts` (connection), `src/db/schema/` folder
- Initial schema: `users`, `accounts`, `sessions` tables (required by Auth.js Drizzle adapter)
- Set up `drizzle.config.ts`, add `pnpm db:push` and `pnpm db:studio` scripts
- Run first migration against Railway Postgres

---

## Phase 2 -- Players / Opponents

**Goal**: Full CRUD for tennis players you might face.

**Branch**: `feature/phase-2-players`

### Schema

```typescript
// src/db/schema/players.ts
export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }),
  availability: jsonb("availability"),       // e.g. { mon: true, wed: true, sat: true }
  playStyle: varchar("play_style", { length: 100 }),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Features

- `/players` list page with search/filter (shadcn DataTable or simple card list)
- `/players/new` and `/players/[id]/edit` forms (shadcn Form + Zod validation)
- Server Actions for create / update / delete
- Mobile-friendly card layout
- Tests for validation logic and server actions

---

## Phase 3 -- Match Registration

**Goal**: Record every match with score, type, and notes.

**Branch**: `feature/phase-3-matches`

### Schema

```typescript
// src/db/schema/matches.ts
export const matches = pgTable("matches", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  date: date("date").notNull(),
  time: time("time"),
  matchType: varchar("match_type", { length: 20 }).notNull(), // "practice" | "single" | "doubles"
  score: varchar("score", { length: 50 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matchPlayers = pgTable("match_players", {
  id: uuid("id").defaultRandom().primaryKey(),
  matchId: uuid("match_id").notNull().references(() => matches.id),
  playerId: uuid("player_id").notNull().references(() => players.id),
  role: varchar("role", { length: 20 }).notNull(), // "opponent" | "teammate"
});
```

### Features

- `/matches` page with chronological list, filters by type/date/opponent
- `/matches/new` form: date picker, optional time, select opponents from player list, score input, match type radio, notes textarea
- `/matches/[id]` detail view + edit
- Server Actions with Zod validation
- Tests

---

## Phase 4 -- Dashboard *(current release)*

**Goal**: Visual overview of your match history and performance trends. **No match preparation UI in this phase.**

**Branch**: `feature/phase-4-dashboard`

### Features

- `/dashboard` page with summary cards: total matches, win rate, matches this month, most frequent opponent
- **Charts** (Recharts): matches over time (line), win/loss by match type (bar), performance trend
- Recent matches feed
- Filter by date range
- Data fetched via server components + Drizzle queries
- Responsive: cards stack vertically on mobile
- **Prepare** hidden from navigation; `/prepare` redirects to dashboard

### Internal groundwork (not user-facing)

- Tactical knowledge base under `src/lib/match-prep/` (sources, tactic library, LLM context builder)
- `buildMatchPrepPromptContext()` assembles opponent profile, H2H history, last 5 user matches, and knowledge-base markdown for future LLM calls

---

## Phase 5 -- Match Preparation (LLM)

**Goal**: User selects an opponent and upcoming match date, requests AI advice, and can review past advice without re-calling the API.

**Branch**: `feature/phase-5-match-prep`

### User experience

- Enable **Prepare** in app navigation (`CURRENT_APP_PHASE >= 5`)
- `/prepare` page:
  1. Select **opponent** (from players list)
  2. Select **date** of the upcoming match
  3. Click **Get advice** → server action calls the LLM
  4. Display **tactical advice** and a **game plan** (markdown or structured sections)
  5. **History**: list past advice for this opponent / date, open any saved entry without a new API call

### LLM request — context payload

The API call must include everything available (advice is still generated if some sections are empty):

| Context | Source |
|---------|--------|
| Opponent profile | `players` — play style, strengths, weaknesses, notes |
| Your profile | `users` — profile play style, strengths, weaknesses |
| Matches vs opponent | `matches` + `match_players` filtered by opponent |
| Your last 5 matches | Recent matches for pattern detection |
| Tactical knowledge base | `formatKnowledgeBaseForLlm()` — filtered tactics + source registry (not shown raw to user) |

Implementation: [src/lib/match-prep/build-prep-prompt-context.ts](../src/lib/match-prep/build-prep-prompt-context.ts), [src/lib/match-prep/knowledge-base.ts](../src/lib/match-prep/knowledge-base.ts).

```mermaid
flowchart LR
  user[User on /prepare] --> action[generateMatchPrepAdviceAction]
  action --> gather[Gather DB context]
  gather --> kb[Inject knowledge base excerpt]
  kb --> llm[LLM API]
  llm --> save[Save match_prep_advices row]
  save --> ui[Show advice + history]
```

### Tactical knowledge base (evolvable)

- **Not** a user-facing library — tactics and sources are **prompt context** so the LLM gives grounded, useful answers
- Curated sources in `sources.ts` (ITF, USTA, coaching publications, club manuals, etc.)
- Tactic entries in `tactic-library.ts` with citations, archetypes, and situations
- `KNOWLEDGE_BASE_VERSION` bumped when tactics/sources change materially
- New references: add markdown under `docs/match-prep/`, register in `sources.ts`, add paraphrased tactics to `tactic-library.ts`
- See [docs/match-prep/README.md](match-prep/README.md)

### Schema — saved advice

```typescript
// src/db/schema/match-prep-advice.ts (Phase 5)
export const matchPrepAdvices = pgTable("match_prep_advices", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  opponentId: text("opponent_id").references(() => players.id),
  plannedMatchDate: date("planned_match_date").notNull(),
  adviceMarkdown: text("advice_markdown").notNull(),
  /** Snapshot of prompt context metadata for audit / replay */
  contextSnapshot: jsonb("context_snapshot"),
  knowledgeBaseVersion: varchar("knowledge_base_version", { length: 20 }),
  modelId: varchar("model_id", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

### Server / env

- Server action: `generateMatchPrepAdviceAction({ opponentId, plannedMatchDate })`
- Environment variable: `OPENAI_API_KEY` (Railway staging + production)
- Rate limiting on the advice endpoint (Phase 6 polish)

### Tests

- Prompt context builder (missing sections, knowledge base inclusion)
- Action validation and persistence
- Optional: mocked LLM response snapshot

---

## Phase 6 -- Polish and Production Hardening

**Branch**: `feature/phase-6-polish`

- Custom domain setup on Railway
- SEO metadata and Open Graph tags
- Loading skeletons / Suspense boundaries for every page
- Error boundaries and user-friendly error pages
- Rate limiting on AI endpoint
- Lighthouse audit: target 90+ on mobile
- Final README update with architecture diagram

---

## Summary Timeline

```mermaid
gantt
  title Development Phases
  dateFormat YYYY-MM-DD
  axisFormat %b %d

  section Phase1
  Auth_plus_Deploy :p1, 2026-02-25, 5d

  section Phase2
  Players_CRUD :p2, after p1, 4d

  section Phase3
  Match_Registration :p3, after p2, 5d

  section Phase4
  Dashboard_no_prep_UI :p4, after p3, 4d

  section Phase5
  LLM_Match_Prep_plus_saved_advice :p5, after p4, 5d

  section Phase6
  Polish :p6, after p5, 3d
```

Each phase produces a usable, deployed increment. You can start registering players after Phase 2, recording matches after Phase 3, and so on.

---

## Phase checklist

- [x] **Phase 1a** — Install shadcn/ui, build responsive app shell with nav and placeholder pages
- [x] **Phase 1b** — Set up NextAuth v5 with Google provider and Drizzle adapter
- [x] **Phase 1c** — Create Railway account, provision PostgreSQL, connect GitHub repo, deploy
- [x] **Phase 1d** — Set up Drizzle ORM, initial auth schema, first migration
- [x] **Phase 2** — Players CRUD: schema, server actions, list/create/edit pages, tests
- [x] **Phase 3** — Match registration: schema, form with opponents/score/notes, list/detail pages
- [x] **Phase 4** — Dashboard: summary cards, Recharts charts, filters, responsive layout; Prepare hidden
- [ ] **Phase 5** — LLM match prep: opponent + date, advice generation, saved advice history, knowledge base as prompt context
- [ ] **Phase 6** — Polish: custom domain, loading states, error boundaries, Lighthouse audit
