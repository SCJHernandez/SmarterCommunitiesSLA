# Codebase Architecture Reference

Detailed reference for **sla-performance** (SLA Performance dashboard). Read [SKILL.md](../SKILL.md) first for the
rules; this file explains *where things are and how they connect*. Paths are relative to `src/` unless stated
otherwise, and every one of them exists in the repo.

---

## 1. Technology Stack

| Area | Library | Notes |
|---|---|---|
| Framework | `next` 16.3 (App Router, Turbopack) | `output: 'standalone'` (Node on Azure App Service) |
| UI | `react` / `react-dom` 19 | React-Compiler lint rules on (relaxed only in `components/ui/**`) |
| Language | TypeScript 5 strict | Path alias `@/*` → `src/*` |
| Styling | Tailwind CSS 4 (`@tailwindcss/postcss`) | `tailwind.config.ts` loaded via `@config`; tokens are CSS variables |
| Class merge | `classnames` + `tailwind-merge` | `utils/classNames.ts` |
| State | `zustand` 5 | `persist` only in `RecentItemsStore`; saved SLA filters via `useSavedSlaFilter` (localStorage) |
| Fetching | `swr` 2 | Defaults in `configs/swr.config` (`SWR_DEFAULTS`, `SWR_ONCE_ONLY`) |
| HTTP | `axios` + `axios-retry` | `services/api.ts`; retries GET/HEAD/OPTIONS on network errors or 502/503/504; a 401 sends the browser to `/login` |
| Forms | `react-hook-form` 7 + `zod` 3 + `@hookform/resolvers` 3 | |
| Overlays | `react-modal` (Dialog/Drawer), `@floating-ui/react` (Tooltip, Dropdown), `framer-motion` | |
| Select | `react-select` | Wrapped by `ui/Select` |
| Scroll | `simplebar-react` | `ui/ScrollBar` |
| Charts | `recharts` 3 | Token colours through `utils/hooks/useTokenColors` |
| Icons | `react-icons` | Only through `configs/icons.config.tsx` |
| Dates | `dayjs` | `utils/dates.ts`; periods in `utils/sla/slaPeriod.ts` |
| Auth crypto | `jose` | Sealed (encrypted) cookies in `server/data/auth/session.ts` |
| Server guard | `server-only` | First import of every `server/**` file |
| Tests | `vitest` | `vitest.config.ts` (alias `@`, `TZ=UTC`); fixtures in `test/fixtures.ts` |

Lint/format: `eslint.config.mjs` (flat; `next/core-web-vitals`, `next/typescript`, `prettier`) and
`.prettierrc.json` (single quotes, no semicolons, 4-space tabs, `printWidth` 120).

---

## 2. Request Lifecycle

```
Browser                                    Server
───────                                    ──────
proxy.ts (no session cookie → /login; API → 401)
app/(portal)/x/page.tsx (server comp.) ──► server/actions/auth   (session + permission → notFound)
  └─ <XSWRProvider>
       └─ useSWRX()  (services/x)
            └─ api.fetchJson (axios) ────► app/api/x/route.ts
                                              └─ apiAuthHandler(permission, …)
                                                   ├─ zod schema .parse(query / body)
                                                   ├─ server/actions/x   (business logic, cache)
                                                   │    └─ server/data/{dataverse,graph,storage}
                                                   └─ server/utils/response (JSON / image / error)
       └─ store.setX(data)  (stores/XStore)
            └─ components read with selectors; derived data in useMemo (utils/<feature>)
```

---

## 3. Component Architecture (Three Layers)

### Layer 1 — UI primitives (`components/ui/`)

Shared design system (the same copy as the other portals). Each folder has an `index.ts` re-exporting the
default; import as `import Button from '@/components/ui/Button'`.

