# HealNexus — Software Requirements Specification & Technical Architecture Document

**Version:** 1.0.0  
**Status:** Master Blueprint (Authoritative)  
**Date:** 1 August 2026  
**Classification:** Internal Product Engineering  
**Tagline:** *Connecting Patients, Doctors & AI Beyond Hospital Walls.*

---

## Document Control

| Field | Value |
|---|---|
| Product | HealNexus |
| Document type | SRS + Technical Architecture |
| Audience | Product, Engineering, Design, QA, DevOps |
| Scope | Production-quality healthcare Continuity of Care SaaS |
| Constraint | AI never diagnoses, never prescribes, never replaces doctors |
| Deployment targets | Frontend → Vercel · Backend → Render · DB/Auth → Supabase |

**Change policy:** This document is the source of truth for implementation. Feature work must map to a section herein. Deviations require an ADR (Architecture Decision Record) under `docs/adr/`.

---

# 1. Overall System Architecture

## 1.1 Product Intent

HealNexus is an AI-assisted **Continuity of Care** platform that extends clinical oversight beyond discharge. Hospitals typically lose visibility after a patient leaves. HealNexus keeps doctors in control while patients, caregivers, and rural health workers (ASHA / ANM) participate in structured recovery monitoring—reducing avoidable readmissions through follow-up management, early risk signals, localized education, PM-JAY guidance, ABDM-compatible (demo) records, and offline rural screening.

## 1.2 Architectural Style

| Layer | Style | Rationale |
|---|---|---|
| Client apps | SPA (React 19 + Vite) | Role-based modules, fast iteration, rich UX |
| API | BFF-style REST (FastAPI) | Clear contracts, OpenAPI, Pydantic validation |
| Auth | Supabase Auth (JWT) | Managed identity, RLS-friendly PostgreSQL |
| Data | Supabase PostgreSQL | Managed Postgres, Row Level Security |
| AI | Exa AI + internal orchestration | Retrieval + explanation; never clinical authority |
| ML | Rule engine → RF/XGBoost | Explainable risk scores with doctor override |
| Offline | Local store + sync queue | Rural health worker resilience |
| Maps | Leaflet + OpenStreetMap | Hospital finder (Ahmedabad focus initially) |

## 1.3 High-Level System Context

```
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│     Doctor       │   │     Patient      │   │    Caregiver     │   │ Rural Worker     │
│   Web Client     │   │   Web Client     │   │   Web Client     │   │ (Offline-first)  │
└────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
         │                      │                      │                      │
         └──────────────────────┴──────────┬───────────┴──────────────────────┘
                                           │ HTTPS / JWT
                              ┌────────────▼────────────┐
                              │  HealNexus API (FastAPI) │
                              │         Render           │
                              └─────┬─────┬─────┬───────┘
                 ┌──────────────────┤     │     ├──────────────────┐
                 ▼                  ▼     ▼     ▼                  ▼
        ┌────────────┐    ┌────────────┐ ┌──────────┐    ┌────────────────┐
        │ Supabase   │    │ Supabase   │ │ Exa AI   │    │ ML Service     │
        │ Auth       │    │ PostgreSQL │ │ (LLM/RAG)│    │ (Rules → XGB)  │
        └────────────┘    └────────────┘ └──────────┘    └────────────────┘
                 ▲                  ▲
                 │                  │
        ┌────────┴──────────────────┴────────┐
        │ Optional: Object Storage (summaries │
        │ PDFs, discharge uploads)            │
        └────────────────────────────────────┘
```

## 1.4 Core Domain Bounded Contexts

1. **Identity & Access** — roles, sessions, invitations, ABHA demo linkage  
2. **Clinical Continuity** — discharge, care plans, medicines, appointments, tasks  
3. **Monitoring & Escalation** — check-ins, adherence, trends, risk, alerts  
4. **Patient Passport** — longitudinal identity, QR, emergency data  
5. **Government Services** — PM-JAY guidance, ABDM-compatible import (demo)  
6. **Rural Care** — offline screening, sync, local language education  
7. **Intelligence** — Care Companion, Health Assistant, summaries, explanations  
8. **Geo Services** — Ahmedabad hospital finder, directions  
9. **Analytics & Reporting** — adherence, trends, weekly AI report, PDF export  

## 1.5 Non-Negotiable Clinical Safety Boundary

| AI / System MAY | AI / System MUST NOT |
|---|---|
| Organize discharge into schedules/tasks | Diagnose disease |
| Educate in plain language | Prescribe or alter medicines |
| Predict deterioration / readmission risk | Replace clinician judgment |
| Summarize for doctor review | Auto-escalate treatment changes |
| Monitor trends & adherence | Issue clinical orders without doctor |

All AI outputs are labeled **Assistive — for clinician / educational use**. Risk scores are advisory. Escalation notifies humans; it does not autonomously change therapy.

## 1.6 Quality Attributes (Production Targets)

| Attribute | Target |
|---|---|
| Availability | 99.5% API (initial SaaS); graceful offline for rural module |
| Latency (p95 API) | < 400ms non-AI; AI endpoints < 8s with streaming where possible |
| Security | JWT + RLS + least privilege; audit log for clinical events |
| Accessibility | WCAG 2.1 AA for core flows |
| i18n | English + Gujarati (phase 1 rural); Hindi next |
| Auditability | Immutable audit trail for discharge, risk, escalation |
| Compliance posture | ABDM-compatible design; DPDP-aware data handling (India) |

---

# 2. Complete Folder Structure

