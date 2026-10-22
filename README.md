# SLA Performance

Resolution KPI monitoring and action center for Dynamics 365 Customer Service. A Next.js app, built from the
shared Smarter Communities UI kit, that reads SLA KPI instances from Dataverse and signs people in with their
Microsoft 365 account.

## Architecture

```
Browser ──► Next.js (App Router)
              ├── /, /records, /settings/roles   pages (server components → client pages)
              ├── /help, /help/:article          Help Center: built-in articles (no backend)
              ├── /login                         landing page and Microsoft 365 sign-in
              ├── /api/auth/*                    OpenID Connect with Entra ID, encrypted session cookie
              ├── /api/me                        the signed-in user and their roles
              ├── /api/sla/kpis                  SLA KPI instances created in a window (Dataverse FetchXML, cached 3 min)
              ├── /api/sla/kpis/open             open work: SLAs not yet met on open cases, any date (cached 1 min)
              ├── /api/cases/:id/history         the case's Dynamics 365 audit history
              └── /api/users/*                   role assignments in Entra ID, profile photos (Microsoft Graph)
```

- **Frontend** (`src/app`, `src/components`): SWR → Zustand data flow, Tailwind 4 design tokens.
- **Server** (`src/server`): API routes → server actions → Dataverse / Graph. Read-only against Dataverse.

Conventions, folder layout and patterns are documented in the project skill:
[`.agent/follow-existing-codebase`](.agent/follow-existing-codebase/SKILL.md).

## Roles

Roles are Entra ID **app roles** on the sign-in app registration (values must match exactly):

| Role       | Can                                                               |
| ---------- | ----------------------------------------------------------------- |
| **Admin**  | View the dashboard and records, see and change who has which role |
| **Viewer** | View the dashboard, records and case details                      |

People with no role get `AUTH_DEFAULT_ROLE` (`Viewer` by default, or `none` to turn them away). Admins can assign
roles from **Roles & permissions** after enabling role editing (their own consent; Entra ID checks their rights).

## Setup

Prerequisites: Node.js 20+, an app registration for Dataverse (client credentials) and one for sign-in.

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill it in. For local work without a sign-in app registration, set
   `AUTH_DISABLED=true` (you act as an Admin; ignored in production builds).
3. Sign-in app registration: web platform, redirect URIs `<app>/api/auth/callback` (and
   `http://localhost:3000/api/auth/callback` for development), delegated `openid profile email User.Read`, app roles
   `Admin` and `Viewer`.

### Case history

Opening a case shows its Dynamics 365 audit history (who changed the status, owner, priority and so on). Auditing is
already on for Cases; the app's Dataverse application user also needs the **View Audit History** privilege
(Security role → Miscellaneous privileges). Until then the case panel says so instead of showing the history.

## Development

```bash
npm run dev          # http://localhost:3000
```

| Command             | Purpose                                                      |
| ------------------- | ------------------------------------------------------------ |
| `npm run dev`       | Next.js dev server                                           |
| `npm test`          | Unit tests (Vitest) for periods, SLA calculations, dashboard |
| `npm run typecheck` | TypeScript strict type check                                 |
| `npm run lint`      | ESLint                                                       |
| `npm run format`    | Prettier (`format:check` to verify)                          |
| `npm run build`     | Production build (`.next/standalone`)                        |
| `npm start`         | Run the production build locally                             |

## Deployment

GitHub Actions (`.github/workflows/deploy.yml`) runs on every push to `main`: type check, lint, format check, tests,
`npm run build`, then deploys the standalone server (`.next/standalone` with `.next/static` and `public/` copied in)
to Azure App Service. The deploy step is skipped until `AZURE_WEBAPP_NAME` is set.