| Primitive | Notes |
|---|---|
| `Alert` | `type` info/success/warning/danger, `showIcon`, `title` |
| `Avatar` | Photo with initials fallback (also after a failed server-rendered image) |
| `Breadcrumbs` | Rendered by `PostLoginLayout` from `useBreadcrumbs` |
| `Button` | `variant` `solid` / `default` / `plain`; `size`; `loading`; `icon`; `iconAlignment`; `block` |
| `Card` | `header={{ content, extra }}`, `bodyClass`, `bordered`, `clickable`; `CardLink` variants |
| `CloseButton`, `Spinner`, `StatusIcon` | |
| `ConfigProvider` | Theme / control-size context used by primitives |
| `Dialog`, `Drawer` | react-modal; `isOpen`, `onClose`, `width`; Drawer has `title`, `footer`, `placement` |
| `Form` (`Form`, `FormItem`) | Needs a `FormProvider` ancestor; `label`, `asterisk`, `invalid`, `errorMessage`, `extra` |
| `Input`, `InputGroup` | `textArea`, `prefix` / `suffix`, `invalid`, `size` |
| `Menu`, `MenuItem`, `Dropdown` | Side nav, user menu |
| `Notification`, `toast` | Use the helpers in `ui/toast/toast`: `toastSuccess`, `toastError(message, error?)`, `toastWarning`, `toastInfo`, `toastClear` |
| `Pagination` | `total`, `pageSize`, `currentPage`, `onChange`, `displayTotal` |
| `ScrollBar` | simplebar wrapper |
| `Segment` | `Segment.Item`; `value` is an array |
| `Select` | react-select wrapper; `Select/BuildingSelect.tsx` kept for reuse (expects `/api/buildings`, not in this app) |
| `Skeleton` | `height`, `width`, `variant` |
| `Table` | `Table`, `THead`, `TBody`, `Tr`, `Th`, `Td`, `Sorter`; `hoverable`, `compact` |
| `Tabs` | `TabList`, `TabNav` (`icon`), `TabContent`; controlled `value` / `onChange` |
| `Tag` | Labels (colour classes from the `*Options.ts` maps) |
| `Timeline` | `Timeline.Item` (`media`) |
| `Tooltip` | floating-ui |
| Kept for reuse | `Badge`, `Calendar`, `Checkbox`, `CollapsibleSection`, `DatePicker`, `ExpandableText`, `FileDownloadLink`, `Image`, `LinkButton`, `PDF`, `Progress`, `Radio`, `RangeCalendar`, `Slider`, `Steps`, `Switcher`, `TimeInput`, `TimeSelect`, `Audio`, `Video` |

Primitives may be **extended** (new prop, backward compatible) but not forked. They are the only place where
the React-Compiler rules `set-state-in-effect`, `refs` and `preserve-manual-memoization` are off.

### Layer 2 — Shared composites (`components/shared/`)

| Component | Purpose |
|---|---|
| `ConfirmDialog` | Standard confirm/cancel dialog: `isOpen`, `onClose`, `type`, `title`, `confirmText`, `cancelText`, `onConfirm`, `confirmButtonProps`, `confirmForm` |
| `EmptyState` | Icon + title + description + action |
| `ErrorState` | Failure message + retry / alternative action |
| `Loading` | `loading`, `message`; renders children when done |
| `PageHeader` | Title, description, actions slot |
| `UserAvatar` | Microsoft 365 photo (`/api/users/{id}/photo`) or initials |
| `Container`, `NavToggle` | Layout helpers used by the template |

### Layer 3 — Feature components (`components/<feature>/`)

