<div align="center">
  
# 🌟 HealNexus 🌟

**Connecting Patients, Doctors & AI Beyond Hospital Walls.**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)

*A premium, AI-powered Continuity of Care platform designed for modern healthcare.*

</div>

---

## 🚀 Overview

HealNexus bridges the gap between clinical visits by empowering patients, caregivers, and doctors with real-time insights, AI-driven care plans, and robust offline sync for rural areas. 

The platform is split into two primary engines:
- **`webapp/`**: The core TypeScript frontend and business logic, powered by React and Supabase.
- **`ai-service/`**: A dedicated Python microservice handling AI/ML intelligence, risk predictions, and advanced context processing.

> [!IMPORTANT]
> **Clinical Safety & AI Philosophy:** Our AI Care Companion serves purely as a clinical assistant. It never diagnoses, prescribes, or replaces professional medical judgment. All AI outputs are drafts requiring licensed doctor approval.

---

## ✨ Key Features

- **🤖 AI Care Companion**: Intelligent chat that summarizes contexts, handles emergency triage, and fetches validated medical education.
- **📊 Real-time Doctor Dashboard**: Priority queues, live patient telemetry, and AI-assisted care plan generation.
- **👨‍👩‍👧‍👦 Caregiver Portal**: Allows family members to track recovery progress and receive critical health alerts.
- **🌍 Rural Health Sync**: Robust offline-first capabilities using LocalStorage to support health workers in low-connectivity areas.
- **🌐 Internationalization (i18n)**: Multi-language support (English, Hindi, Gujarati) catering to diverse patient demographics.
- **🎨 Stunning 3D Interfaces**: Immersive WebGL elements built with Three.js and Framer Motion.

---

## 🏛️ System Architecture

HealNexus leverages a highly decoupled, scalable architecture:

```mermaid
graph TD
    %% Define Nodes
    subgraph ClientLayer ["Client & Frontend (webapp)"]
        PatApp["Patient Portal<br>(Meds, Check-ins, Passport)"]
        DocDash["Doctor Dashboard<br>(Priority Queue, Care Plans)"]
        CarePort["Caregiver Portal<br>(Sync Alerts)"]
        RuralPHC["Rural Health Workers<br>(Offline Sync)"]
    end

    subgraph DataLayer ["Data & Persistence Layer"]
        LocalStore["Local DB Store<br>(Fallback)"]
        SupaDB[("Supabase DB<br>(Postgres + RLS)")]
    end

    subgraph AILayer ["AI & Intelligence (ai-service)"]
        FastAPI["FastAPI Orchestrator"]
        AIComp["Care Companion Engine"]
        MLPred["Predictors & ML Engines"]
        AIProv["AI Providers / Exa API"]
    end

    %% Define Connections
    PatApp <--> |Local Fallback| LocalStore
    PatApp <--> |CRUD API / WebSockets| SupaDB
    DocDash <--> SupaDB
    CarePort <--> SupaDB
    RuralPHC <--> |Queue & Sync| SupaDB

    PatApp --> |Chat & Ingestion| FastAPI
    DocDash --> |Generate Drafts| FastAPI
    
    FastAPI <--> AIComp
    FastAPI <--> MLPred
    AIComp <--> AIProv
```

---

## 🔄 Care Continuity Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    actor Doctor
    participant WebApp as HealNexus Client
    participant AIService as AI Intelligence
    participant Database as Supabase DB

    %% Step 1: Discharge
    Doctor->>WebApp: Generate Discharge Summary
    WebApp->>AIService: Request AI Care Plan Optimization
    AIService-->>WebApp: Return AI Draft Care Plan
    Doctor->>WebApp: Review & Approve Care Plan
    WebApp->>Database: Save & Issue Patient Passport

    %% Step 2: Home Care
    Patient->>WebApp: Log Daily Check-ins (BP, Sugar, etc.)
    WebApp->>Database: Save Telemetry
    Patient->>WebApp: Query AI Companion (Chat)
    WebApp->>AIService: Process Context & Retrieve Edu
    AIService-->>WebApp: Assistive Education Responses

    %% Step 3: Alerts
    Database->>WebApp: Sync Telemetry Data
    WebApp->>WebApp: Calculate Recovery Score
    alt Threshold Exceeded
        WebApp->>Database: Raise Smart Alert
        Database->>WebApp: Push Alert to Doctor & Caregiver
        Doctor->>Patient: Intervene & Adjust Plan
    end
```

---

## 📂 Folder Layout

```text
HealNexus/
├── webapp/                 # Core TS React app (Router, UI, i18n, Realtime)
│   ├── src/
│   │   ├── modules/        # Domain features: marketing, caregiver, doctor, patient
│   │   ├── components/     # UI elements (3D WebGL scenes, widgets, cards)
│   │   └── services/       # Repositories, health engines, API interfaces
├── ai-service/             # Python AI/ML microservice
│   ├── app/
│   │   ├── api/            # API routing & FastAPI dependencies
│   │   ├── ml/             # Predictors & XGBoost simulation placeholders
│   │   └── services/       # Care companion & search assistants
├── supabase/               # Postgres schemas, migrations, and Row-Level Security
└── docs/                   # Architecture decision records & design specs
```

---

## ⚙️ Quick Start

### 1. Webapp Client (Core Product)
```bash
cd webapp
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view the application.

> **💡 Note on Local State Fallback**: Without Supabase credentials, the app gracefully degrades to a **dynamic local store**, allowing testing of patient check-ins and offline rural synchronization entirely in the browser.

### 2. Python AI Service (Optional)
```bash
cd ai-service
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt

# Create .env and set EXA_API_KEY / OpenRouter credentials
uvicorn app.main:app --reload --port 8001
```

---

## 🛠️ Technology Stack

- **Frontend Core**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, GSAP, i18next.
- **3D WebGL Interface**: Three.js, React Three Fiber (R3F), Drei.
- **Backend & DB**: Supabase (PostgreSQL, Realtime, Row-Level Security).
- **AI Microservice**: Python, FastAPI, Pydantic, XGBoost, OpenRouter, Exa.

<div align="center">
  <p>Built with ❤️ for a healthier tomorrow.</p>
</div>
