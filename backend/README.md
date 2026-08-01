# HealNexus Backend

FastAPI service for HealNexus Continuity of Care.

See the root [`README.md`](../README.md) for full setup instructions.

```bash
python -m venv .venv
.\.venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

- API docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/api/v1/health

Uses **psycopg v3** (`postgresql+psycopg://...`) for PostgreSQL / Supabase.
