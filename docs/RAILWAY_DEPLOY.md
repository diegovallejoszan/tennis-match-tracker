# Phase 1c: Railway Deploy

Deploy Tennis Match Tracker to Railway with PostgreSQL and GitHub auto-deploy.

## How this workflow works

You develop and test **locally** on your machine. When you’re ready, you push your code to **GitHub**. Railway **pulls from GitHub** and builds/deploys your app. So the order is:

1. **Local** — you code and run `pnpm dev` / `pnpm build` here.
2. **GitHub** — you push your code so it lives in a repo (and Railway can see it).
3. **Railway** — you connect Railway to that GitHub repo; every push to `main` (or your deploy branch) triggers a deploy.

If your app is only on your computer right now, start with **Step 0** below to get it onto GitHub. Then do the Railway steps.

---

## Environments and databases overview

This guide sets up **two Railway environments** and **two databases** so you can test safely before production:

| Environment | Branch (auto-deploy) | Database   | Who uses it                          |
|-------------|----------------------|------------|--------------------------------------|
| **Production** | `main`             | **Production DB** | Live app only                        |
| **Staging**    | `staging` (or `main`) | **Dev DB**    | Staging app + **local** (via `.env.local`) |

- **Local** → Your machine uses **Dev DB** by setting `DATABASE_URL` in `.env.local` to the Railway Dev DB connection string. You run schema changes and tests against Dev DB first.
- **Staging** → Railway deploys the staging app (e.g. from branch `staging`); it uses **Dev DB**. Good for testing the full app in the cloud before merging to `main`.
- **Production** → Railway deploys from `main`; app uses **Production DB** only. Real user data stays isolated.

So: **one non-production database (Dev DB)** for local and staging; **one production database** for the live app. Schema changes get tested on Dev DB, then you run the same migration/push against Production DB when you deploy to production.

---

## Prerequisites

