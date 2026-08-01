# HealNexus

**Connecting Patients, Doctors & AI Beyond Hospital Walls.**

TypeScript-first Continuity of Care platform. The main product lives in **`webapp/`** (React + business logic + Supabase). Python **`ai-service/`** is AI/ML only — never CRUD.

> **Clinical safety:** The AI Care Companion never diagnoses, never prescribes, and never replaces doctors.

---

## What runs where?

| Layer | Folder | Language | Responsibility |
|---|---|---|---|
| **Core product** | `webapp/` | **TypeScript** | UI, auth, doctor/patient modules, dynamic data store, Supabase CRUD |
| **Database** | `supabase/` | SQL | Schema + RLS |
| **AI / ML only** | `ai-service/` | Python (FastAPI) | Care Companion, summaries, Exa education, future predictions — **no CRUD** |

Yes: **main core is TypeScript.** Python changes are for the AI intelligence microservice only.

---

## Folder layout

```
HealNexus/
├── webapp/         # Main TypeScript product (not “just a UI”)
├── ai-service/     # Python AI/ML microservice only
├── supabase/       # Postgres migrations / RLS
├── docs/           # Architecture notes
├── assets/
├── .env.example
├── .gitignore
└── README.md
```

---

## Quick start (core app)

```bash
cd webapp
npm install
npm run dev
```

Open http://127.0.0.1:5173 → **Patient** or **Doctor** demo role.

Configure `webapp/.env`:

```env
VITE_APP_NAME=HealNexus
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AI_API_BASE_URL=http://127.0.0.1:8001
```

Without Supabase keys, the app uses a **dynamic local store** (tasks/medicines/check-ins persist).

---

## AI service (optional, Python)

Server-side only — keep `EXA_API_KEY` out of the browser:

```bash
cd ai-service
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
# set EXA_API_KEY in ai-service/.env
uvicorn app.main:app --reload --port 8001
```

Docs: http://127.0.0.1:8001/docs

---

## License

Proprietary — HealNexus.