```
HealNexus/
├── docs/
│   ├── HealNexus_SRS_Architecture.md      # This document
│   ├── adr/                               # Architecture Decision Records
│   ├── api/
│   │   └── openapi.yaml                   # Generated / curated OpenAPI
│   └── diagrams/                          # Exported ERDs, C4 diagrams
│
├── apps/
│   └── web/                               # React 19 + Vite SPA
│       ├── public/
│       ├── index.html
│       ├── package.json
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── components.json                # shadcn/ui
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           ├── vite-env.d.ts
│           ├── assets/
│           ├── styles/
│           │   └── globals.css
│           ├── app/
│           │   ├── providers/             # Query, Auth, Theme, Toast
│           │   ├── router/
│           │   │   ├── index.tsx
│           │   │   ├── guards.tsx
│           │   │   └── routes.*.tsx
│           │   └── layouts/
│           │       ├── AppShell.tsx
│           │       ├── AuthLayout.tsx
│           │       └── RoleLayout.tsx
│           ├── modules/                   # Feature modules (domain-first)
│           │   ├── auth/
│           │   ├── doctor/
│           │   ├── patient/
│           │   ├── caregiver/
│           │   ├── rural/
│           │   ├── passport/
│           │   ├── government/
│           │   ├── maps/
│           │   ├── analytics/
│           │   └── ai-assistant/
│           ├── components/                # Shared UI only
│           │   ├── ui/                    # shadcn primitives
│           │   ├── feedback/              # Empty, Error, Skeleton
│           │   ├── forms/
│           │   ├── charts/
│           │   └── maps/
│           ├── features/                  # Cross-cutting feature widgets
│           ├── hooks/
│           ├── lib/
│           │   ├── supabase.ts
│           │   ├── api-client.ts
│           │   ├── query-keys.ts
│           │   ├── i18n.ts
│           │   └── utils.ts
│           ├── stores/                    # Lightweight client stores
│           ├── types/
│           └── config/
│               ├── env.ts
│               └── constants.ts
│
├── services/
│   └── api/                               # FastAPI backend
│       ├── pyproject.toml / requirements.txt
│       ├── alembic.ini                    # Optional migrations
│       ├── alembic/
│       ├── app/
│       │   ├── main.py
│       │   ├── core/
│       │   │   ├── config.py
│       │   │   ├── security.py
│       │   │   ├── logging.py
│       │   │   └── exceptions.py
│       │   ├── db/
│       │   │   ├── session.py
│       │   │   ├── base.py
│       │   │   └── rls_policies.sql
│       │   ├── models/                    # SQLAlchemy
│       │   ├── schemas/                   # Pydantic
│       │   ├── api/
│       │   │   ├── deps.py
│       │   │   ├── v1/
│       │   │   │   ├── router.py
│       │   │   │   ├── auth.py
│       │   │   │   ├── doctors.py
│       │   │   │   ├── patients.py
│       │   │   │   ├── caregivers.py
│       │   │   │   ├── rural.py
│       │   │   │   ├── discharge.py
│       │   │   │   ├── care_plans.py
│       │   │   │   ├── checkins.py
│       │   │   │   ├── medicines.py
│       │   │   │   ├── appointments.py
│       │   │   │   ├── alerts.py
│       │   │   │   ├── passport.py
│       │   │   │   ├── government.py
│       │   │   │   ├── maps.py
│       │   │   │   ├── analytics.py
│       │   │   │   ├── ai.py
│       │   │   │   ├── ml.py
│       │   │   │   └── sync.py
│       │   │   └── health.py
│       │   ├── services/                  # Business logic
│       │   ├── repositories/
│       │   ├── integrations/
│       │   │   ├── supabase_auth.py
│       │   │   ├── exa_client.py
│       │   │   └── storage.py
│       │   ├── ml/
│       │   │   ├── rules/
│       │   │   ├── features/
│       │   │   ├── models/                # Serialized later
│       │   │   └── explain.py
│       │   └── workers/                   # Background jobs (optional)
│       └── tests/
│
├── packages/                              # Optional shared contracts later
│   └── contracts/                         # OpenAPI types / shared Zod mirrors
│
├── scripts/
│   ├── seed/
│   └── ops/
│
├── .github/workflows/
├── .env.example
├── README.md
└── LICENSE
```

---

# 3. Frontend Architecture

## 3.1 Principles

1. **Domain modules over page dumps** — each role/feature owns routes, screens, hooks, schemas.  
2. **Server state via TanStack Query** — API data is not duplicated in Redux-like stores.  
3. **Form state via React Hook Form + Zod** — validation at the edge.  
4. **UI kit via shadcn/ui + Tailwind** — consistent healthcare design system.  
5. **Motion with intent** — Framer Motion for hierarchy and presence, not decoration spam.  
6. **Role-gated routing** — Doctor / Patient / Caregiver / Rural Worker shells.  
7. **Offline-capable rural module** — IndexedDB (or equivalent) + sync queue.

## 3.2 Application Layers

```
UI Screens (modules/*)
        ↓
Feature Hooks (usePatientDashboard, useRiskAlerts…)
        ↓
TanStack Query + API Client
        ↓
Supabase Auth Session (JWT)
        ↓
FastAPI /v1/*
```

## 3.3 Role Shells

| Role | Shell | Primary home |
|---|---|---|
| Doctor | Clinical AppShell (sidebar) | High-Risk + Monitoring Dashboard |
| Patient | Patient AppShell (bottom nav mobile) | Today's Tasks + Check-in |
| Caregiver | Caregiver AppShell | Patient Status + Alerts |
| Rural Worker | Offline-first Shell | Screening + Sync status |

## 3.4 Design System Tokens (Conceptual)

| Token family | Direction |
|---|---|
| Color | Clinical blue primary, white surfaces, recovery green accents |
| Radius | Soft rounded cards (not harsh squares; not pill-everything) |
| Elevation | Soft shadows; low visual noise |
| Typography | Professional healthcare sans; clear hierarchy; readable medical content |
| Density | Comfortable clinical density; mobile-first for patient/rural |

**Theme keywords:** Modern · Minimal · Apple-level polish · Professional healthcare · Blue + White + Green · Responsive · Accessible · Fast.

## 3.5 Key Frontend Libraries Mapping

| Library | Use |
|---|---|
| React 19 + Vite + TS | App runtime |
| Tailwind + shadcn/ui | Design system |
| React Router | Routing / guards |
| TanStack Query | Server cache, mutations, invalidation |
| RHF + Zod | Forms & validation |
| Framer Motion | Micro-interactions |
| Recharts | Adherence & trend charts |
| Leaflet | Hospital maps |

## 3.6 Error & Empty States

Every module defines: Loading skeleton · Empty state · Permission denied · Offline banner · AI disclaimer footer on AI surfaces.

---

