# Product Requirements Document (PRD)
## Inventory Management System (IMS)

| | |
|---|---|
| **Version** | 1.0 |
| **Date** | August 28, 2026 |
| **Status** | Draft — Ready for development (AI Agent-assisted) |
| **Product Owner** | [Your name] |
| **Document Purpose** | Full-stack portfolio project simulating an inventory system used by small-to-medium retail/warehouse businesses |

---

## 1. Background & Problem Statement

Small-to-medium retail/warehouse businesses often manage stock manually (spreadsheets/paper), which causes:
- Discrepancies between physical stock and system records (no audit trail).
- Stockouts with no early warning.
- No way to trace who changed stock data and when.
- No visibility across multiple warehouses/locations.

**IMS** solves this with a centralized system that records every stock movement in an auditable way, triggers automatic alerts, and provides dashboards for decision-making.

---

## 2. Goals

1. Provide **accurate, auditable** stock tracking (every stock change is logged and immutable).
2. Provide **real-time visibility** of stock levels across all warehouses.
3. Automate **low-stock alerts** and simplify the reorder process.
4. Support **role-based access** matching team responsibilities (Admin, Manager, Warehouse Staff).
5. Provide **reports** that support business decisions (fast/slow moving items, inventory value).

### Non-Goals (Out of scope for v1)
- Real-time POS/e-commerce integration (Shopee, Tokopedia, etc.).
- Multi-currency / multi-language support.
- Payment processing / customer invoicing.
- Native mobile app (v1 is responsive web only).

---

## 3. Target Users & Personas

| Persona | Role | Primary Needs |
|---|---|---|
| **Admin/Owner** | Manages the system, users, and views high-level reports | Full control, business insight |
| **Manager** | Manages POs, approvals, and stock analysis | Approval workflow, reports |
| **Warehouse Staff** | Daily operations (recording stock in/out) | Fast input, minimal errors |

---

## 4. User Stories & Acceptance Criteria

Format: `As a [persona], I want to [action], so that [goal]`

### Epic 1 — Authentication & User Management
| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-1.1 | As an Admin, I want to create new user accounts with a specific role, so that access matches responsibilities. | - Admin can create/edit/deactivate users<br>- Roles: `ADMIN`, `MANAGER`, `STAFF`<br>- Deactivated users cannot log in |
| US-1.2 | As a user, I want to log in with email & password, so that I can access the system according to my role. | - JWT access token (short-lived) + refresh token<br>- Redirect to role-appropriate dashboard after login |
| US-1.3 | As a user, I want to reset my password, so that I can regain access if I forget it. | - Email contains reset link (expires in 15 minutes) |

### Epic 2 — Master Data (Products, Categories, Warehouses, Suppliers)
| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-2.1 | As an Admin, I want to CRUD products (SKU, name, category, unit, reorder point), so that product data is centralized. | - SKU must be unique<br>- Required fields validated via Zod<br>- Soft delete (product is never removed from history) |
| US-2.2 | As an Admin, I want to CRUD product categories, so that products are organized. | - Categories can be nested (optional, v2) |
| US-2.3 | As an Admin, I want to CRUD warehouse/location data, so that stock can be managed per location. | - Each warehouse has a name & address |
| US-2.4 | As a Manager, I want to CRUD supplier data, so that POs link to the correct supplier. | - Supplier contact info is stored |

### Epic 3 — Stock Movement (Core Feature)
| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-3.1 | As Staff, I want to record **stock in** (incoming goods) referencing a PO, so that stock increases according to what was received. | - Select PO → select product → enter received qty<br>- System creates `StockMovement(type=IN)`<br>- If received qty ≠ ordered qty, it's recorded as a "partial receipt" |
| US-3.2 | As Staff, I want to record **stock out** (outgoing goods), so that stock decreases according to sales/usage. | - Validate sufficient stock before submit<br>- System creates `StockMovement(type=OUT)`<br>- Show a warning if resulting stock < reorder point |
| US-3.3 | As Staff, I want to **transfer stock** between warehouses, so that distribution is tracked. | - Creates 2 movements in one atomic transaction: `TRANSFER_OUT` at source, `TRANSFER_IN` at destination |
| US-3.4 | As Staff, I want to perform a **stock opname** (physical count), so that discrepancies between system and physical stock are detected. | - System shows `system_qty` vs entered `actual_qty`<br>- `variance` is auto-calculated<br>- Requires Manager approval before stock is adjusted (`StockMovement(type=ADJUSTMENT)`) |
| US-3.5 | As any user, I want to view the stock movement history per product, so that I can audit who changed what and when. | - Logs are append-only (cannot be edited/deleted)<br>- Filterable by date, warehouse, movement type, user |