```
components/
├── sla/
│   ├── SlaSWRProvider.tsx       fetches the selected period (+ comparison period) and open work into SlaStore;
│   │                            refreshes every 5 min
│   ├── SlaFilterBar.tsx         period (rolling Segment + month Select), priority/SLA item/owner, open-only;
│   │                            records page: status chips with counts + search
│   ├── SlaStatusTag, SlaPriorityTag, SlaUrgency, SlaRefreshButton
│   ├── dashboard/   SlaDashboardClientPage, SlaKpiCard, SlaHealthCard, SlaInsightsPanel,
│   │                SlaActionCenter, SlaTrendChart, SlaBreakdownChart
│   ├── records/     SlaRecordsClientPage, SlaRecordsTable
│   └── details/     SlaCaseDrawer (URL-driven ?case=), SlaCaseHistory (audit timeline)
├── users/           RolesClientPage, UsersSWRProvider, dialogs/AddPersonDialog
├── auth/            LandingPage (signed out), SignInCard, SessionContext, SessionProvider
├── help/            HelpCenterClientPage, HelpArticleView, HelpTableOfContents, HelpArticleCard, HelpContent,
│                    articles/ (one .tsx per article + index.ts: HELP_CATEGORIES, HELP_ARTICLES, POPULAR_HELP_ARTICLES)
├── swr/             SWRAppConfig
└── template/        PostLoginLayout, SideNav, SideNavToggle, MobileNav, Header, HeaderSearch, UserDropdown,
                     Footer, Logo, PageContainer, VerticalMenuContent/ (incl. RecentItemsMenu), Theme/
```

---

## 4. Component Authoring Patterns

- **Refs**: React 19 — `ref` is a normal prop; no `forwardRef` in new code
- **Props**: `interface XProps { … }`; extend HTML props with `React.ComponentPropsWithoutRef<'div'>` when forwarding
- **Compound components**: follow `Table` / `Tabs` (`Tabs.TabNav`)
- **Default export** per component file; named exports for helpers/types
- **Stable keys**: record ids — never the array index for lists that change
- **Derived state**: compute during render; to reset state when data changes, adjust it while rendering
  (`SlaActionCenter` / `SlaRecordsTable` page reset) or use a `key` — never `setState` in an effect
- **Time**: pass `now` into pure functions (`buildDashboardData(records, filter, now)`) so they're testable;
  `useSlaDashboard` ticks it every minute
- **Hydration**: no `Math.random()` / `Date.now()` in render of server-rendered markup; browser-only work in effects

---

## 5. Page Component Pattern

Pages live in `app/**/page.tsx` and are **server components**:

| Page | Renders |
|---|---|
| `(portal)/page.tsx` | `sla.view` → `<Suspense>` → `SlaSWRProvider` → `SlaDashboardClientPage` |
| `(portal)/records/page.tsx` | `sla.view` → `<Suspense>` → `SlaSWRProvider` → `SlaRecordsClientPage` (`?q=`, `?case=`) |
| `(portal)/settings/roles/page.tsx` | `users.view` → `UsersSWRProvider` → `RolesClientPage` (`?roleEditing=`) |
| `(portal)/help/page.tsx` | `HelpCenterClientPage` with article summaries (content stays on the server) |
| `(portal)/help/[slug]/page.tsx` | `HelpArticleView` (`notFound()` for an unknown slug); `generateMetadata` from the article |
| `login/page.tsx` | `LandingPage` → `SignInCard` (`?error=`, `?returnTo=`, `?signedOut=`); redirects when already signed in |
| `not-found.tsx` | Missing pages and missing permissions |

Rules:
- `export const metadata = { title }` (the root layout adds `| SLA Performance`)
- Check the permission on the server (`getCurrentUser` + `hasPermission` → `notFound()`)
- `<Suspense>` around client pages that use `useSearchParams()`
- Client pages set breadcrumbs with `usePageBreadcrumbs([...])` (none on the dashboard) and the title with `PageHeader`; server-rendered pages use `<PageBreadcrumbs items>` (`components/shared`)
- Paths come from `configs/app.config` (`homePath`, `slaRecordsPath`, `rolesPath`, `loginPath`, `helpPath`, `getHelpArticlePath(slug, section?)`, `signInUrl`, `signOutUrl`, `getSlaCasePath(id)`, `getCrmCaseUrl(caseId)`) — no hard-coded URLs
- URL params are named in `constants/` (`CASE_URL_KEY`, `SEARCH_URL_KEY`, `RETURN_TO_URL_KEY`)