# 4. Backend Architecture

## 4.1 Principles

1. **Thin routers, fat services** — HTTP layer validates and delegates.  
2. **Pydantic at boundaries** — request/response schemas never leak ORM objects.  
3. **Repository pattern** — SQLAlchemy access isolated for testability.  
4. **Idempotent writes** where rural sync is involved (`client_mutation_id`).  
5. **Async AI calls** — timeouts, retries with backoff, safe fallbacks.  
6. **Audit every clinical mutation** — who/what/when/why.  
7. **Versioned API** — `/api/v1/...` only.

## 4.2 Request Pipeline

```
Client → CORS → Auth JWT verify (Supabase JWKS)
      → Role dependency → Pydantic validation
      → Service → Repository → PostgreSQL
      → Optional AI/ML services
      → Response schema + audit log
```

## 4.3 Service Catalog (Logical)

| Service | Responsibility |
|---|---|
| `AuthService` | Profile bootstrap, role binding |
| `PatientService` | Patient CRUD under doctor care |
| `DischargeService` | Upload / manual entry / parse pipeline |
| `CareCompanionService` | Orchestrates Exa AI → care plan draft |
| `CarePlanService` | Persist medicines, tasks, follow-ups, appointments |
| `CheckInService` | Daily health check-ins |
| `AdherenceService` | Medicine take/skip events |
| `RiskService` | Rule/ML scoring + explanation |
| `EscalationService` | Thresholds → alerts → notify roles |
| `PassportService` | Passport + QR payload |
| `GovernmentService` | PM-JAY content + ABHA demo import |
| `RuralSyncService` | Offline push/pull reconciliation |
| `MapsService` | Hospital catalog / filters |
| `AnalyticsService` | Aggregations + weekly report + PDF |
| `AiAssistantService` | Chat/Q&A with safety rails |
| `AuditService` | Immutable event writing |

## 4.4 Background Processing (Phase Plan)

| Phase | Mechanism | Jobs |
|---|---|---|
| MVP | Inline / asyncio tasks | Care plan generation, risk recompute on check-in |
| Growth | Queue (Redis/RQ or Render cron) | Weekly reports, notification digests, model batch |

## 4.5 Backend Package Conventions

- `api/v1/*` — transport  
- `schemas/*` — DTOs  
- `models/*` — persistence  
- `services/*` — domain rules  
- `integrations/*` — external systems  
- `ml/*` — prediction pipeline  

---

# 5. Database Schema

## 5.1 Design Rules

- UUID primary keys (`gen_random_uuid()`).  
- `created_at` / `updated_at` on all mutable tables.  
- Soft delete (`deleted_at`) for clinical entities.  
- Doctor–patient relationship is explicit (`care_relationships`).  
- AI outputs stored as **drafts** until doctor accepts/edits.  
- Risk scores versioned with model/rule version.  
- Sync tables support rural offline idempotency.

## 5.2 Core Tables (Logical Schema)

### Identity

**profiles**  
`id (uuid, PK = auth.users.id)` · `role` · `full_name` · `phone` · `locale` · `avatar_url` · timestamps

**doctor_profiles**  
`profile_id` · `registration_no` · `specialty` · `hospital_affiliation` · `verified`

**patient_profiles**  
`profile_id` · `date_of_birth` · `sex` · `blood_group` · `abha_id_demo` · `address_json`

**caregiver_profiles**  
`profile_id` · `relationship_type`

**rural_worker_profiles**  
`profile_id` · `worker_type (ASHA|ANM)` · `phc_code` · `district` · `languages[]`

### Relationships

**care_relationships**  
`id` · `doctor_id` · `patient_id` · `status (active|ended)` · `started_at` · `ended_at`

**caregiver_assignments**  
`id` · `caregiver_id` · `patient_id` · `is_primary` · `status`

**rural_assignments**  
`id` · `worker_id` · `patient_id` · `status`

### Clinical Continuity

**discharge_summaries**  
`id` · `patient_id` · `doctor_id` · `source (upload|manual)` · `raw_text` · `file_url` · `diagnosis_text` · `procedure_text` · `discharge_date` · `hospital_name` · `status`

**care_plans**  
`id` · `patient_id` · `doctor_id` · `discharge_id` · `status (ai_draft|doctor_approved|active|completed)` · `ai_model_meta` · `approved_at`

**medicines**  
`id` · `care_plan_id` · `name` · `dose` · `frequency` · `route` · `schedule_json` · `start_date` · `end_date` · `instructions`

**daily_tasks**  
`id` · `care_plan_id` · `title` · `description` · `cadence` · `priority` · `active`

**followups**  
`id` · `care_plan_id` · `title` · `due_at` · `type` · `completed_at`

**appointments**  
`id` · `patient_id` · `doctor_id` · `scheduled_at` · `location` · `status` · `reminder_offsets`

**caregiver_instructions**  
`id` · `care_plan_id` · `content` · `locale`

### Monitoring

**health_checkins**  
`id` · `patient_id` · `recorded_by (patient|caregiver|rural)` · `recorded_at` · `symptoms_json` · `vitals_json` · `pain_score` · `notes` · `client_mutation_id`

**medicine_events**  
`id` · `medicine_id` · `patient_id` · `status (taken|skipped|missed)` · `scheduled_for` · `acted_at` · `client_mutation_id`

**task_completions**  
`id` · `task_id` · `patient_id` · `completed_at` · `client_mutation_id`

### Intelligence & Risk

**ai_generations**  
`id` · `entity_type` · `entity_id` · `purpose` · `prompt_meta` · `output_json` · `disclaimer` · `created_by`

**risk_scores**  
`id` · `patient_id` · `score (0-100)` · `level (low|moderate|high|critical)` · `model_version` · `features_json` · `explanation_json` · `computed_at`

**alerts**  
`id` · `patient_id` · `type` · `severity` · `title` · `body` · `status (open|acked|resolved)` · `triggered_by` · `notified_roles[]`

**escalations**  
`id` · `alert_id` · `patient_id` · `doctor_id` · `reason` · `state` · `sla_due_at`

### Passport & Government

