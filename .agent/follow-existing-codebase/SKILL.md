---
name: follow-existing-codebase
description: >-
  Follow the sla-performance Next.js codebase's architecture, coding style, component patterns, conventions and
  design system when implementing new features, pages, screens, UI elements, API routes, server actions,
  Dataverse or Microsoft Graph integrations or modifications. Activate this skill for any development task that
  adds or modifies code in the repository. It ensures consistency, maximum reuse, and that new code looks like a
  natural extension of the existing codebase.
---

# Follow Existing Codebase

> **Core Principle:** Before creating anything new, search for something that already exists.
> Reuse it if possible. If it cannot be reused directly, extend or compose it. Only create
> something new when there is a clear reason.

This skill keeps every change consistent with the SLA Performance dashboard: inspect first, plan, then
implement with maximum reuse. For the detailed reference (data flows, every store, every route, the SLA
calculations, sign-in), read [architecture.md](./references/architecture.md).

The app follows the same architecture as the other Smarter Communities portals (bylaw management, SC Portal):
Next.js App Router, SWR → Zustand bridge, axios service layer, react-hook-form + zod, Tailwind tokens, and the
shared UI kit — scaled to one product: monitoring Dynamics 365 Customer Service SLAs (read-only from Dataverse).

---

## Decision Hierarchy

1. **Reuse** an existing component, hook, utility, service, store or server action
2. **Extend** an existing one in a backward-compatible way
3. **Compose** existing pieces into a new feature component
4. **Create** a new reusable component
5. **Create** page-specific implementation (last resort)

Never jump directly to step 5.

---

## Before Writing Any Code

### Step 1 — Understand the request

Identify what needs to be built: page, component, API route, server action, store, fix.

### Step 2 — Search the codebase

1. `src/components/ui/` — design-system primitives (Button, Card, Table, Tabs, Select, Segment, Dialog, Drawer…)
2. `src/components/shared/` — app-wide composites (ConfirmDialog, EmptyState, ErrorState, Loading, PageHeader, UserAvatar)
3. `src/components/<feature>/` — feature components (`sla/`, `users/`, `auth/`, `template/`)
4. `src/services/<entity>/` — browser API functions + SWR hooks
5. `src/stores/` — Zustand stores
6. `src/@types/<entity>/` — interfaces, zod schemas, choice maps, filter definitions
7. `src/server/actions/<entity>/` — business logic; `src/server/data/` — Dataverse / Graph / storage
8. `src/utils/<feature>/` — pure domain logic (`utils/sla/`), `src/utils/hooks/`, `src/constants/`, `src/configs/`
9. Grep for a similar feature and copy its shape

### Step 3 — Produce a short plan

| Section | Content |
|---|---|
| **Existing components to reuse** | Every component that applies |
| **Existing hooks/utils/services/actions** | Anything reusable |
| **New pieces required** | Only those that genuinely need creating |
| **Files to modify** | Expected file list |
| **Architecture fit** | Which layer each change lives in and why |

---

## Project Stack

| Aspect | Value |
|---|---|
| Framework | Next.js 16.3 (App Router, `output: 'standalone'`), React 19 |
| TypeScript | 5 (strict), path alias `@/*` → `src/*` |
| Styling | Tailwind CSS 4 + CSS-variable design tokens + centralised CSS (`src/assets/styles`) |
| Client state | Zustand 5, fed by SWR 2 (SWR → Zustand bridge) |
| HTTP (browser) | axios + axios-retry, centralised in `src/services/api.ts` |
| Forms | react-hook-form 7 + zod 3 + @hookform/resolvers |
| Selects / modals | react-select (`ui/Select`), react-modal (`ui/Dialog`, `ui/Drawer`) |
| Charts | recharts, colours from tokens via `utils/hooks/useTokenColors` |
| Icons | react-icons via semantic names in `src/configs/icons.config.tsx` |
| Dates | dayjs (`src/utils/dates.ts`); SLA periods in `utils/sla/slaPeriod.ts` |
| Data | Microsoft Dataverse (Web API, FetchXML for joins), Microsoft Graph (roles, photos) |
| Tests | Vitest for pure logic (`*.test.ts` next to the module; `vitest.config.ts`, TZ=UTC) |
| Lint / format | ESLint flat config (next core-web-vitals + typescript + prettier); Prettier: single quotes, no semicolons, 4 spaces, width 120 |