The App Service must be **Linux** with **Node 22 LTS**. (On Windows, IIS gives Node a named pipe instead of a port,
which the Next.js standalone server can't listen on.)

One-off setup:

1. **App Service** (Linux, Node 22 LTS). Then, in its **Configuration**:
    - **General settings → Startup Command**: `node server.js`
    - **General settings → SCM Basic Auth Publishing Credentials**: On (needed for the publish profile)
    - **Application settings**: `SCM_DO_BUILD_DURING_DEPLOYMENT` = `false`, plus every setting below
2. **GitHub → Settings → Secrets and variables → Actions**:
    - Secret `AZURE_WEBAPP_PUBLISH_PROFILE`: the file from the App Service's **Overview → Download publish profile**
    - Variable `AZURE_WEBAPP_NAME`: the App Service name
    - Optional variables `NEXT_PUBLIC_PORTAL_NAME`, `NEXT_PUBLIC_CRM_BASE_URL`, `NEXT_PUBLIC_CRM_APP_ID` (fixed at
      build time)
3. Push to `main`, or run the workflow from the **Actions** tab (**Run workflow**).

| Application setting                                                                      | Value                                                                  |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `DATAVERSE_URL`, `DATAVERSE_TENANT_ID`, `DATAVERSE_CLIENT_ID`, `DATAVERSE_CLIENT_SECRET` | Dataverse app registration (client credentials)                        |
| `AUTH_CLIENT_ID`, `AUTH_CLIENT_SECRET`                                                   | Sign-in app registration (may be the same one); the secret's **Value** |
| `AUTH_TENANT_ID`                                                                         | Optional: defaults to `DATAVERSE_TENANT_ID`                            |
| `AUTH_SESSION_SECRET`                                                                    | 48+ random characters, different per environment                       |
| `AUTH_BASE_URL`                                                                          | The app's public address, e.g. `https://<app>.azurewebsites.net`       |
| `AUTH_DEFAULT_ROLE`                                                                      | `none` (only people given a role get in) or `Viewer`                   |
| `AUTH_ALLOWED_EMAIL_DOMAINS`                                                             | `smartercommunities.com.au,smarterdirectory.com.au`                    |
| `SCM_DO_BUILD_DURING_DEPLOYMENT`                                                         | `false` (the package is already built)                                 |

Never set `AUTH_DISABLED` in Azure (production builds ignore it anyway). `.env.prod` / `.env.test` are git-ignored
reference copies of these settings.

## What the dashboard shows

Top to bottom: **Performance** (the period's headline numbers), **Needs attention now**, then **Trends** (SLA flow
per day and breakdowns). Each section links to the help article that explains it.

**Needs attention now** covers every open case, whatever period is selected — a breach from three weeks ago on a
case that's still open must not disappear because "7 days" is picked. It holds the insights, the open SLAs bar
(on track / at risk / breached / paused) and the **Action Center**: one row per case and SLA item, most urgent first,
in Breached, At risk, On track and Paused tabs. The two most severe insights show; the rest are behind "Show more".

**Performance** covers SLAs started in the selected period, compared with the period before.

## Periods and comparisons

Pick a rolling period (24 hours, 7, 30 or 90 days) or a calendar month. Every "vs …" figure compares SLAs
**created** in the selected period with SLAs created in the period it's compared with:

| Selected           | Compared with                                       |
| ------------------ | --------------------------------------------------- |
| Last N days / 24 h | The N days (24 h) immediately before                |
| A completed month  | The whole previous month                            |
| The current month  | The same days of the previous month (e.g. 1–22 Sep) |

When the previous period has nothing to compare with, the card says so instead of showing 0.

## Filters

Filters apply straight away, carry across the dashboard and the records list, and are **remembered** for next time
(in the browser, per signed-in user; the search isn't kept). Besides the period you can narrow by priority, SLA item
and owner. The records list adds **status chips** — On track, At risk, Breached, Met, Paused, Cancelled, each with
its count — **Open cases only** and a search. The dashboard's KPIs, charts and
Action Center always cover every status (they're a breakdown by status); clicking a tile, bar or insight opens the
records list with the matching chip selected.

| Metric                   | Definition                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------- |
| **SLAs started**         | SLA timers created in the period                                                                        |
| **SLA success rate**     | Succeeded ÷ (Succeeded + Noncompliant); the change is in percentage points                              |
| **Breached**             | SLAs that missed their deadline (the card also says how many are on cases still open)                   |
| **Median time to meet**  | Median calendar hours from an SLA starting to being met. Median, because a few long cases skew the mean |
| **Open SLAs — breached** | On open cases: Noncompliant, or still running past the failure time                                     |
| **Open SLAs — at risk**  | On open cases: _Nearing Noncompliance_ or past the warning time                                         |
| **Per-day flow**         | Started (by creation), met (by when met) and breached (by the deadline) each day                        |

Dataverse's `elapsedtime` is the time an SLA spent **paused**, not the time taken — the case panel shows it as
"Paused for (business hours)".

SLA timers left running on resolved or cancelled cases are excluded.