**patient_passports**  
`id` · `patient_id` · `qr_token` · `emergency_contacts_json` · `allergies_json` · `history_json` · `current_meds_snapshot`

**pmjay_guidance_cache** (content/CMS-like or curated)  
`id` · `topic` · `locale` · `content_md` · `updated_at`

**abha_imports_demo**  
`id` · `patient_id` · `abha_id` · `payload_json` · `imported_at` · `source = demo`

### Rural Offline

**screening_sessions**  
`id` · `worker_id` · `patient_id nullable` · `payload_json` · `captured_at` · `sync_state`

**sync_mutations**  
`id` · `client_mutation_id UNIQUE` · `actor_id` · `entity_type` · `payload_json` · `applied_at` · `conflict_state`

### Geo & Analytics

**hospitals**  
`id` · `name` · `type (govt|pmjay|emergency|private)` · `lat` · `lng` · `address` · `city` · `pmjay_empanelled` · `phone`

**weekly_reports**  
`id` · `patient_id` · `week_start` · `metrics_json` · `ai_narrative` · `pdf_url`

**audit_logs**  
`id` · `actor_id` · `action` · `entity_type` · `entity_id` · `before_json` · `after_json` · `ip` · `created_at`

**notifications**  
`id` · `user_id` · `channel` · `title` · `body` · `read_at` · `meta_json`

---

# 6. Entity Relationship Diagram (Text)

```
profiles 1──1 doctor_profiles
profiles 1──1 patient_profiles
profiles 1──1 caregiver_profiles
profiles 1──1 rural_worker_profiles

doctor_profiles 1──* care_relationships *──1 patient_profiles
caregiver_profiles 1──* caregiver_assignments *──1 patient_profiles
rural_worker_profiles 1──* rural_assignments *──1 patient_profiles

patient_profiles 1──* discharge_summaries
doctor_profiles 1──* discharge_summaries
discharge_summaries 1──0..1 care_plans
care_plans 1──* medicines
care_plans 1──* daily_tasks
care_plans 1──* followups
care_plans 1──* caregiver_instructions
patient_profiles 1──* appointments *──1 doctor_profiles

patient_profiles 1──* health_checkins
patient_profiles 1──* medicine_events
patient_profiles 1──* risk_scores
patient_profiles 1──* alerts 1──0..* escalations
patient_profiles 1──1 patient_passports
patient_profiles 1──* abha_imports_demo
patient_profiles 1──* weekly_reports

medicines 1──* medicine_events
daily_tasks 1──* task_completions
alerts *──* notifications (via user fan-out)

rural_worker_profiles 1──* screening_sessions
profiles 1──* sync_mutations
profiles 1──* audit_logs
hospitals (reference catalog for maps)
```

**Cardinality notes**
- A patient may have multiple discharges over time; one **active** care plan at a time (enforced in service layer).  
- Risk scores are append-only history; dashboards read latest.  
- AI generations attach to discharge/care_plan/report entities for explainability.

---

# 7. Authentication Flow

## 7.1 Identity Provider

**Supabase Auth** issues JWTs. FastAPI validates JWT signature/audience/issuer. Application `profiles.role` is the authorization source of truth (not raw JWT custom claims alone).

## 7.2 Supported Auth Paths (MVP)

1. Email + password (primary for doctors / web)  
2. Magic link / OTP phone (preferred for patients/caregivers where feasible)  
3. Invited onboarding (doctor invites patient/caregiver)

## 7.3 Sequence — Doctor Login → Session

```
Doctor → Supabase Auth (credentials)
      → JWT + refresh session (client)
      → GET /api/v1/me (FastAPI validates JWT)
      → Ensure profiles row exists / role=doctor
      → Client stores session (Supabase SDK)
      → Role router loads Doctor shell
```

## 7.4 Sequence — Patient Onboarding via Doctor

```
Doctor creates patient stub (phone/name)
      → System creates invite token / link
Patient opens invite → registers/logs in
      → care_relationship activated
      → Optional passport bootstrap
```

## 7.5 Authorization Model (RBAC)

| Role | Capabilities (summary) |
|---|---|
| Doctor | Manage patients, discharge, approve care plans, view risk, acknowledge escalations |
| Patient | Own check-ins, tasks, medicines, appointments, passport (self), education |
| Caregiver | View assigned patient status, adherence, alerts, appointments; limited check-in assist |
| Rural Worker | Offline screening, sync, education delivery, limited vitals capture |
| Admin (later) | Catalog hospitals, content, user verification |

**Row-level rules (conceptual):**
- Doctors see only patients in `care_relationships.active`  
- Caregivers see only assigned patients  
- Patients see only self  
- Rural workers see assigned catchment patients  

## 7.6 Session Security

- Short-lived access tokens; refresh rotation via Supabase  
- HTTPS only  
- CSRF not applicable to pure Bearer API; still harden cookie usage if any  
- Logout clears local session + query cache  

---

# 8. User Journeys

## 8.1 Doctor — Continuity Activation (Primary Happy Path)

1. Doctor logs in → Dashboard  
2. Creates/selects patient  
3. Uploads discharge PDF/text **or** manual entry  
4. Invokes **AI Care Companion** → structured draft (meds, tasks, follow-ups, appointments, caregiver instructions)  
5. Doctor reviews/edits → **Approves** care plan (AI draft never auto-activates)  
6. Patient/caregiver receive activation notifications  
7. Doctor monitors adherence + check-ins on Patient Monitoring  
8. High-risk list updates when Prediction Engine raises level  
9. Doctor intervenes early (call/appointment/instruction update)

## 8.2 Patient — Home Recovery Loop

1. Receives care plan activation  
2. Sees Today's Tasks + Medicine Reminder + Appointment Reminder  
3. Completes Daily Health Check-in  
4. Receives educational nudges (localized)  
5. If risk rises: sees non-alarmist guidance to contact caregiver/doctor / seek care — **no diagnosis**  
6. Notification Center consolidates reminders and alerts  

## 8.3 Caregiver — Support Loop

1. Views Patient Status (adherence, last check-in, risk band)  
2. Helps mark medicines / notes symptoms if patient cannot  
3. Receives escalation alerts  
4. Tracks appointments  

## 8.4 Rural Health Worker — Offline Screening

