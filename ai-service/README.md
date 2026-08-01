# HealNexus AI Intelligence Platform

Enterprise **AI Care Companion** microservice.

> HealNexus is **not** an AI doctor. It never diagnoses, never prescribes, never changes doctor recommendations, and never makes medical decisions.

## Architecture

```
ai-service/
├── app/
│   ├── api/            # FastAPI routes + DI
│   ├── core/           # config, logging, errors, safety constants
│   ├── providers/      # Exa + curated fallback (swap without API changes)
│   ├── schemas/        # request/response contracts
│   ├── services/       # isolated AI modules
│   ├── data/           # curated education pack
│   ├── ml/             # future ML hooks
│   └── main.py
├── .env.example
├── requirements.txt
└── README.md
```

Clean architecture: **routes → services → providers**. No CRUD APIs.

## Modules

### Care Companion AI (`/ai/*`)

| Endpoint | Module |
|---|---|
| `POST /ai/care-companion` | Organize discharge → daily schedule JSON |
| `POST /ai/patient-summary` | 3–5 sentence assistive clinical summary |
| `POST /ai/health-assistant` | Exa-grounded education (+ sources) |
| `POST /ai/education` | Localized education (en / hi / gu) |
| `POST /ai/government-guidance` | PM-JAY guidance via curated + Exa |

### Predictive Intelligence Engine (`/predict/*`)

| Endpoint | Module |
|---|---|
| `POST /predict/recovery-score` | Recovery Score 0–100 + factors |
| `POST /predict/readmission` | Readmission % + explainable drivers |
| `POST /predict/disease-progression` | Condition worsening risk |
| `POST /predict/trends` | Trend detection + NL summaries |
| `POST /predict/lifestyle-simulation` | Before/after lifestyle counterfactuals |
| `POST /predict/alerts` | Alert decision policy |
| `POST /predict/explain` | Structured WHY attribution |

Rule-based now; XGBoost/RF can swap behind `app/prediction/models` without API changes.

Also: `GET /health`, `GET /docs`

## Run

```bash
cd ai-service
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
copy .env.example .env
# set EXA_API_KEY in .env (server-side only)

uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Frontend:

```env
VITE_AI_API_BASE_URL=http://127.0.0.1:8001
```

**Never** put `EXA_API_KEY` in the TypeScript webapp (`webapp/.env`) for production — keep secrets on this service only.

## Example

```bash
curl -X POST http://127.0.0.1:8001/ai/care-companion ^
  -H "Content-Type: application/json" ^
  -d "{\"diagnosis\":\"Type 2 Diabetes\",\"medicines\":\"Metformin 500mg twice daily\",\"diet_advice\":\"Low sugar\",\"follow_up_date\":\"2026-08-10\"}"
```

## Future ML

Implement predictors under `app/ml/` and inject into services. Keep `/ai/*` schemas stable.
