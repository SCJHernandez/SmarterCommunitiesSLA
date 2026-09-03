# .NET MVC Integration Guide

This React frontend is designed to be hosted within an existing .NET MVC application. It uses a modern Vite build pipeline and does not require Node.js, Express, Firebase, or Supabase in production. All data is retrieved by calling a provided API wrapper.

## 1. Required npm dependencies

The application only requires standard frontend libraries.
- `react`, `react-dom`
- `lucide-react` (for icons)
- `date-fns` (for date formatting)
- `recharts` (for data visualization)
- `clsx`, `tailwind-merge` (for dynamic styling)
- *Dev Dependencies*: Vite, Tailwind CSS, TypeScript

## 2. Build command

To build the application for production, run:
```bash
npm install
npm run build
```
This generates a `dist/` directory containing the static HTML, JavaScript, and CSS assets.

### Deploying to .NET MVC
Copy the contents of the `dist/` directory to your .NET MVC `wwwroot` folder, or configure your MSBuild pipeline to copy these files over automatically during deployment.
In your Razor View (e.g., `Index.cshtml`), load the generated `index.js` and `index.css` files. 

## 3. Development command

During development, you can run the standalone frontend dev server:
```bash
npm run dev
```
This starts the local Vite server (default port 3000), which will proxy requests or use local mock data depending on configuration.

## 4. Expected API contract

The application uses an abstract `ApiClient` (`src/api/apiClient.ts`). The frontend expects your .NET API controllers to expose the following endpoints matching standard SLA Dataverse data (specifically, the Resolve KPI instances):

*   **`GET /api/sla/records`**: Returns `SlaKpiInstance[]`
*   **`GET /api/sla/summary`**: Returns `{ insights, kpiStats, healthStats, totalRecords }`
*   **`GET /api/sla/trend`**: Returns `TimeSeriesDataPoint[]`
*   **`GET /api/sla/breakdown`**: Returns `{ priorityBreakdown, teamBreakdown }`
*   **`GET /api/sla/action-items`**: Returns `SlaActionRecord[]`

Your .NET MVC backend must query the Dataverse Web API, abstract the Dataverse concepts, and return standard JSON matching these models (see `src/models/`).

## 5. Environment variables

Define environment variables in a `.env` file at the root of the React project:

```env
# The base URL pointing to your .NET MVC API controllers. 
# In production, this can be a relative path like '/api'
VITE_API_BASE_URL=/api
```

*Note: No Dataverse credentials, client secrets, or Azure configurations should be placed in the frontend environment variables. All authentication to Dataverse must happen server-side within the .NET MVC backend.*

## 6. Folder structure

The application follows a clean, component-driven architecture:
*   `api/` - Abstracted HTTP client (`apiClient.ts`) ensuring all external calls are routed properly.
*   `components/` - Reusable React components (Charts, KPI Cards, Action Center).
*   `pages/` - Page-level components (`Dashboard.tsx`).
*   `services/` - Business logic and data fetching orchestration (`slaService.ts`).
*   `types/` / `models/` - TypeScript interfaces reflecting the expected API responses.
*   `utils/` - Shared helper functions (calculations, formatting, dataverse mappers).
*   `hooks/` - Custom React hooks.
*   `mock/` - Local development mock data generation.

## 7. How mock data is replaced with API data

Currently, `src/services/slaService.ts` contains a flag:
```typescript
const USE_MOCK_DATA = true;
```
To connect the application to your real .NET MVC API controllers:
1. Change `USE_MOCK_DATA = false;` in `slaService.ts`.
2. Ensure `VITE_API_BASE_URL` points to your active .NET backend.
3. The frontend `ApiClient` will automatically invoke the real endpoints.