1. Opens Health Worker Mode offline  
2. Captures screening vitals/symptoms in local language  
3. Queues mutations locally  
4. On connectivity: Sync → server applies idempotently  
5. Conflicts surface for review (last-write with clinical precedence rules)  
6. Delivers AI Caregiver Education content cached locally  

## 8.5 Government Guidance Journey

1. User opens PM-JAY Guidance  
2. Views eligibility, benefits, documents, nearby empaneled hospitals  
3. Optional ABHA demo import populates passport/history fields (clearly labeled Demo)

## 8.6 Emergency / High Risk Journey

```
Check-in / missed meds / worsening vitals
 → Feature extraction
 → Risk score + explanation
 → If threshold breached:
      → Alert created
      → Doctor High Risk Dashboard updates
      → Caregiver notified
      → Optional rural worker notify
 → Human early intervention
 → Reduced avoidable readmission (outcome goal)
```

---

# 9. API Planning

## 9.1 Conventions

- Base: `/api/v1`  
- Nouns plural: `/patients`, `/care-plans`  
- Actions as subresources: `/care-plans/{id}/approve`  
- Filtering: `?status=&page=&page_size=`  
- Errors: RFC7807-like `{ "type","title","status","detail","code" }`  
- Idempotency header for sync: `Idempotency-Key`  

## 9.2 Endpoint Map (MVP → Phase 2)

### Auth / Me
- `GET /me`  
- `PATCH /me`  
- `POST /me/onboarding`

### Doctors / Patients
- `GET /doctors/dashboard`  
- `GET /doctors/high-risk`  
- `GET /patients` · `POST /patients` · `GET /patients/{id}`  
- `GET /patients/{id}/history`  
- `GET /patients/{id}/monitoring`

### Discharge & Care Companion
- `POST /patients/{id}/discharge-summaries` (multipart or JSON)  
- `POST /discharge-summaries/{id}/manual`  
- `POST /discharge-summaries/{id}/care-companion` → AI draft  
- `GET /care-plans/{id}`  
- `PATCH /care-plans/{id}`  
- `POST /care-plans/{id}/approve`

### Patient Daily Ops
- `GET /patients/me/today`  
- `POST /checkins`  
- `GET /medicines/today`  
- `POST /medicine-events`  
- `GET /appointments`  
- `GET /notifications` · `POST /notifications/{id}/read`

### Caregiver
- `GET /caregiver/patients`  
- `GET /caregiver/patients/{id}/status`  
- `GET /caregiver/alerts`

### AI
- `POST /ai/assistant/chat`  
- `POST /ai/patient-summary/{patient_id}`  
- `POST /ai/education`  
- `GET /ai/explanations/risk/{risk_score_id}`

### ML / Risk
- `POST /ml/risk/recompute/{patient_id}` (internal/doctor)  
- `GET /patients/{id}/risk/latest`  
- `GET /patients/{id}/risk/history`

### Alerts / Escalation
- `GET /alerts` · `POST /alerts/{id}/ack` · `POST /alerts/{id}/resolve`

### Passport
- `GET /passport/me` · `PATCH /passport/me`  
- `GET /passport/qr/{token}` (controlled public emergency view)

### Government
- `GET /government/pmjay/guidance`  
- `GET /government/pmjay/hospitals`  
- `POST /government/abha/import-demo`

### Rural Sync
- `POST /sync/push`  
- `POST /sync/pull`  
- `GET /sync/status`

### Maps
- `GET /maps/hospitals` (filters: type, pmjay, emergency, bbox)

### Analytics
- `GET /analytics/adherence`  
- `GET /analytics/trends`  
- `GET /analytics/weekly-report`  
- `POST /analytics/weekly-report/export-pdf`

### System
- `GET /health` · `GET /ready`

## 9.3 Pagination & Sorting Standard

```
{ "data": [...], "page": 1, "page_size": 20, "total": 123 }
```

Default sort: `created_at desc` unless domain requires chronological clinical order.

---

# 10. Component Hierarchy

## 10.1 Global

```
App
 ├─ Providers (Auth, Query, Theme, I18n, Toast)
 └─ Router
     ├─ AuthLayout → Login / Invite Accept
     └─ RoleLayout
         ├─ DoctorRoutes
         ├─ PatientRoutes
         ├─ CaregiverRoutes
         └─ RuralRoutes
```

## 10.2 Doctor Module Hierarchy

```
DoctorShell
 ├─ TopBar (search patient, notifications)
 ├─ Sidebar (Dashboard, Patients, High Risk, Maps, Settings)
 └─ Outlet
     ├─ DoctorDashboard
     │   ├─ RiskSummaryCards
     │   ├─ NeedsAttentionList
     │   └─ UpcomingFollowups
     ├─ PatientList → PatientDetail
     │   ├─ PatientHeader
     │   ├─ HistoryTimeline
     │   ├─ DischargePanel (Upload | Manual)
     │   ├─ CareCompanionReview
     │   ├─ MonitoringCharts
     │   └─ AiPatientSummary
     └─ HighRiskDashboard
         ├─ RiskTable
         └─ EscalationDrawer
```

## 10.3 Patient Module Hierarchy

```
PatientShell
 ├─ TodayHome
 │   ├─ TaskList
 │   ├─ MedicineTimeline
 │   ├─ AppointmentCard
 │   └─ CheckInCTA
 ├─ CheckInWizard
 ├─ NotificationCenter
 └─ PassportQuickView
```

## 10.4 Shared Atomic → Organism Map

`ui/*` (atoms) → `forms/*` `charts/*` `maps/*` (molecules) → module screens (organisms/templates).

---

# 11. State Management Strategy

| State type | Tool | Examples |
|---|---|---|
| Server/cache | TanStack Query | Patients, care plans, risk, alerts |
| Form | RHF + Zod | Discharge entry, check-in, profile |
| Auth session | Supabase client + thin AuthProvider | JWT user, role |
| UI ephemeral | React local state / URL search params | Filters, drawers, tabs |
| Cross-route UI | Zustand (optional, minimal) | Sidebar collapsed, offline banner |
| Rural offline | IndexedDB + sync engine | Queued mutations, cached education |
| AI streaming | Query mutation + local stream buffer | Assistant tokens |