### Epic 4 — Purchase Orders
| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-4.1 | As a Manager, I want to create a PO to a supplier, so that restocking is scheduled and tracked. | - PO status: `DRAFT → SUBMITTED → PARTIALLY_RECEIVED → COMPLETED → CANCELLED` |
| US-4.2 | As a Manager, I want the system to suggest products that need reordering, so that restocking is proactive. | - Query products where `current_stock <= reorder_point`<br>- Shown on dashboard as "Suggested Reorder" |
| US-4.3 | As Staff, I want to receive goods against a PO (see US-3.1), so that PO status updates automatically. | - When all PO items are fully received → status becomes `COMPLETED` |

### Epic 5 — Dashboard & Reports
| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-5.1 | As an Admin/Manager, I want to see a summary dashboard (total inventory value, low-stock item count, recent movements), so that I can make quick decisions. | - Data is cached (Redis), refreshed periodically |
| US-5.2 | As a Manager, I want to see a fast-moving vs slow-moving items report, so that I can optimize purchasing. | - Based on frequency/quantity of `StockMovement(type=OUT)` within a given period |
| US-5.3 | As an Admin, I want to export stock reports to CSV/Excel, so that they can be used for external audits. | - Minimum export: stock list per product per warehouse |

### Epic 6 — Notifications
| ID | User Story | Acceptance Criteria |
|---|---|---|
| US-6.1 | As a Manager, I want to receive an in-app notification when a product's stock falls below the reorder point, so that I can reorder promptly. | - Notification appears via bell icon on dashboard<br>- (Optional v2: email notification) |

---

## 5. Functional Requirements Summary

- **FR-1**: The system must prevent direct updates to stock columns; stock only changes through `StockMovement` records.
- **FR-2**: Every `StockMovement` must have `created_by`, `created_at`, `reference_type`, `reference_id`.
- **FR-3**: The system must enforce role-based authorization at the API level (not just the UI).
- **FR-4**: Stock transfers between warehouses must be atomic (use a DB transaction — all succeed or all fail).
- **FR-5**: Stock opname approval must be performed by a `MANAGER` or `ADMIN` role.

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Password hashing (bcrypt/argon2), JWT with refresh token rotation, input validation on all endpoints (Zod/class-validator) |
| **Performance** | Dashboard loads in < 2 seconds with Redis caching; pagination required on all list endpoints |
| **Auditability** | All stock movements are append-only (no DELETE endpoint for movements) |
| **Availability** | Deploy with a health check endpoint (`/health`) for monitoring |
| **Scalability** | Schema design supports adding warehouses/products without major migrations |
| **Testability** | Unit tests for critical business logic (stock calculation, transfer validation), at least 1 E2E test for the stock in/out flow |

---

## 7. Data Model (Entity Overview)

```
User            (id, name, email, password_hash, role, is_active)
Warehouse       (id, name, address, is_active)
Category        (id, name, parent_id?)
Product         (id, sku, name, category_id, unit, reorder_point, is_active)
Supplier        (id, name, contact_email, contact_phone, address)
PurchaseOrder   (id, supplier_id, status, created_by, created_at)
PurchaseOrderItem (id, po_id, product_id, qty_ordered, qty_received, unit_price)
StockMovement   (id, product_id, warehouse_id, type, quantity,
                  reference_type, reference_id, note, created_by, created_at)
StockOpname     (id, warehouse_id, status, created_by, created_at)
StockOpnameItem (id, opname_id, product_id, system_qty, actual_qty, variance)
Notification    (id, user_id, message, is_read, created_at)
```