- A [GitHub](https://github.com) account
- Google OAuth credentials (from Phase 1b); you’ll add the production callback URL after you have your Railway domain
- (After Step 0) This repo pushed to a GitHub repository

---

## 0. Put your app on GitHub (do this first if the app is only local)

If the project is only on your machine, you need to create a GitHub repo and push your code there. Railway will then deploy from that repo.

### 0a. Create a new repository on GitHub

1. Go to [github.com](https://github.com) and sign in.
2. Click the **+** (top right) → **New repository**.
3. Name it (e.g. `tennis-match-tracker`), leave it **empty** (no README, no .gitignore — you already have those locally).
4. Click **Create repository**. Keep the page open; you’ll need the repo URL (e.g. `https://github.com/yourusername/tennis-match-tracker.git`).

### 0b. Turn your project into a Git repo and push (if it isn’t already)

Open a terminal in your project folder (`c:\apps\tennis-match-tracker`).

**If you have never run `git init` in this folder:**

```powershell
git init
git add .
git commit -m "Initial commit: Tennis Match Tracker baseline"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/tennis-match-tracker.git
git push -u origin main
```

Replace `YOUR_USERNAME/tennis-match-tracker` with your actual GitHub username and repo name. If GitHub asks for credentials, use a [Personal Access Token](https://github.com/settings/tokens) as the password (or sign in with GitHub in the browser if you use that flow).

**If the folder is already a Git repo** (you’ve run `git init` before) but you haven’t added GitHub yet:

```powershell
git add .
git status
git commit -m "Initial commit"   # only if you have uncommitted changes
git branch -M main              # ensure the branch is named main
git remote add origin https://github.com/YOUR_USERNAME/tennis-match-tracker.git
git push -u origin main
```

Again, replace the URL with your repo. If `origin` already exists, use `git remote set-url origin https://github.com/...` instead of `git remote add origin ...`.

### 0c. Confirm it’s on GitHub

Refresh the repo page on GitHub. You should see your files (e.g. `package.json`, `src/`, `docs/`). Once you see them, you’re ready for the Railway steps below.

---

## 1. Create Railway account and install CLI (optional)

1. Go to [railway.app](https://railway.app) and sign up (GitHub login is easiest).
2. **(Optional)** Install the Railway CLI for local commands:
   - **Windows (PowerShell):** `iwr https://raw.githubusercontent.com/railwayapp/cli/master/install.ps1 | iex`
   - **macOS/Linux:** `curl -fsSL https://railway.com/install.sh | sh`
   - Or use **npx**: `npx railway` (no global install).

## 2. Create a new project and add a Staging environment

1. In the [Railway dashboard](https://railway.app/dashboard), click **New Project**.
2. Name the project (e.g. `tennis-match-tracker`). You start in the default **Production** environment.
3. Create a second environment for non-production work:
   - Open the **environment dropdown** (top left, usually says "Production").
   - Click **+ New Environment** and name it **Staging**. Switch to **Staging** when you want to configure staging services.

Railway requires **service names to be unique across the whole project**. So we use names like `postgres-prod`, `postgres-dev`, `app-production`, `app-staging` (or similar) so Production and Staging don’t conflict.

## 3. Production environment: add Production DB and app

1. Select the **Production** environment in the dropdown.
2. Add the **Production** database: **+ New** → **Database** → **PostgreSQL**. Rename the service to something like **postgres-prod** (Settings → Service name).
3. Add the app: **+ New** → **GitHub Repo** → select **tennis-match-tracker**. Rename the service to something like **app-production**.
4. In **app-production** → **Settings**:
   - Set **Branch** to `main`.
   - Enable **Auto-deploy** so pushes to `main` deploy here.
5. In **app-production** → **Variables**:
   - **Add variable reference** → select **postgres-prod** → **DATABASE_URL**.
   - Add: `AUTH_SECRET` (e.g. `npx auth secret`), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` (from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)).
6. In **app-production** → **Settings** → **Networking**, create a public domain if needed. Copy the URL (e.g. `https://tennis-match-tracker-production.up.railway.app`).

## 4. Staging environment: add Dev DB and app

1. Switch to the **Staging** environment (dropdown).
2. Add the **Dev** database: **+ New** → **Database** → **PostgreSQL**. Rename to **postgres-dev**.
3. Add the app: **+ New** → **GitHub Repo** → select **tennis-match-tracker**. Rename to **app-staging**.
4. In **app-staging** → **Settings**:
   - Set **Branch** to `staging` (create that branch in GitHub if you use it) or `main` for simpler setup.
   - Enable **Auto-deploy**.
5. In **app-staging** → **Variables**:
   - **Add variable reference** → select **postgres-dev** → **DATABASE_URL**.
   - Add: `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`. You can use the same Google OAuth client as production; add the staging callback URL in the next step.
6. In **app-staging** → **Settings** → **Networking**, create a public domain. Copy the Staging URL (e.g. `https://tennis-match-tracker-staging.up.railway.app`).

## 5. Google OAuth: add both Production and Staging callback URLs

In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → your OAuth 2.0 Client → **Authorized redirect URIs**, add **both**:

- Production: `https://<production-domain>/api/auth/callback/google`
- Staging: `https://<staging-domain>/api/auth/callback/google`

Use the exact domains from Railway (no trailing slash). Save. Auth will work in both environments.

## 6. Local: point `.env.local` at Dev DB

Use the **same** database as Staging (Dev DB) for local development so schema and data are consistent.

1. In Railway, switch to **Staging** → open **postgres-dev** → **Variables** (or **Connect**).
2. Copy the **DATABASE_URL** (or `DATABASE_PUBLIC_URL` if present).
3. In your project root, ensure `.env.local` has:
   ```env
   DATABASE_URL="postgres://..."   # paste the Dev DB URL from Railway
   AUTH_SECRET="..."
   AUTH_GOOGLE_ID="..."
   AUTH_GOOGLE_SECRET="..."
   ```
4. Add to Google OAuth redirect URIs (if not already): `http://localhost:3000/api/auth/callback/google` for local sign-in.

Your local app and the Staging deployment both use **Dev DB**. Run `pnpm db:push` locally to apply schema changes to Dev DB; test locally and on Staging, then apply the same migration to Production DB when you deploy to production.

## 7. Deploy and run migrations

1. **Dev DB (local + Staging):** From your machine with `DATABASE_URL` in `.env.local` pointing at Dev DB, run:
   ```bash
   pnpm db:push
   ```
   Or copy the Dev DB URL from Railway and run `DATABASE_URL="..." pnpm db:push`. Staging and local now share the same schema.

2. **Production DB:** After you deploy to Production (push to `main`), run the same schema against Production DB once:
   - Copy **postgres-prod**’s `DATABASE_URL` from Railway (Production environment → postgres-prod → Variables).
   - Run locally (do not commit this URL): `DATABASE_URL="<postgres-prod-url>" pnpm db:push`
   - Or use Railway CLI with Production selected: `railway run pnpm db:push` (after `railway link` and switching to Production).

Going forward: change schema → `pnpm db:push` locally (updates Dev DB) → test locally and on Staging → merge to `main` → deploy → run `pnpm db:push` (or your migration) once against Production DB.

## 8. Verify both environments

1. **Staging:** Open the Staging app URL → confirm it loads over HTTPS → try `/login` with Google.
2. **Production:** Open the Production app URL → same checks. Production uses only Production DB; Staging and local use Dev DB.

## Summary checklist

- [ ] **Code on GitHub:** repo created, code pushed (Step 0)
- [ ] Railway account created; project has **Production** and **Staging** environments
- [ ] **Production:** postgres-prod + app-production (branch `main`), variables and domain set
- [ ] **Staging:** postgres-dev + app-staging (branch `staging` or `main`), variables and domain set
- [ ] Google OAuth: Production, Staging, and `http://localhost:3000/...` redirect URIs added
- [ ] **Local** `.env.local`: `DATABASE_URL` = Railway Dev DB URL; AUTH_* set
- [ ] Dev DB: `pnpm db:push` run (local or with Dev DB URL); Production DB: `pnpm db:push` run after first Production deploy
- [ ] Staging and Production apps load over HTTPS; Google sign-in works in both

## Does this setup follow best practices?

Yes. This setup matches common best practices:

- **Separate production from non-production:** Production uses its own DB and environment; staging and local share a single non-production DB (Dev). Production data is never touched by day-to-day development or staging.
- **Test before production:** You run schema and app changes against Dev DB (locally and on Staging) before applying the same migration to Production DB and deploying from `main`. That reduces risk and catches issues before they reach users.
- **Clear promotion path:** Code flows from branch → merge to `main` → Production deploy; schema flows from Dev DB (tested) → Production DB (after deploy). No ad-hoc production changes.
- **One source of truth for “dev” data:** Local and Staging both point at Dev DB, so you don’t have to keep two dev databases in sync. You can still use a local-only Postgres later if you want full isolation for local experiments.

The only trade-off: Staging and local share Dev DB, so heavy testing or destructive experiments on Staging can affect your local data (and vice versa). For a small team or solo project that’s usually acceptable; if you need full isolation, add a separate “Staging-only” DB later and point only the Staging app at it.

## Troubleshooting

- **Build fails:** Check the build logs in Railway. Ensure `pnpm build` succeeds locally (`pnpm check` first).
- **Database connection errors:** Confirm `DATABASE_URL` is set and that the app service is in the same project/environment as the Postgres service (so it can reference the variable).
- **Auth redirect error:** Ensure the exact callback URLs (Production, Staging, localhost) are in Google OAuth redirect URIs (no trailing slash).
- **502 / app not starting:** Verify the start command is `pnpm start` (or Railway’s default for Next.js). The app uses `output: 'standalone'` in `next.config.ts` for Railway.
- **Wrong database:** Double-check which environment you’re in (Production vs Staging) and that each app service references the correct Postgres (app-production → postgres-prod, app-staging → postgres-dev).