**Rules**
- Do **not** mirror lists into global stores.  
- Invalidate query keys on approve care plan, new check-in, alert ack.  
- Optimistic updates only for low-risk UX (mark medicine taken); rollback on failure.  
- Risk and escalation always refetch authoritative server state.

### Query Key Convention

```
['patients', 'list', filters]
['patients', id, 'monitoring']
['care-plans', id]
['risk', patientId, 'latest']
['alerts', 'doctor', filters]
['sync', 'status']
```

---

# 12. Folder Naming Conventions

| Area | Convention | Example |
|---|---|---|
| Frontend modules | `kebab-case` folders | `modules/high-risk/` |
| React components | `PascalCase.tsx` | `RiskTable.tsx` |
| Hooks | `useCamelCase.ts` | `useHighRiskPatients.ts` |
| Utilities | `camelCase.ts` | `formatVitals.ts` |
| Types | `PascalCase` types / `*.types.ts` files | `CarePlan.types.ts` |
| Backend Python packages | `snake_case` | `care_plans.py` |
| DB tables | `snake_case` plural | `health_checkins` |
| Env vars | `SCREAMING_SNAKE` | `EXA_API_KEY` |
| Test files | `*.test.ts` / `test_*.py` | `test_risk_service.py` |

**Module file set (frontend) recommended:**
`index.ts` · `routes.tsx` · `api.ts` · `schemas.ts` · `components/` · `hooks/` · `pages/`

---

# 13. API Naming Conventions

| Item | Rule | Example |
|---|---|---|
| Resources | plural kebab/path | `/care-plans` |
| IDs | `{resource_id}` | `/patients/{patient_id}` |
| Actions | POST subpath | `/care-plans/{id}/approve` |
| Booleans | `is_` / `has_` in JSON | `is_primary` |
| Timestamps | ISO-8601 UTC | `2026-08-01T03:11:00Z` |
| Enums | lowercase snake | `ai_draft`, `high` |
| AI fields | prefix `ai_` or nest under `assistant` | `ai_narrative` |
| Demo gov fields | suffix `_demo` | `abha_id_demo` |
| Error codes | `DOMAIN_REASON` | `CARE_PLAN_NOT_APPROVED` |

---

# 14. Coding Standards

## 14.1 TypeScript / React

- Strict TypeScript; no implicit `any`.  
- Prefer function components.  
- Colocate feature code; shared only when reused ≥ 2 modules.  
- Accessibility: labels, focus traps in dialogs, keyboard paths for check-in.  
- No secrets in client bundles; only `VITE_` public keys.  
- Every AI surface shows persistent safety disclaimer.  
- Prefer modern React 19 patterns already adopted by the team; avoid premature `useMemo`/`useCallback` unless measured.

## 14.2 Python / FastAPI

- Type hints everywhere.  
- Pydantic v2 models for I/O.  
- Services raise domain exceptions; API maps to HTTP.  
- No unbounded LLM prompts with PHI in logs.  
- Unit tests for risk rules; integration tests for authz.  
- SQLAlchemy 2.0 style.  

## 14.3 Clinical Safety Coding Rules

- Care plan activation requires doctor role.  
- AI endpoints return `disclaimer` + `assistive: true`.  
- Models cannot write prescriptions tables directly as “doctor orders”.  
- Escalation creates notifications, not medication changes.

## 14.4 Git / Quality Gates

- PR required; lint + typecheck + unit tests.  
- Conventional commits recommended: `feat(doctor): ...`, `fix(risk): ...`.  
- No PHI in fixtures committed to git; use synthetic seeds.

---

# 15. Reusable UI Components

## 15.1 Design System (shadcn base)

Button · Input · Textarea · Select · Checkbox · Radio · Switch · Dialog · Sheet · Drawer · Tabs · Accordion · Table · Badge · Avatar · Card · Toast · Tooltip · Dropdown · Separator · Skeleton · Progress · Calendar · Command/Combobox

## 15.2 Healthcare Domain Components

| Component | Purpose |
|---|---|
| `RiskBadge` | low/moderate/high/critical styling |
| `AiDisclaimer` | mandatory assistive notice |
| `VitalsForm` | reusable vitals capture |
| `MedicineScheduleList` | timeline of doses |
| `AdherenceRing` | adherence % visual |
| `TrendChart` | Recharts wrapper for check-in metrics |
| `PatientHeader` | name, age, blood group, risk |
| `EscalationBanner` | urgent clinical attention |
| `CarePlanStatusChip` | ai_draft → approved → active |
| `CheckInStepper` | multi-step daily check-in |
| `EmptyClinicalState` | calm empty/error for clinical pages |
| `OfflineStatusBar` | rural connectivity + pending sync count |
| `HospitalMap` | Leaflet map with filters |
| `PassportCard` | QR + emergency strip |
| `PdfExportButton` | weekly report export |
| `LocaleToggle` | EN / GU (phase 1) |
| `NotificationInbox` | unified notifications |

**Card policy:** Cards are interaction containers (patient rows, alert items, form sections). Avoid decorative card sprawl in marketing-like hero areas if a public landing is added later.

---

# 16. AI Integration Architecture

## 16.1 Primary Provider

**Exa AI** for retrieval-augmented assistance:
- AI Health Assistant  
- AI Care Companion (discharge → structured care artifacts)  
- Patient / Caregiver Education  
- PM-JAY Guidance grounding  
- Medical knowledge retrieval  
- AI Summaries for doctors  

## 16.2 Orchestration Pattern

```
User/Doctor action
 → FastAPI Ai*Service
 → Safety pre-filter (role, purpose, PHI minimization)
 → Prompt assembly (system policy + structured schema)
 → Exa retrieval (knowledge / scheme docs) + generation
 → Schema validation (Pydantic) of AI JSON
 → Persist ai_generations
 → Return assistive payload with disclaimer
 → (Care Companion only) create care_plan status=ai_draft
 → Doctor must approve
```

## 16.3 System Policy (Enforced in Prompts + Post-checks)

