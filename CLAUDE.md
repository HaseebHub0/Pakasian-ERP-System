# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pakasian ERP System — a full-stack ERP for manufacturing/procurement/inventory management. Django REST API backend + React/TypeScript frontend.

## Repository Layout

```
Pakasian-ERP-System/
├── erp_system/        # Django backend
└── erp-frontend/      # React + Vite frontend
```

## Backend (erp_system/)

### Setup & Running

```bash
cd erp_system
python -m venv venv && source venv/Scripts/activate   # Windows
pip install -r requirements/development.txt
cp .env.example .env   # then fill in values
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# Celery worker (separate terminal)
celery -A config worker -l info

# Celery beat scheduler (separate terminal)
celery -A config beat -l info

# PostgreSQL + Redis via Docker (optional, dev uses SQLite by default)
docker-compose up -d
```

### Testing

```bash
pytest                            # all tests
pytest apps/procurement/          # single app
pytest -k test_purchase_order     # single test
pytest --cov=apps --cov-report=html
```

### Key Environment Variables (`.env`)

| Variable | Purpose |
|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.development` (default) or `production` |
| `SECRET_KEY` | Django secret key (min 50 chars) |
| `DB_*` | PostgreSQL connection (dev defaults to SQLite) |
| `REDIS_URL` / `CELERY_BROKER_URL` | Redis for Celery |
| `CORS_ALLOWED_ORIGINS` | Include `http://localhost:5173` for frontend |

### Architecture

**Settings:** `config/settings/base.py` → `development.py` / `production.py` split.

**Apps** live under `apps/` as business domain modules:

| App | Responsibility |
|---|---|
| `core` | `BaseModel` (UUID PK + auto timestamps), audit logs, permissions middleware |
| `authentication` | Custom `SystemUser` model, JWT login/logout/refresh, role-based permissions |
| `master_data` | Products, suppliers, raw materials, warehouses |
| `procurement` | Purchase requisitions → POs → GRN → QC → approvals |
| `inventory` | Stock ledger, batch management, transfers, picking, adjustments |
| `manufacturing` | Production orders, batch execution, batch tracing |
| `costing` | Batch cost calculations, SKU profitability |
| `sales` | Sales orders, dispatch, returns |
| `finance` | Journal entries, P&L, balance sheets |
| `mrp` | Demand forecasting, MRP plans |

**Within each app the layer order is:** `models` → `serializers` → `views` → `services` → `tasks` → `urls`

- Business logic belongs in `services.py`, not in views or models.
- Long-running operations go in `tasks.py` (Celery).
- All models should extend `core.models.BaseModel`.

**API:** RESTful, JWT-protected (`Authorization: Bearer <token>`), paginated at 20 items/page, filtered via `django-filter`.

## Frontend (erp-frontend/)

### Setup & Running

```bash
cd erp-frontend
npm install
npm run dev        # Vite dev server → http://localhost:5173
npm run build      # tsc -b && vite build
npm run lint       # ESLint
npm run preview    # preview production build
```

### Architecture

```
src/
├── api/           # Axios client (JWT interceptors) + domain API modules
├── components/    # layout/ (AppLayout, Sidebar, Topbar), forms/, ui/
├── pages/         # Route-level components organized by feature
├── store/         # Zustand stores (auth state)
├── hooks/         # Custom React hooks
└── utils/
```

**State:** Zustand for global auth state; TanStack React Query for server state + caching.

**Forms:** React Hook Form + Zod validation.

**Auth flow:** Login → JWT stored in localStorage → Axios interceptor attaches `Bearer` header → 401 triggers logout redirect.

The frontend has no test runner configured (ESLint only).

## Access Points (dev)

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/ |
| Django Admin | http://localhost:8000/admin/ |
