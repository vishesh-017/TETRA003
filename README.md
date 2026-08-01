# HealNexus

**Connecting Patients, Doctors & AI Beyond Hospital Walls.**

HealNexus is an AI-powered Continuity of Care platform that helps hospitals reduce avoidable readmissions by extending doctor-guided recovery beyond discharge — for patients, caregivers, and rural health workers.

> **Clinical safety:** AI never diagnoses, never prescribes, and never replaces doctors. AI only organizes, educates, monitors, summarizes, and assists.

Architecture blueprint: [`docs/HealNexus_SRS_Architecture.md`](docs/HealNexus_SRS_Architecture.md)

---

## Repository structure

```
HealNexus/
├── frontend/          # React 19 + Vite + TypeScript
├── backend/           # FastAPI + SQLAlchemy + Pydantic
├── docs/              # SRS / architecture / ADRs
├── assets/            # Shared static assets
├── .env.example
├── .gitignore
└── README.md
```

---

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui patterns, React Router, TanStack Query, RHF, Zod, Framer Motion, Recharts, Leaflet |
| Backend | FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| Auth | Supabase Auth (JWT verified in FastAPI) |
| Database | Supabase PostgreSQL |
| AI (later) | Exa AI |
| Deploy | Vercel (web) · Render (API) · Supabase (DB/Auth) |

---

## Prerequisites

- Node.js 20+
- Python 3.11+ (3.12–3.14 supported for scaffold)
- Supabase project (Auth + PostgreSQL) for full auth/DB
- Optional: Exa API key (AI phases)

---

## Quick start

### 1. Clone and configure

```bash
cd HealNexus
cp .env.example frontend/.env
cp backend/.env.example backend/.env
```

Fill in Supabase and database values in both env files.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

Without Supabase keys, use **Demo role entry** on the login page to explore role shells.

### 3. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

API: [http://127.0.0.1:8000](http://127.0.0.1:8000)  
Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
Health: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

---

## Required API keys / secrets

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | frontend | Public anon key |
| `SUPABASE_URL` | backend | Supabase project URL |
| `SUPABASE_ANON_KEY` | backend | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | Server-side admin (keep secret) |
| `SUPABASE_JWT_SECRET` | backend | Verify Bearer JWTs |
| `DATABASE_URL` | backend | PostgreSQL URL (`postgresql+psycopg://...`) |
| `EXA_API_KEY` | backend | Exa AI (later phases) |
| `SECRET_KEY` | backend | App secret |

Set user roles in Supabase `app_metadata.role` or `user_metadata.role`:

- `doctor`
- `patient`
- `caregiver`
- `health_worker`

---

## Roles & routes (scaffold)

| Role | Home route |
|---|---|
| Doctor | `/doctor` |
| Patient | `/patient` |
| Caregiver | `/caregiver` |
| Health Worker | `/rural` |

Shared: `/maps`, `/government/pmjay`

---

## What this scaffold includes

- Production-oriented folder structure (frontend + backend)
- Healthcare design system (blue / white / green, dark mode)
- Auth layout, app shell, sidebar, navbar
- Protected routes + role gates
- Supabase login/logout client flow
- FastAPI JWT verification + RBAC dependencies
- SQLAlchemy models for core domain entities
- Empty module pages wired to routing (business logic next)

## Explicitly not included yet

Business logic for care plans, AI Care Companion, risk engine, offline sync, analytics, and PM-JAY content — those follow the roadmap in the architecture document.

---

## Useful scripts

```bash
# Frontend
npm run dev
npm run build
npm run preview

# Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## License

Proprietary — HealNexus. All rights reserved unless otherwise stated.