AI must refuse/rewrite outputs that:
- Assert a definitive diagnosis  
- Prescribe or change dosage  
- Instruct stopping medications without clinician  
- Sound like emergency triage replacing ER judgment  

Fallback: template educational content + “contact your doctor”.

## 16.4 Care Companion Output Contract (Conceptual)

Structured JSON validated server-side:
- `medicines[]`  
- `daily_tasks[]`  
- `followup_timeline[]`  
- `appointments_suggestions[]`  
- `caregiver_instructions`  
- `education_topics[]`  
- `uncertainties[]` (what doctor should verify)

## 16.5 Explainable Surfaces

- Doctor: “Why this summary?” / source snippets  
- Risk: feature contributions (from ML/rules) shown beside AI narrative  
- Patient education: cite simplified references, not opaque claims  

## 16.6 Data Minimization for AI Calls

Send only fields required for the task; strip identifiers where possible; never log full prompts with secrets; retain generation IDs for audit.

---

# 17. ML Architecture

## 17.1 Prediction Goals

1. **Readmission Risk** (0–100 + level)  
2. **Disease Progression / Recovery Trajectory** (stable / watch / worsening)  
3. **Trend Detection** on check-ins & adherence  
4. **Automated Escalation** triggers (policy layer on top of scores)

## 17.2 Phase A — Rule Engine (Initial Production)

Deterministic, explainable rules, e.g.:
- Consecutive missed medicines ≥ N  
- Pain score rising over M days  
- Red-flag symptoms present  
- No check-in for X days post-discharge  
- Comorbidity flags from discharge text (doctor-confirmed fields)

Output: score + human-readable rule hits (`explanation_json.rules_fired`).

## 17.3 Phase B — Random Forest / XGBoost

Features (examples):
- Days since discharge  
- Adherence rate (7d/14d)  
- Check-in completeness  
- Symptom severity trends  
- Vital deltas  
- Prior readmission flag  
- Age band / procedure category  

Pipeline:
`feature build → model infer → calibrate → explain (SHAP or feature importances) → persist risk_scores`

## 17.4 Escalation Policy Engine

Separate from model:
- Thresholds by level  
- Quiet hours / bundling  
- Role routing (doctor always; caregiver; rural optional)  
- SLA timers on open critical alerts  

## 17.5 Model Governance

| Artifact | Requirement |
|---|---|
| `model_version` | Required on every score |
| Training data | De-identified; documented |
| Evaluation | AUC/PR + calibration; subgroup checks |
| Rollback | Pin previous model_version |
| Clinician override | Always allowed; logged |

---

# 18. Offline Synchronization Strategy

## 18.1 Scope

Applies primarily to **Rural Module** (and optionally patient check-in resilience later).

## 18.2 Client Local Store

- Screening sessions  
- Pending mutations (check-ins, vitals, education acknowledgements)  
- Cached PM-JAY / education content packs by locale  
- Last successful `pull_cursor`

## 18.3 Sync Protocol

1. **Push:** send batch of mutations with unique `client_mutation_id`  
2. Server applies idempotently; returns accepted / conflict / rejected  
3. **Pull:** fetch patient assignment updates, care plan snapshots, education packs  
4. Update local DB; clear acknowledged mutations  

## 18.4 Conflict Policy

| Conflict | Resolution |
|---|---|
| Duplicate mutation id | Ignore (success) |
| Concurrent check-ins | Keep both if different timestamps; else server wins |
| Care plan edits offline | Reject; care plans are doctor-authoritative online |
| Alert ack offline | Last ack wins |

## 18.5 UX Requirements

- Persistent sync status chip  
- Pending count  
- Manual “Sync now”  
- Clear offline education availability  

---

# 19. Security Considerations

## 19.1 Threat Model (Abbreviated)

| Threat | Mitigation |
|---|---|
| Unauthorized PHI access | JWT + RBAC + RLS + relationship checks |
| Privilege escalation | Role stored server-side; never trust client role alone |
| AI prompt injection | Purpose-bound tools; output schema validation; no tool that writes meds |
| Insecure direct object ref | UUID + authz on every resource |
| Upload malware | File type/size limits; virus scan later; private storage |
| Token theft | HTTPS, short TTL, secure client storage practices |
| Audit gaps | Mandatory audit_logs on clinical mutations |
| Third-party AI leakage | Minimization + retention policy + DPA with vendor |

## 19.2 Healthcare / India Posture

- Design for **DPDP Act** principles: purpose limitation, consent, retention  
- ABDM-compatible identifiers and import flows (demo first, real integration later)  
- Emergency passport QR exposes **minimal** emergency dataset only  
- Clear Demo labeling on ABHA/PM-JAY simulated data  

## 19.3 Security Controls Checklist

- Secrets in env / secret manager only  
- CORS allowlist  
- Rate limits on auth + AI endpoints  
- PII encryption at rest (Supabase), TLS in transit  
- Soft deletes + restricted hard delete  
- Dependency scanning in CI  

---

# 20. Deployment Architecture

```
                  ┌──────────────┐
                  │   Vercel     │
                  │  apps/web    │
                  └──────┬───────┘
                         │ HTTPS
                  ┌──────▼───────┐
                  │   Render     │
                  │ FastAPI API  │
                  └──────┬───────┘
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
     Supabase Auth  Supabase PG    Exa AI API
           │             │
           └──── RLS ────┘
```

| Concern | Choice |
|---|---|
| Frontend | Vercel (preview deploys per PR) |
| Backend | Render Web Service (gunicorn/uvicorn) |
| DB/Auth | Supabase project (staging + prod) |
| Secrets | Vercel/Render/Supabase env configs |
| Observability | Structured logs + error tracking (Sentry recommended) |
| Migrations | Alembic optional; Supabase SQL migrations acceptable if standardized |

### Environments

`local` · `staging` · `production`  
Separate Supabase projects recommended for staging vs production.

---

# 21. Development Roadmap (Module Order)

Build order optimized for vertical value (doctor → patient loop) then expansion.