Users sign in with Microsoft 365 (Entra ID, `src/proxy.ts` + `server/actions/auth`); roles are Entra app roles
(`@types/auth/Roles`: Admin, Viewer). Dataverse and Graph are called with app registrations. API routes use
`apiAuthHandler(permission, …)`; the UI hides actions with `useSession().can(permission)`.

---

## Folder Structure Rules

```
src/
├── @types/            → Types, zod schemas, choice maps and filter definitions, one folder per entity
├── app/
│   ├── layout.tsx     → Root: html/body, global CSS, ThemeProvider (cookie theme), SWRAppConfig
│   ├── not-found.tsx, login/page.tsx
│   ├── (portal)/      → Pages inside the app shell (PostLoginLayout); layout verifies the session
│   │   └── <route>/page.tsx      → Server components; permission check, then *SWRProvider + *ClientPage
│   └── api/<route>/route.ts      → API routes: validate → server action → response
├── assets/styles/     → ALL CSS (app.css manifest, tailwind/, components/, template/, …)
├── components/
│   ├── ui/            → Design-system primitives (shared kit — don't fork)
│   ├── shared/        → App-wide composites
│   ├── template/      → App shell: SideNav, Header, HeaderSearch, UserDropdown, PageContainer, Theme
│   ├── auth/, users/  → Landing page + sign-in card, session context, roles & permissions page
│   ├── help/          → Help Center: built-in articles (articles/*.tsx), hub, article view
│   ├── swr/           → SWRAppConfig
│   └── <feature>/     → kebab-case feature dirs with dashboard/, records/, details/, dialogs/, forms/
├── configs/           → app.config (paths, public env), navigation.config, icons.config, swr.config, theme
├── constants/         → app, auth, navigation, theme constants
├── proxy.ts           → Sends visitors without a session cookie to /login (API calls get a 401)
├── server/            → SERVER-ONLY (every file starts with `import 'server-only'`)
│   ├── actions/<entity>/  → Business logic used by API routes and server pages (sla, cases, auth, users, theme)
│   ├── data/              → dataverse/ (client + token), graph/, auth/ (Entra, sealed cookies), storage/ (photo cache)
│   ├── routes/api/        → apiHandler / apiAuthHandler wrappers, readJsonBody
│   └── utils/response.ts  → getJsonResponse, getEmptyResponse, getImageResponse, getApiErrorResponse
├── services/<entity>/ → Browser API functions + SWR hooks (+ api.ts)
├── stores/            → Zustand stores
├── test/              → Test fixtures
└── utils/             → Pure utilities; <feature>/ for domain logic; hooks/ for React hooks; hoc/
```

### File naming

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase `.tsx`, default export | `SlaStatusTag.tsx` |
| Feature dirs | kebab-case | `components/sla/` |
| Client pages | `<Entity>ClientPage.tsx` | `SlaRecordsClientPage.tsx` |
| SWR providers | `<Entity>SWRProvider.tsx` | `SlaSWRProvider.tsx` |
| Hooks | `use*.ts` in `utils/hooks/` | `useCaseDetails.ts` |
| Services | `services/<entity>/index.ts` | `services/sla/index.ts` |
| Server actions | `server/actions/<entity>/index.ts` | `server/actions/sla/index.ts` |
| Domain logic | `utils/<feature>/*.ts` (+ `*.test.ts`) | `utils/sla/slaDashboard.ts` |
| Types | PascalCase in `@types/<entity>/` | `@types/sla/SlaKpiInstance.ts` |
| Zod request schemas | `<Entity>Schema.ts` | `@types/sla/SlaKpisSchema.ts` |
| Choice maps | `<Entity><Field>Options.ts` | `SlaStatusOptions.ts` |
| Stores | PascalCase `.ts` | `SlaStore.ts`, `UsersStore.ts` |
| Constants | `<name>.constant.ts` | `auth.constant.ts` |
| Pages / routes | `page.tsx` / `route.ts` | `app/(portal)/records/page.tsx`, `app/api/sla/kpis/route.ts` |

---

## Component Patterns

```tsx
import Tag from '@/components/ui/Tag'
import { type SlaStatusName, slaStatusTagClass } from '@/@types/sla/SlaStatusOptions'
import classNames from '@/utils/classNames'

interface SlaStatusTagProps {
    status: SlaStatusName
    className?: string
}

export default function SlaStatusTag({ status, className }: SlaStatusTagProps) {
    return <Tag className={classNames('whitespace-nowrap', slaStatusTagClass[status], className)}>{status}</Tag>
}
```