---

## 6. Layout Nesting

```
app/layout.tsx              <html>/<body>: app.css, getTheme() cookie → ThemeProvider, SWRAppConfig
├── app/login/page.tsx
└── app/(portal)/layout.tsx getCurrentUser() (else redirect /login) → SessionProvider → PostLoginLayout
    ├── SideNav (VerticalMenuContent + "Recently viewed") / MobileNav
    ├── Header (SideNavToggle, UserDropdown) — HeaderSearch is off (`headerSearch={false}`): the records page has its own search
    └── PageContainer (Breadcrumbs) → page
```

Navigation items: `configs/navigation.config` — titled sections of items with an `authority` (permissions;
`useNavigation` filters them), and `collapse` entries whose sub-items show with a dot (Help Center; it opens when
one of them is the current page, and links to its first sub-item when the side nav is collapsed). Icons mapped by the default export of `configs/icons.config.tsx`. Theme:
`configs/theme.config.ts`, `configs/preset-theme-schema.config.ts`, cookie `THEME_COOKIE`, server action
`server/actions/theme`.

---

## 7. API Route Architecture

### Wrapper (`server/routes/api/index.ts`)

- `apiHandler(handler)` — turns thrown errors into `{ error, code, ...extra }` with the right status
- `apiAuthHandler(permission, (req, ctx, user) => …)` — every route except `api/health` and `api/auth/*`:
  requires a signed-in user (401) with the permission (403)
- `readJsonBody(req)` — malformed JSON → `DataError` (400)

### Routes

