# AGENTS.md

## Project Overview

Inventory Management System (IMS) — a full-stack portfolio project simulating stock tracking for small-to-medium retail/warehouse businesses. Monorepo with two apps: `apps/api` (Express.js REST backend) and `apps/web` (Next.js frontend). Core features: auditable stock movements, purchase orders, stock opname with approval workflow, and role-based access (ADMIN, MANAGER, STAFF).

Documentation: `docs/PRD-Inventory-Management-System-EN.md`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Data fetching (FE) | TanStack Query |
| Backend | Express.js (TypeScript), REST API + Swagger/OpenAPI |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache/Queue | Redis + BullMQ (low-stock alert jobs) |
| Auth | JWT (access + refresh token) |
| Validation | Zod (frontend), class-validator (backend) |
| Testing | Jest, Supertest, Playwright (E2E) |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend), Railway/Render (backend + DB), Upstash (Redis) |

## Architecture Map

```
Next.js Frontend (apps/web)
  -> Express.js API (apps/api)
    -> modules/{feature}/
         routes -> controller -> service -> repository
    -> Prisma ORM
    -> PostgreSQL
    -> Redis (cache + BullMQ jobs)
```

Backend layered architecture per module (`apps/api/src/modules/<feature>/`):

```
<feature>.routes.ts    # Express route definitions
<feature>.controller.ts  # Request/response handling
<feature>.service.ts     # Business logic
<feature>.repository.ts  # Prisma queries
<feature>.schema.ts      # Zod validation schemas
```

Shared middleware (`apps/api/src/middlewares/`): auth, role-based access, centralized error handling.
Shared libs (`apps/api/src/lib/`): Prisma client, Redis client.

## Commands

```
Build (all):     npm run build --workspaces
Build (api):     npm run build -w apps/api
Build (web):     npm run build -w apps/web

Dev (all):       npm run dev
Dev (api):       npm run dev:api
Dev (web):       npm run dev:web

Lint (web):      cd apps/web && npx eslint .
Lint (api):      (no lint script yet — add if needed)

Typecheck (api): cd apps/api && npx tsc --noEmit
Typecheck (web): cd apps/web && npx tsc --noEmit

DB generate:     cd apps/api && npx prisma generate
DB push:         cd apps/api && npx prisma db push
DB migrate:      cd apps/api && npx prisma migrate dev
DB studio:       cd apps/api && npx prisma studio
```

## Contract Points

- **Stock is never stored as a manually-updated column.** `current_stock` is always derived from `StockMovement` records: `SUM(IN, TRANSFER_IN, ADJUSTMENT_IN) - SUM(OUT, TRANSFER_OUT, ADJUSTMENT_OUT)`. Cached in Redis for dashboard performance.
- **Stock movements are append-only.** No DELETE endpoint for movements — audit trail must be preserved.
- **Stock transfers are atomic.** A transfer creates two movements (`TRANSFER_OUT` + `TRANSFER_IN`) in a single DB transaction — all succeed or all fail.
- **Stock opname requires Manager/ADMIN approval** before an `ADJUSTMENT` movement is created.
- **Roles**: `ADMIN`, `MANAGER`, `STAFF`. Authorization enforced at the API level, not just the UI.
- **PO statuses**: `DRAFT -> SUBMITTED -> PARTIALLY_RECEIVED -> COMPLETED -> CANCELLED`. Auto-updates when goods are received.
- **Validation**: Zod on frontend, class-validator on backend. All list endpoints require pagination.

## Edit / Safety Boundaries

- Do not manually edit Prisma migrations under `apps/api/prisma/migrations/` — use `prisma migrate`.
- Do not commit secrets (JWT keys, database URLs, Redis URLs). Environment variables only.
- Stock movement records must never have a DELETE endpoint.
- SKUs must be unique — enforced at the database level.

## Verification

After modifying backend modules:
1. Run targeted tests for the affected module.
2. Run compile/typecheck.
3. Run integration tests if the change crosses stock or PO boundaries.
4. Inspect the final diff for accidental unrelated changes.

After modifying frontend:
1. Run lint and typecheck.
2. Verify affected pages render and interact correctly with the API.

## Operating Rules

1. **Investigate before guessing.** Resolve uncertainties from code, tests, config, or this PRD rather than inventing answers.
2. **Follow the module pattern.** Every backend feature goes in `apps/api/src/modules/<feature>/` with routes -> controller -> service -> repository.
3. **Work one User Story at a time.** Reference PRD user stories (US-X.Y) for scope. One story = one focused task.
4. **Make the smallest correct change.** No unrelated cleanup unless required for correctness.
5. **Verify the result.** Run relevant tests/checks before declaring completion.

## Documentation Pointers

- Full PRD (requirements, data model, user stories): `docs/PRD-Inventory-Management-System-EN.md`
- Project initialization guide: `docs/init-PROJECT.md`