**Key principle**: `current_stock` per product per warehouse is **always calculated**, never stored as a manually-updated column:

```
current_stock(product, warehouse) =
  SUM(quantity WHERE type IN ('IN','TRANSFER_IN','ADJUSTMENT_IN'))
  - SUM(quantity WHERE type IN ('OUT','TRANSFER_OUT','ADJUSTMENT_OUT'))
```

For dashboard performance, this calculation is cached in Redis and invalidated whenever a new movement is recorded.

---

## 8. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Data fetching (FE) | TanStack Query |
| Backend | Express.js (TypeScript), REST API + Swagger/OpenAPI (swagger-jsdoc + swagger-ui-express) |
| Database | PostgreSQL |
| ORM | Prisma |
| Cache/Queue | Redis + BullMQ (for low-stock alert jobs) |
| Auth | JWT (access + refresh token) |
| Validation | Zod (frontend), class-validator (backend) |
| Testing | Jest, Supertest, Playwright (E2E) |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend), Railway/Render (backend + DB), Upstash (Redis) |

### 8.1 Backend Architecture Convention

Unlike NestJS, Express does not enforce a project structure by default. To keep the codebase organized and consistent (and to make it easier for an AI Agent to follow the same pattern across features), the backend should follow a **layered architecture**:

```
apps/api/src/
├── modules/
│   └── product/
│       ├── product.routes.ts       # Express route definitions
│       ├── product.controller.ts   # Request/response handling
│       ├── product.service.ts      # Business logic
│       ├── product.repository.ts   # Prisma queries
│       └── product.schema.ts       # Zod validation schemas
├── middlewares/
│   ├── auth.middleware.ts          # JWT verification
│   ├── role.middleware.ts          # Role-based access guard
│   └── error.middleware.ts         # Centralized error handler
├── lib/
│   ├── prisma.ts                   # Prisma client instance
│   └── redis.ts                    # Redis client instance
└── app.ts                          # Express app setup
```

Every module (product, warehouse, stock-movement, purchase-order, etc.) follows the same `routes → controller → service → repository` pattern. This keeps responsibilities separated (routing vs. business logic vs. data access) even without a framework enforcing it, and gives the AI Agent a clear, repeatable pattern to follow for every new feature.

---

## 9. Delivery Phases (Milestones)

### Phase 0 — Setup & Foundation
- Set up monorepo/folder structure, database schema (Prisma), auth (login/register), role guard.

### Phase 1 — MVP (Main Portfolio Focus)
- Epic 1 (Auth), Epic 2 (Master Data), Epic 3 (Stock In/Out/Transfer), US-3.5 (movement history).
- Simple dashboard: total products, total stock value, low-stock list.

### Phase 2 — Advanced Features
- Epic 4 (full Purchase Order flow), US-3.4 (Stock Opname + approval), Epic 5 (advanced reports + export), Epic 6 (notifications).

### Phase 3 — Portfolio Polish
- Testing (unit + E2E), API documentation (Swagger), README with architecture diagram, deployment, demo video/GIF.

> **Note for working with an AI Agent**: Work **Epic by Epic, User Story by User Story** — don't ask the agent to generate the entire application at once. Provide this PRD as context at the start, then break down each session into 1 user story = 1 task (e.g., "implement US-3.1 stock in according to the acceptance criteria in this PRD"). This keeps the agent's output focused and easy to review.

---

## 10. Success Metrics (for Portfolio Purposes)

- All acceptance criteria in Phase 1 & 2 are met and can be demoed end-to-end.
- The application is deployed and publicly accessible (live demo link).
- API documentation (Swagger) and a README explaining the architecture exist.
- There is minimum test coverage for critical business logic (stock calculation, transfer validation).

---

## 11. Out of Scope (v1)

- Payment/invoicing integration.
- Multi-tenant support (SaaS for multiple companies at once).
- Native mobile app.
- Barcode scanning hardware integration (manual SKU entry only in v1).
