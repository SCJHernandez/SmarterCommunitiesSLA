# SLA Performance

Before adding or changing code, follow the project skill:
[.agent/follow-existing-codebase/SKILL.md](.agent/follow-existing-codebase/SKILL.md)
(detail in [references/architecture.md](.agent/follow-existing-codebase/references/architecture.md)).

- Next.js 16 App Router app in `src/`, built from the shared Smarter Communities UI kit (`src/components/ui`)
- Server code in `src/server/` (Dataverse, Microsoft Graph, Entra ID sign-in) — read-only against Dataverse
- Settings: `.env.local` (git-ignored, loaded by Next.js) — never print or commit it
- Verify: `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