| Route | Methods | Permission | Server action(s) |
|---|---|---|---|
| `api/health` | GET | — | — |
| `api/auth/login` | GET `?returnTo&select&purpose=manage-roles` | — | `startSignIn` |
| `api/auth/callback` | GET (from Microsoft) | — | `completeSignIn` |
| `api/auth/logout` | GET | — | clears the session cookies |
| `api/me` | GET | `sla.view` | the session user |
| `api/sla/kpis` | GET `?startDate&endDate` (ISO; ≤ 400 days) | `sla.view` | `getSlaKpis` → `Collection<SlaKpiInstance>` |
| `api/sla/kpis/open` | GET | `sla.view` | `getOpenSlaKpis` → SLAs not met/cancelled on open cases, any creation date |
| `api/cases/[caseId]/history` | GET | `sla.view` | `getCaseHistory` (Dataverse audit; 403 `AUDIT_NOT_PERMITTED` without the privilege) |
| `api/users` | GET | `users.view` | `getRoleDirectory` |
| `api/users/search` | GET `?q=` | `users.manage` | `searchPeople` (Admin's token) |
| `api/users/roles` | PUT `{ principalId, role }` | `users.manage` | `setPersonRole` |
| `api/users/roles/[assignmentId]` | DELETE | `users.manage` | `removeRoleAssignment` |
| `api/users/[userId]/photo` | GET | `sla.view` | `getUserPhoto` (cached) |

### Responses (`server/utils/response.ts`)

`getJsonResponse(data, { status })`, `getEmptyResponse()` (204), `getImageResponse(bytes, type)`,
`getApiErrorResponse(error)` → `{ error, code, ...extra }`.

### Errors (`@types/errors`)

| Class | Status | Example codes |
|---|---|---|
| `DataError` | 400 | `INVALID_DATA`, `INVALID_ID` |
| `UnauthorizedError` / `ForbiddenError` | 401 / 403 | `UNAUTHORIZED`; `ROLE_EDITING_NOT_ENABLED`, `ENTRA_FORBIDDEN` |
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError` | 409 | `OWN_ROLE` |
| `ServiceUnavailableError` | 503 | `DATAVERSE_NOT_CONFIGURED`, `NOT_CONFIGURED` (session secret) |
| `ZodError` | 400 | `INVALID_DATA` (message names the first failing field) |
| `DataverseError` (`server/data/dataverse/client.ts`) | 502 (400 when Dataverse returned 400) | Dataverse message in `details` |

---

## 8. Server Actions & Data Layer

### `server/actions/` (business logic)

| Folder | Main exports |
|---|---|
| `sla` | `getSlaKpis(start, end)` — FetchXML over `slakpiinstance` + `incident` (+ `systemuser` owner) + `slaitem`, paged with the paging cookie, mapped by `mapSlaKpiInstance`; cached 3 min (keyed to the hour) with the in-flight promise shared. `getOpenSlaKpis()` — the same query scoped to status not Succeeded/Canceled and an inner join to open incidents; cached 1 min |
| `cases` | `getCaseHistory(caseId)` — `RetrieveRecordChangeHistory` on the incident, mapped by `mapCaseHistory` (formatted values, column display names cached a day, bookkeeping fields dropped, newest 50) |
| `auth` | `getCurrentUser`, `requireUser`, `assertPermission`, `safeReturnTo`, `startSignIn`, `completeSignIn`, `isAuthDisabled` |
| `users` | `getRoleDirectory`, `getUserPhoto`, `requireRoleAdminToken`, `searchPeople`, `setPersonRole`, `removeRoleAssignment` |
| `theme` | `'use server'` `getTheme` / `setTheme` (cookie) |

### `server/data/` (integrations)

| File | What |
|---|---|
| `dataverse/client.ts` | `DataverseClient` (`get`, `getAll`, `create`, `update`, `delete`, `uploadFile`, `downloadFile`), `DataverseError`, `isGuid`, `assertGuid`, `inFilter`, `odataString`, `formatted` |
| `dataverse/index.ts` | cached `getDataverseToken`, the `dataverse` singleton (`DATAVERSE_*`) |
| `graph/index.ts` | `getGraphToken` (app-only, `GRAPH_*` → `DATAVERSE_*`), `graphGet`, `graphGetAll`, `graphPost`, `graphGetBytes`, `graphRequestAs` (delegated), `GraphError` |
| `auth/entra.ts` | `authConfig` (`AUTH_*`), authorize URL, code redemption, id-token verification, `/me` profile + photo |
| `auth/session.ts` | `seal` / `unseal` (JWE with `AUTH_SESSION_SECRET`), `randomToken`, `pkceChallenge` |
| `auth/delegatedTokens.ts` | Admin role-editing tokens held in memory, referenced by a sealed cookie |
| `storage/photoCache.ts`, `storage/localFiles.ts` | Profile photos under `uploads/_photos` (git-ignored) |

Dataverse gotchas (all hit in practice):
- Requests send `Prefer: odata.include-annotations="OData.Community.Display.V1.FormattedValue"`; read display values with `formatted(row, '_msdyn_slaitemid_value')`
- FetchXML link-entity columns come back as `alias.column` (`case.ticketnumber`, `caseowner.fullname`); paging uses `@Microsoft.Dynamics.CRM.morerecords` + the double-URL-encoded `pagingcookie`
- `slakpiinstance.status`: 0 In Progress, 1 Noncompliant, 2 Nearing Noncompliance, 3 Paused, 4 Succeeded, 5 Canceled
- `incident.prioritycode` has custom values (`921910001` Emergency, `921910000` Urgent, 1 High, 2 Normal, 3 Low) → `"<rank> - <label>"`
- `elapsedtime` is the **paused** duration in business minutes (its display name: "Paused duration of a KPI in business hours") — not the time taken. Mapped to `pausedBusinessMinutes`; time to meet uses `succeededOn − createdOn`
- `modifiedOn` is not when a breach happened (it moves on any later touch — up to 428 days after in this org); date breaches by `failureTime`
- Audit history actions seen on cases: Create, Update, Assign, Activate, Merge (`mapCaseHistory` turns them into sentences)
- A case can carry several SLA KPI instances; a warning time can precede the instance's `createdon`
- SLA timers can stay "In Progress" on resolved cases — the dashboard excludes them (`isCaseResolved`)
- Case audit history needs auditing on for `incident` (it is) **and** the "View Audit History" privilege (`prvReadRecordAuditHistory`) on the app user's security role

### Sign-in

`proxy.ts` (optimistic cookie check → `/login`), `app/api/auth/{login,callback,logout}`, `server/actions/auth`,
`server/data/auth`. Allowed domains `AUTH_ALLOWED_EMAIL_DOMAINS`; roles from the `roles` claim, else
`AUTH_DEFAULT_ROLE` (`none` turns people away); `AUTH_DISABLED=true` acts as an Admin outside production builds.
The portal layout verifies the session and provides it to the client (`useSession()` → `user`, `can`).

---

## 9. Data Flow: SWR → Zustand Bridge

| Service | Exports |
|---|---|
| `api.ts` | `api.fetchJson`, `api.fetch`, `api.fetchBlob`; `ApiError` (`status`, `code`, `body`); `ApiOptions` |
| `cases` | `getCaseHistoryUrl`, `ensureCaseHistoryEntry`, `apiGetCaseHistory`, `useSWRCaseHistory` |
| `sla` | `slaKpisUrl`, `ensureSlaKpiInstance`, `apiGetSlaKpis(range)` (fetches the period **and** its comparison period), `useSWRSlaKpis(range)` |
| `users` | `usersUrl`, `getUserPhotoUrl`, `ensureUserAccount`, `apiGetRoleDirectory`, `useSWRRoleDirectory`, `getEnableRoleEditingUrl`, `apiSearchPeople`, `apiSetUserRole`, `apiRemoveRoleAssignment` |
| `buildings` | Kept for `ui/Select/BuildingSelect` (no API route in this app yet) |

Rules: SWR key = API URL (relative to `/api`) plus parameters that change the result (the range); `null` key
to skip; `ensure*` converts dates; mutations call the store's `refresh`.

Providers: `SlaSWRProvider` (range from `SlaStore.filter.dateRange`; keeps the last records while another range
loads), `UsersSWRProvider`. Global SWR config: `components/swr/SWRAppConfig.tsx`.

---

## 10. Zustand Stores (`stores/`)

| Store | Kind | Key state | Exported helpers |
|---|---|---|---|
| `SlaStore` | collection | `records` (period), `openRecords` (open work), `loading`, `validating`, `error`, `loadedAt`, `filter` (range, status, priority, SLA item, owner, openOnly, query), `order`, `refresh`; `resetFilter({ keep })` keeps the period; `filterLoaded` / `restoreFilter` (the saved filter, once per page load — the period isn't fetched before) | `getVisibleSlaRecords`, `countActiveFilters` |
| `UsersStore` | collection | `records` (role assignments from Entra ID), `manageUrl`, `problem`, `canManage`, `filter` | `getVisibleAccounts` |
| `RecentItemsStore` | single, `persist` (localStorage, per user id, `skipHydration`) | `byUser` | `ensureRecentItemsLoaded`, `selectRecentItems`; record visits with `utils/hooks/useRecordRecentItem` |

```ts
// ✅ derived array → read raw state, derive in useMemo
const visible = useMemo(() => getVisibleSlaRecords(records, { filter, order }), [records, filter, order])
// ❌ useSlaStore((s) => getVisibleSlaRecords(s.records, s)) → new array every render → infinite loop
```

---

## 11. SLA Calculations (`utils/sla/`)

| Module | What |
|---|---|
| `savedSlaFilter.ts` | `parseSavedSlaFilter(raw, now)` (field-by-field, unknown or out-of-date values fall back to the defaults), `toSavedSlaFilter` (everything but the search), `savedSlaFilterKey(userId)` |
| `slaPeriod.ts` | `getSlaPeriod(range, now)` → `{ start, end, previousStart, previousEnd, label, previousLabel }`; `getRecentMonths`, `toMonthRange`, `getRangeLabel` |
| `slaDashboard.ts` | `buildDashboardData({ instances, openInstances, filter, now })` → records (status-filtered; open work with "Open cases only"), summary (period KPIs + open-work health), trend, breakdown (owner / priority / SLA item), action records, insights, filter options, status counts; `matchesStatusFilter` |
| `slaCalculations.ts` | `isEvaluated`, `isAtRisk`, `calculateSuccessRate`, `classifyRisk`, `median`, `calculateMedianTimeToMeet`, `calculateBreachConcentration`, `minutesUntil`, `formatMinutes` |
| `slaInsights.ts` | `generateInsights(summary, rates, open, now)` — at most 5: open breaches, at risk, a breach-rate outlier, adherence / time-to-meet change, long-paused SLAs |
| `priority.ts` | `getPriorityRank`, `getPriorityLabel`, `getPriorityTagClass` |

Comparison rules (tested in `slaPeriod.test.ts` / `slaDashboard.test.ts`):
- Ranges: `Today` (last 24 h), `Last 7/30/90 Days` (rolling) and `month:YYYY-MM` (calendar month, browser time zone)
- Rolling → the equal-length window before; completed month → the previous month; current month → the same days of the previous month (capped at its end)
- "Current" and "previous" are SLAs **created** in each window; both windows are bounded (`[start, end)`)
- Started: SLAs created; success rate: met ÷ (met + breached), `null` when nothing was evaluated, change in
  percentage points from unrounded rates; breaches: count; median time to meet: calendar hours from created to met,
  change from unrounded medians
- Open work (no comparison — a snapshot): breached (Noncompliant, or running past the failure time), at risk (Nearing,
  or past the warning time), paused, on track. At-risk % = at risk ÷ running (on track + at risk)
- Trend per day: Started by `createdOn`, Met by `succeededOn`, Breached by `failureTime` — outcomes only inside the window
- Action Center: open work, categories Breached / At risk / On track / Paused, one row per case + SLA item (most urgent)
- A trend is `null` when the previous window has nothing to compare with

Status filter (`@types/sla/SlaStatusOptions` → `SLA_STATUS_FILTERS`): On track (open, In Progress, before the warning
time), At risk (`isAtRisk`), Breached (Noncompliant), Met (Succeeded), Paused, Cancelled; plus `openOnly` (case still
open; switches the list to open work, any creation date). It narrows only `records` — the KPIs, charts, health and
Action Center use every status. `statusCounts` counts
each chip with the other filters applied.

---

## 12. Hooks & Utilities

| Hook (`utils/hooks/`) | Purpose |
|---|---|
| `useBreadcrumbs` / `usePageBreadcrumbs(items)` | A page sets its breadcrumbs; the shell renders them |
| `useNavigation` | Navigation tree filtered by the user's permissions |
| `useSession` | `{ user, can(permission) }` |
| `useTheme` | Theme context: `mode`, `setMode`, `setSideNavCollapse` |
| `useRecordRecentItem(item)` | Adds a record to "Recently viewed" |
| `useSlaDashboard()` | `buildDashboardData` memoised, re-run every minute |
| `useSlaDrillDown()` | `(filter) => void`: apply filters and open the records list |
| `useSavedSlaFilter()` | Restores the user's last SLA filter (localStorage, per user) and saves each change; used by `SlaSWRProvider` |
| `useCaseDetails()` | `{ caseId, openCase(id), closeCase() }` via `?case=` |
| `useTokenColors(tokens)` | CSS-variable token values for recharts; re-read on theme change |

| Utility (`utils/`) | Purpose |
|---|---|
| `classNames.ts` | `classnames` + `tailwind-merge` |
| `dates.ts` | `formatDate`, `formatDateTime`, `fromNow`, `formatDuration` |
| `errors.ts` | `tryGetErrorMessage`, `getErrorCode`, `isNotFoundError`, `isConflictError` |
| `parse.ts` | `tryParseDate`, `tryParseJson` |
| `segmentValue.ts` | `firstSegmentValue` — `ui/Segment` reports a single selection as a string |
| `initials.ts` | `getInitials` (UserAvatar) |
| `focus.ts`, `queryRoute.ts`, `setThemeMode.ts`, `applyThemeSchema.ts`, `hoc/withHeaderItem.tsx` | Template plumbing |

---

## 13. Types (`@types/`)

```
@types/
├── sla/              SlaKpiInstance.ts (app type + DTO), SlaStatusOptions.ts (statuses, order, tag classes,
│                     status filter chips + hints), SlaFilter.ts (DateRange: rolling | month, SlaFilter, DEFAULT_SLA_FILTER),
│                     SlaDashboard.ts (summary, trend, breakdown, insights, action records), SlaKpisSchema.ts (zod)
├── cases/            CaseHistory.ts (history entries and field changes)
├── auth/             Roles.ts (roles, permissions, hasPermission), SessionUser.ts
├── help/             HelpArticle.ts (article, section, category, summary)
├── users/            UserAccount.ts, UserRoleSchema.ts
├── buildings/        Building.ts, BuildingMeta.ts (for BuildingSelect)
├── dynamics/         collections (Collection<T>)
├── errors/           error classes + ApiErrorBody
└── common.ts, navigation.ts, routes.ts, theme.ts
```

---

## 14. Styling

```
assets/styles/
├── app.css         manifest (imports everything)
├── tailwind/       tokens (CSS variables), base layer; @config tailwind.config.ts
├── components/     one _file.css per primitive (_button.css, _tabs.css, …)
├── template/       _side-nav.css, _header.css, …
├── others/         animations
├── vendors/        simplebar override
└── print/
```

- Tokens: `primary`, `primary-deep`, `primary-mild`, `primary-subtle`, `error` / `success` / `warning` / `info` (+ `-subtle`), `gray-*`
- Dark mode: `dark` class on `<html>` from the theme cookie; always pair colours with `dark:`
- Radius: `rounded-lg` (small), `rounded-xl` (inputs/buttons), `rounded-2xl` (cards, dialogs)
- Status colours from the type maps (`slaStatusTagClass`, `getPriorityTagClass`, `roleTagClass`)
- Charts: status series use `success` (met), `error` (breached), `info` (open) — `warning` is too close to `error`
  for normal vision; always a legend + tooltip; axis/grid in `gray-*`

---

## 15. Forms & Dialogs

- Schemas: `@types/<entity>/forms/`; request schemas `@types/<entity>/<Entity>Schema.ts`
- Dialog forms: `ConfirmDialog confirmForm={FORM_ID}`; disable confirm while submitting
- The server validates again with the request schema — form schemas are UX, not security
- Feature dialogs live in `components/<feature>/dialogs/` and own their mutation (service call → toast → `refresh()`)
- Detail drawers are URL-driven (`SlaCaseDrawer` reads `?case=` and finds the record in the store)

---

## 16. Verification

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
npm run format:check   # Prettier (npm run format to fix)
npm test               # Vitest (utils/sla)
npm run build          # next build — catches server/client boundary errors and missing 'use client'
npm run dev            # http://localhost:3000
```

- Local sign-in: `AUTH_DISABLED=true` in `.env.local` acts as an Admin (never in production builds); with a real
  app registration, register `http://localhost:3000/api/auth/callback`
- The dashboard reads live Dataverse data — this app never writes to Dataverse
- Never print or commit `.env*` files except `.env.example` (real secrets)
- Look at UI changes in the browser (light and dark), including empty, loading and error states
