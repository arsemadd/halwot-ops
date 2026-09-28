# Halwot Ops (HEC OS)

Internal Church Operations System for **Halwot Emmanuel Church**.

Not a public community app — an operations platform for people, ministries, programs, assets, and expenses.

## Stack

| Layer | Technology |
|-------|------------|
| API | Laravel + Sanctum + Spatie Permission |
| Web | React + Vite + TypeScript + Tailwind CSS |
| Database | MySQL in production; SQLite for local development |

## Monorepo layout

```text
halwot-ops/
  apps/api/       Laravel JSON API
  apps/web/       React SPA
  packages/shared Shared TypeScript types
  docs/           Operations map, roadmap, deploy notes
```

## Local development

### Prerequisites

- PHP 8.3+ with openssl, curl, mbstring, pdo_sqlite (or pdo_mysql), zip
- Composer
- Node 20+
- MySQL (production) or SQLite (default local)

### API

```bash
cd apps/api
cp .env.example .env   # if needed
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

Default accounts after seed:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@halwot.local` | `password` |
| Finance | `finance@halwot.local` | `password` |
| Member portal | `member@halwot.local` | `password` |

### Web

```bash
cd apps/web
npm install
npm run dev
```

Vite proxies `/api`, `/sanctum`, `/login`, and `/logout` to `http://localhost:8000`.

Open http://localhost:5173

## Modules

### Phase 1 — People & ministry

- Authentication & roles
- Members / registration / duplicate check
- Households
- Follow-up queue
- Ministries & serving
- Programs & attendance
- Dashboard KPIs
- Activity log, settings, roadmap

### Phase 2 — Operations

- Assets & locations
- Checkout lifecycle (request → approve → checkout → return)
- Expense workflow (draft → submitted → approved → paid → reconciled)
- Program budgets, tasks, and documents

### Phase 3 — Communications, finance, portal, reports

- Announcements (in-app broadcasts)
- Giving / tithes (finance-role only)
- Member portal (profile, schedules, RSVPs, serving confirmations)
- Reports & church intelligence

## Deploy

See [docs/deploy-pixelwel.md](docs/deploy-pixelwel.md) for `ops.pixelwel.com`.