| Phase | Modules | Outcome |
|---|---|---|
| **0 — Foundations** | Monorepo scaffolding, Auth, Profiles/RBAC, Design system, CI, Deploy stubs | Runnable empty shells per role |
| **1 — Doctor Core** | Patient Management, History, Manual Discharge, Dashboard shell | Doctors can register patients & enter discharge |
| **2 — AI Care Companion** | Upload discharge, Exa orchestration, care plan draft/approve | Continuity plan activation |
| **3 — Patient App** | Today tasks, medicines, appointments, notifications, check-in | Closed recovery loop |
| **4 — Risk & Escalation** | Rule engine, High Risk Dashboard, alerts, caregiver notify | Early intervention path |
| **5 — Caregiver Module** | Status, adherence, alerts, appointments | Family support layer |
| **6 — Patient Passport** | Passport fields, QR, emergency view | Portable identity |
| **7 — Analytics** | Adherence charts, trends, weekly AI report, PDF | Outcomes visibility |
| **8 — Government** | PM-JAY guidance, hospital list, ABHA demo import | Scheme literacy + ABDM-ready demo |
| **9 — Maps** | Ahmedabad Hospital Finder (govt/PM-JAY/emergency + directions) | Care navigation |
| **10 — Rural** | Offline screening, sync, local language, caregiver education | Last-mile continuity |
| **11 — AI Assistant Hardening** | Explainable AI UX, education quality, safety evals | Production AI polish |
| **12 — ML Upgrade** | Feature store-ish tables, RF/XGBoost, SHAP explanations | Stronger prediction |

**Definition of Done (every phase):** authz tests · empty/error states · audit events · mobile responsiveness · AI disclaimer where applicable.

---

# 22. Risks and Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Clinical over-trust in AI | Patient harm / liability | Doctor approval gates; disclaimers; no prescribe/diagnose |
| Hallucinated care plans | Wrong meds schedule | Structured validation; doctor edit mandatory; uncertainty list |
| Low patient adherence to check-ins | Weak predictions | Caregiver + rural assist; simple UX; reminders |
| Rural connectivity | Data loss | Offline-first sync + idempotency |
| PHI exposure via AI vendor | Compliance breach | Minimization, contracts, redaction, audit |
| Ambiguous ABDM demo vs real | User confusion | Persistent “Demo” labeling; separate integration phase |
| Alert fatigue for doctors | Ignored escalations | Severity tiers, bundling, SLA UX |
| Model bias / drift | Unequal risk quality | Governance, monitoring, subgroup eval, rollback |
| Scope creep across gov + maps + rural | Delayed MVP | Strict phase order in §21 |
| Multi-role UX complexity | Usability debt | Role shells + shared primitives; user testing per role |

---

# 23. Future Scalability

## 23.1 Product Scale

- Multi-hospital / multi-tenant orgs  
- Departmental teams & nurse coordinator role  
- Real ABDM gateway integration (beyond demo)  
- National hospital graph beyond Ahmedabad  
- Vernacular expansion (Hindi + more)  
- WhatsApp / SMS notification channels  
- Wearable vitals ingestion  

## 23.2 Technical Scale

- Extract ML to dedicated inference service  
- Event bus for check-in → risk → alert pipeline  
- Read replicas / caching for dashboards  
- Edge caching for education/PM-JAY content  
- Mobile native shells if SPA limits offline UX  
- FHIR-aligned resource mapping for interoperability  
- Formal clinical safety board + model cards  

## 23.3 Success Metrics (Product)

| Metric | Intent |
|---|---|
| % care plans doctor-approved < 24h | Activation speed |
| Check-in completion rate (7-day) | Engagement |
| Medicine adherence rate | Recovery fidelity |
| Median time-to-ack on high-risk alerts | Clinical responsiveness |
| Escalations with documented intervention | Early action |
| Avoidable readmission rate (partner hospital study) | North-star outcome |

---

# Appendix A — Functional Requirements Traceability

| ID | Requirement | Modules |
|---|---|---|
| FR-01 | Follow-up Management | Doctor, Patient, Appointments, Care Plans |
| FR-02 | Automated Escalation | Risk, Alerts, Notifications |
| FR-03 | Localized Education | AI, Rural, i18n |
| FR-04 | PM-JAY Guidance | Government |
| FR-05 | ABDM-Compatible Import (Demo) | Government, Passport |
| FR-06 | Offline Rural Screening | Rural, Sync |
| FR-07 | AI Early Risk Detection | ML, Doctor High Risk |
| FR-08 | Doctor remains in control | Care plan approval, RBAC |
| FR-09 | Digital Patient Passport | Passport |
| FR-10 | Ahmedabad Hospital Finder | Maps |
| FR-11 | Analytics + PDF Weekly Report | Analytics |

---

# Appendix B — Non-Functional Requirements

| ID | NFR |
|---|---|
| NFR-01 | WCAG 2.1 AA on core flows |
| NFR-02 | p95 non-AI API < 400ms |
| NFR-03 | Audit log for clinical mutations |
| NFR-04 | Role-based authorization on every PHI endpoint |
| NFR-05 | Offline rural sync with idempotency |
| NFR-06 | AI assistive labeling mandatory |
| NFR-07 | Responsive layouts phone → desktop |
| NFR-08 | Staging/prod environment isolation |

---

# Appendix C — Glossary

| Term | Meaning |
|---|---|
| Continuity of Care | Ongoing coordinated care after discharge |
| Care Companion | AI that structures discharge into actionable plan drafts |
| Escalation | Human notification pathway when risk rises |
| ABHA | Ayushman Bharat Health Account (demo linkage here) |
| ABDM | Ayushman Bharat Digital Mission |
| PM-JAY | Pradhan Mantri Jan Arogya Yojana |
| ASHA / ANM | Rural community health workers |
| Patient Passport | Portable emergency + longitudinal summary |

---

# Appendix D — Explicit Non-Goals (MVP)

- AI diagnosis or prescription  
- Autonomous treatment changes  
- Full production ABDM certification in phase 1 (demo only)  
- Nationwide hospital coverage at launch (Ahmedabad first)  
- Replacing hospital HIS/EMR  

---

**End of Master Blueprint v1.0.0**

This document is the authoritative engineering specification for HealNexus. All subsequent design, API, database, AI, and UI work should implement—not redefine—the product intent and safety boundaries described above.
