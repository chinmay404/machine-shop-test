# CNC Tool Management System

**Web App:** Next.js + React 18 + Tailwind CSS 3  
**Central API:** FastAPI  
**Database:** Externalized / service-owned  
**Auth:** Managed by the Next.js app

---

## Project Structure

```text
client/                  → Next.js web application
  pages/                 → Route entrypoints + internal auth API routes
  src/components/        → Shared UI
  src/features/          → Feature modules (Kanban, etc.)
  src/lib/api/           → Centralized external API client modules
  src/providers/         → App providers
  src/server/auth/       → Next-managed auth/session helpers

fastapi/                 → Central FastAPI service scaffold
  app/api/v1/endpoints/  → Versioned domain routers
  app/core/              → Settings and service config

backend/                 → Legacy Django reference (not part of the new target architecture)
```

## Quick Start

### 1. FastAPI Setup

```powershell
cd fastapi
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .
uvicorn app.main:app --reload --port 8001
```

### 2. Next.js App Setup

```powershell
cd client
copy .env.example .env.local
npm install
npm run dev
# Opens at http://localhost:3000
```

## Demo Credentials

| Username    | Password     | Role       |
|-------------|-------------|------------|
| admin       | admin123    | Admin      |
| op1         | operator123 | Operator   |
| supervisor1 | super123    | Supervisor |
| planner1    | plan123     | Planning   |
| store1      | store123    | Store      |

These are currently served by the Next.js auth layer in `client/pages/api/auth/*` so the web app is no longer coupled to Django auth.

## API Direction

- Next.js owns the user session and login flow.
- FastAPI owns business APIs and is addressed through `NEXT_PUBLIC_API_BASE_URL`.
- ERP integration should be implemented inside the FastAPI service, not directly from the browser.
- The `backend/` Django folder is now legacy reference material only.

## Pages

- **Dashboard** — Machine/component selector, tool slot list, BOM/shape/life panels, trial status
- **Tool Trial Form** — Light theme, existing vs new tool comparison, savings calculator
- **Running Trials** — Active trials table with status filters and summary cards
- **Planning Dashboard** — Tool consumption trends (Chart.js), planning data table, stat cards
- **Tool Library** — Master data CRUD with type filtering and search
- **Master Import** — Bulk import with editable table + import history