- Props are **interfaces** named `[Component]Props`; destructured in the signature
- `className` accepted and merged with `classNames()` (`classnames` + `tailwind-merge`)
- `'use client'` only on files that use hooks, context, event handlers or browser APIs (all `ui/` primitives are client); presentational components like the one above don't need it
- Pages (`page.tsx`) are **server components**: check the session/permission, `notFound()` when missing, then render the feature's `*SWRProvider` + `*ClientPage`
- Imports: always `@/…`; `import { type X }` for types; direct file imports (no barrels except `ui/*/index`)
- React 19: `ref` is a normal prop; derive state during render instead of `setState` in an effect

### Page pattern

```tsx
// src/app/(portal)/records/page.tsx
export const metadata: Metadata = { title: 'SLA records' }

export default async function SlaRecordsPage() {
    const user = await getCurrentUser()
    if (!user || !hasPermission(user.roles, 'sla.view')) notFound()

    return (
        <Suspense fallback={<Loading loading message="Loading SLA records…" />}>
            <SlaSWRProvider>
                <SlaRecordsClientPage />
            </SlaSWRProvider>
        </Suspense>
    )
}
```

Use `<Suspense>` around client pages that call `useSearchParams()` (the case drawer's `?case=`, the header
search's `?q=`). UI state that should survive a refresh or be linkable lives in the URL.

---

## Reusable Component Catalog

### UI primitives (`src/components/ui/`)

| Component | Use for |
|---|---|
| `Button` | All buttons. `variant`: `'solid'` (primary) · `'default'` (outlined) · `'plain'` (text). `size`: `xs`/`sm`/`md`/`lg`. `loading`, `icon` |
| `Card` | Content containers (`header={{ content, extra }}`, `bodyClass`, `clickable`) |
| `Table` | Data tables: `Table.THead/TBody/Tr/Th/Td/Sorter`, `hoverable` |
| `Tabs` | `Tabs.TabList/TabNav/TabContent` (controlled `value`/`onChange`) |
| `Pagination` | `total`, `pageSize`, `currentPage`, `onChange`, `displayTotal` |
| `Form`, `FormItem` | Inside `FormProvider` — label, asterisk, animated error message |
| `Input` | Text, number, `textArea`, `prefix` icon, `invalid`, `size` |
| `Select` | react-select wrapper (pass a stable `instanceId`); `Select/BuildingSelect` kept for reuse (needs a buildings API) |
| `Segment` | Segmented toggles / filters (`Segment.Item`, `size="sm"`) — the period picker and status chips. **Single selection calls `onChange` with a string** — read it with `firstSegmentValue` (`utils/segmentValue`) |
| `Dialog`, `Drawer` | react-modal based overlays — `SlaCaseDrawer` is the drawer example |
| `Tag` | Text labels (status, priority, role) |
| `Alert` | `type` info/success/warning/danger, `showIcon`, `title` — the dashboard insights |
| `Timeline` | `Timeline.Item` — the case drawer's SLA timeline |
| `Skeleton` | Loading placeholders that keep the layout |
| `Avatar` | Photo with fallback to initials (via `shared/UserAvatar`) |
| `Steps`, `Tooltip`, `Spinner`, `Notification`, `ScrollBar`, `Menu`, `Dropdown` | As named |
| `Badge`, `Progress`, `Switcher`, `Checkbox`, `Radio`, `DatePicker`, `TimeInput`, `TimeSelect`, `Slider`, `CollapsibleSection`, `ExpandableText`, `LinkButton`, `Image`, `PDF`, `Audio`, `Video`, `Calendar`, `RangeCalendar` | Shared kit — available for reuse |
| `toast` | `toastSuccess`, `toastError(msg, error?)`, `toastWarning`, `toastInfo` from `ui/toast/toast` |
| `Breadcrumbs` | Rendered by the shell from `usePageBreadcrumbs` |

### Shared (`src/components/shared/`)

| Component | Use for |
|---|---|
| `ConfirmDialog` | Every confirm/cancel dialog; `type` info/success/warning/danger; `confirmForm` submits a form in the body |
| `EmptyState` | Nothing to show — always say why and the next step |
| `ErrorState` | A failure with a retry and/or another action |
| `Loading` | Spinner + message while `loading` |
| `PageHeader` | Page title, description, actions |
| `UserAvatar` | A person: Microsoft 365 photo (by Entra id) or initials |

### Feature building blocks worth knowing

| Component | Where |
|---|---|
| `SlaFilterBar` | `sla/` — period (rolling segment + month), priority / SLA item / owner; on the records page also status chips with counts, "Open cases only" and search |
| `SlaCaseDrawer` | `sla/details/` — URL-driven (`?case=`) case details; records "Recently viewed" |
| `SlaCaseHistory` | `sla/details/` — the Case's Dataverse audit history as a `Timeline` (who changed what) |
| `SlaActionCenter` | `sla/dashboard/` — tabbed, sortable, paged table of SLAs needing action |
| `SlaKpiCard` | `sla/dashboard/` — headline number with a period comparison (`trend: number | null`) |
| `SlaHealthCard`, `SlaTrendChart`, `SlaBreakdownChart` | `sla/dashboard/` |
| `SlaInsightsPanel` | `sla/dashboard/` — the most severe insights (2 by default), the rest behind "Show N more" |
| `HelpCenterClientPage`, `HelpArticleView`, `HelpTableOfContents`, `HelpArticleCard` | `help/` — hub with search and topics; article with "In this page" |
| `HelpText`, `HelpList`, `HelpFormula`, `HelpExample`, `HelpTable`, `HelpNote`, `HelpLink`, `UiLabel` | `help/HelpContent` — the only building blocks for article content |
| `LandingPage`, `SignInCard` | `auth/` — the signed-out page (`/login`) and its sign-in card |
| `SlaRecordsTable` | `sla/records/` |
| `SlaStatusTag`, `SlaPriorityTag`, `SlaUrgency`, `SlaRefreshButton` | `sla/` |
| `RolesClientPage`, `AddPersonDialog` | `users/` — Entra ID role assignments |

---

## Critical Architecture Pattern: SWR → Zustand Bridge

```
[page.tsx (server)] ──► [EntitySWRProvider] ──calls──► [useSWREntity (services/)]
                               │                              │
                     syncs via useEffect               api.fetchJson (axios)
                               ▼                              ▼
                       [Zustand store]                 [/api/* route → server action]
                               ▼
                [Child components read with selectors]
```

1. **Service** (`services/<entity>/index.ts`): `ensure*` hydration (dates), URL helpers, `apiGet*`… and co-located `useSWR*` hooks
2. **SWR provider** (`components/<feature>/…SWRProvider.tsx`): calls the hook, pushes `data`/`loading`/`error`/`refresh` into the store
3. **Store** (`stores/`): data + UI state (filters, sort) + actions
4. **UI**: reads the store with selectors; never calls SWR directly in leaf components

```tsx
// services/sla/index.ts
export const apiGetSlaKpis = async (range: DateRange, apiOptions?: ApiOptions) => {
    const period = getSlaPeriod(range) // the period AND the one it's compared with
    const collection = await api.fetchJson<Collection<SlaKpiInstanceDto>>({
        ...apiOptions,
        method: 'get',
        url: slaKpisUrl,
        params: { startDate: period.previousStart.toISOString(), endDate: period.end.toISOString() },
    })
    return { ...collection, records: collection.records.map(ensureSlaKpiInstance) }
}

export const useSWRSlaKpis = (range: DateRange, config?: SWRConfiguration<Collection<SlaKpiInstance>>) =>
    useSWR([slaKpisUrl, range], () => apiGetSlaKpis(range), config)
```

### Store patterns

- **Collection stores** (single instance): `SlaStore`, `UsersStore` — `records`, `loading`, `validating`, `error`, `filter`, `order`, `refresh`, actions
- **Derived values**: functions that build new arrays/objects (`getVisibleSlaRecords`, `buildDashboardData`) are called inside `useMemo` — never passed straight to the store hook (infinite re-render). `useSlaDashboard()` wraps the dashboard derivation
- Pure domain logic lives in `utils/<feature>/` and is unit-tested (`npm test`); pass `now` in so it's testable

### Period comparisons (SLA)

Every "vs …" figure compares SLAs **created** in the selected period with SLAs created in the period it's
compared with — `getSlaPeriod(range)` returns both windows (`[start, end)`, `[previousStart, previousEnd)`) and
their labels. Rolling ranges compare with the equal-length window before; a completed month with the previous
month; the current month (to date) with the same days of the previous month. Trends are `null` when the
previous period has nothing to compare with — show "No data to compare", never a fake 0.

### Two populations (SLA)

The dashboard answers two different questions, so it reads two different sets of SLAs — never mix them:

| Population | Which SLAs | Used for |
|---|---|---|
| **Period** (`records`, `/api/sla/kpis`) | Created in the selected period (and its comparison period) | Outcomes: started, success rate, breaches, median time to meet, trend, breakdowns |
| **Open work** (`openRecords`, `/api/sla/kpis/open`) | Not met or cancelled, on cases open **now** — whatever their creation date | Action: health bar, Action Center, "needs attention" insights |

A 7-day period must never hide a breach from three weeks ago on a case that's still open. Priority, SLA item and
owner filters apply to both; the period applies only to the first. An In Progress / Nearing SLA past its failure
time counts as breached (Dataverse updates the status late); outcomes are dated by when they happened (met:
`succeededOn`, breached: `failureTime` — never `modifiedOn`). Dataverse's `elapsedtime` is the **paused**
duration, not the time taken — time to meet is the median of `succeededOn − createdOn`.

---

## Server Patterns

### API route

```ts
// src/app/api/sla/kpis/route.ts
export const GET = apiAuthHandler('sla.view', async (req) => {
    const { startDate, endDate } = SlaKpisQuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams))
    return getJsonResponse(await getSlaKpis(new Date(startDate), new Date(endDate)))
})
```

- Routes stay thin: **validate with zod → call a server action → build a response**
- `apiAuthHandler(permission, …)` on everything except `api/health` and `api/auth/*`
- Throw typed errors from `@/@types/errors`: `DataError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409), `ServiceUnavailableError` (503). `ZodError` → 400 automatically. Dataverse failures surface as `DataverseError` (502, details included)
- The UI branches on `code` (`ROLE_EDITING_NOT_ENABLED`, `OWN_ROLE`, `DATAVERSE_NOT_CONFIGURED`…) via `getErrorCode(error)`

### Server actions and data

- `server/actions/<entity>/` map Dataverse rows → app types (`mapSlaKpiInstance`) and return `Collection<T>` for lists — the browser never sees raw Dataverse
- Use the `dataverse` client (`server/data/dataverse`): `get`, `getAll` (follows paging); `formatted(row, column)` reads display values. Joins across a polymorphic lookup use FetchXML (`slakpiinstances?fetchXml=…`, paging cookie) — see `server/actions/sla`
- This app is **read-only** against Dataverse; don't add writes without a clear request
- Pure mapping functions in a server action can be unit-tested (`server-only` is aliased to an empty module in `vitest.config.ts`)
- Validate every id put in an OData URL with `assertGuid()`; escape strings with `odataString()`
- Cache expensive reads briefly in the action (and share the in-flight promise); never cache failures

---

## Form Patterns

```tsx
const form = useForm<AddPersonFormData>({ resolver: zodResolver(AddPersonFormSchema), defaultValues })

<FormProvider {...form}>
    <Form id={FORM_ID} onSubmit={form.handleSubmit(onValid)} noValidate>
        <FormItem label="Role" htmlFor="role" asterisk invalid={!!errors.role} errorMessage={errors.role?.message}>
            <Controller name="role" control={control} render={({ field }) => <Select … />} />
        </FormItem>
    </Form>
</FormProvider>
```

- Schemas + `*FormData` types live in `@types/<entity>/forms/`; request schemas in `@types/<entity>/<Entity>Schema.ts`, reused by the route **and** typed into the service
- In dialogs, put the form in `ConfirmDialog` with `confirmForm={FORM_ID}`
- Use `useWatch` (not `watch`) to read a field during render

---

## Styling Rules

- CSS only in `src/assets/styles/` (manifest `app.css`); otherwise Tailwind classes
- Use tokens, never hex: `bg-primary`, `text-primary`, `bg-primary-subtle`, `text-error`/`bg-error-subtle`, `text-success`/`bg-success-subtle`, `text-warning`/`bg-warning-subtle`, `text-info`/`bg-info-subtle`, `gray-50…950`
- Libraries that need colour values (recharts) get tokens from `useTokenColors([...])`
- Always add `dark:` variants for visible colours
- Radius: `rounded-lg` small, `rounded-xl` controls, `rounded-2xl` cards/dialogs
- Icons only from `@/configs/icons.config` (semantic names like `BreachedIcon`, `CaseIcon`) — add new ones there
- Status/priority colours come from the type maps (`slaStatusTagClass`, `getPriorityTagClass`), not inline per component

---

## UX Conventions

- Every async action shows progress (`loading` on the button) and ends in a toast
- Errors say what happened **and what to do next**
- Filters apply immediately, show their state (selected chips, counts, a loading indicator) and persist across SLA pages (SlaStore) and visits (`useSavedSlaFilter`: localStorage per user, validated by `parseSavedSlaFilter`, read before the first fetch); "Clear filters" keeps the period
- A filter only appears where it changes something: status chips, "Open cases only" and search are on the records page only
- Status is chosen with chips in the dashboard's words (On track, At risk, Breached, Met, Paused, Cancelled) plus an "Open cases only" switch — never raw Dataverse statuses or synthetic combinations. The dashboard itself ignores the status filter (its KPIs are a breakdown by status); it narrows the records list
- The dashboard reads snapshot → action → analysis: Performance cards, then "Needs attention now" (insights, open-work health, Action Center), then Trends. Each section heading links to the help article that explains it. The Action Center shows one row per case + SLA item (the most urgent; "+N earlier SLAs on this case")
- Breakdowns with a single group (e.g. every case is "Normal" priority) are hidden — a one-bar chart says nothing; insights compare rates, not counts, so busy owners aren't flagged for being busy
- Drill-downs (KPI tiles, chart bars, insights, health bar) set filters and open the records list (`useSlaDrillDown`)
- Details open in a drawer with a URL (`?case=`), so they can be linked and appear in "Recently viewed"
- Help lives in the app (`components/help/articles`), one file per article. When a rule, formula or label changes, update the article that describes it and its `updatedOn`; `helpArticles.test.ts` checks every cross-link
- Comparisons always say what they compare with ("vs the previous 30 days", "vs September 2026")
- Irreversible actions go through `ConfirmDialog`
- Empty states explain why and offer the next step
- Charts: thin marks, a legend for 2+ series, a tooltip, tokens for colour, text in text colours

---

## Quality Checklist

- [ ] **Reuse**: used existing components, services, stores, actions
- [ ] **Layers**: page → provider → store → UI; route → action → data
- [ ] **SWR → Zustand**: data fetched in a `*SWRProvider`, read from a store
- [ ] **Server**: `import 'server-only'`; `apiAuthHandler(permission)`; ids validated; typed errors; no raw Dataverse rows to the browser
- [ ] **Types**: from `@types/`; no `any`; request schemas shared by route and service
- [ ] **Forms**: react-hook-form + zod; schemas in `@types/*/forms/`
- [ ] **Styling**: tokens, `classNames()`, `dark:` variants, icons from `icons.config`
- [ ] **Client/server**: `'use client'` where needed; `<Suspense>` around `useSearchParams()`
- [ ] **Logic**: domain calculations in `utils/<feature>/` with tests
- [ ] **Verified**: `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, `npm run build`, and the change looked at in the browser

---

## Anti-Patterns (Do NOT Do)

- ❌ Create a component/hook/util that already exists
- ❌ Add a library without a clear reason
- ❌ Fork or restyle a `components/ui` primitive locally — extend it backward-compatibly instead
- ❌ Call SWR directly in leaf components (use a `*SWRProvider` → store)
- ❌ Use `fetch`/raw axios in the browser — use `api.fetchJson` via a service
- ❌ Put business logic in `route.ts` — it belongs in `server/actions/`
- ❌ Import `src/server/**` from client components
- ❌ Return raw Dataverse rows to the browser
- ❌ Interpolate unvalidated ids into OData URLs or FetchXML
- ❌ Put secrets in `NEXT_PUBLIC_*` variables (they're bundled into the browser JavaScript)
- ❌ Hard-code colours, use `lucide-react` or import react-icons directly (use `icons.config`)
- ❌ Use `Button` variants other than `solid` / `default` / `plain`
- ❌ Use `alert()` / `window.confirm`
- ❌ Pass array-building selectors straight into a store hook (use `useMemo`)
- ❌ `setState` inside an effect to sync derived values (derive during render)
- ❌ Compare periods unlike-for-like, or show 0 when there's nothing to compare with
- ❌ Semicolons, double quotes, or files formatted differently from Prettier
- ❌ Restructure or rename files without a reason
