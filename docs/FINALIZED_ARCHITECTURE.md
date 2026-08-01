# HealNexus — Finalized Architecture Decisions

**Version:** 1.1.0  
**Date:** 1 August 2026  
**Status:** Binding for scaffold & upcoming feature work  
**Supersedes conflicting guidance** in `HealNexus_SRS_Architecture.md` where noted.

Project name everywhere: **HealNexus**.

---

## 1. AI Care Companion (terminology & safety)

Use only **AI Care Companion** (and related assistive labels). Never use “AI Doctor”, “AI Diagnosis”, or “AI Prescription”.

| AI NEVER | AI ONLY |
|---|---|
| Diagnoses patients | Organizes the doctor’s discharge plan |
| Prescribes medicines | Summarizes patient history |
| Replaces doctors | Explains reports (educational) |
| | Provides multilingual education |
| | Predicts deterioration risk |
| | Detects health trends |
| | Supports clinical decision-making |

All Care Companion outputs remain **draft / assistive** until a doctor reviews and approves.

---

## 2. Recovery Score (primary KPI)

**Recovery Score** is the primary patient health KPI (0–100). Architecture prepared; logic not implemented yet.

**Inputs (planned):**
- Medicine adherence  
- Daily check-ins  
- Symptom severity  
- BP trend  
- Sugar trend  
- Activity level  
- Sleep  

**Downstream consumers (later):**
- Readmission Prediction  
- Disease Progression  
- Analytics Dashboard (Recovery Score / Readmission Trend chart)

Model: `recovery_scores` · Service stub: `RecoveryScoreService`

---

## 3. Lifestyle Simulator

Patients (and caregivers where allowed) can adjust lifestyle levers and visualize projected KPIs.

**Adjustable inputs:** Weight · Exercise · Sleep · Water intake · Medication adherence  

**Visualized outputs:** Recovery Score · Readmission Risk · Disease Progression  

Architecture only — no simulation math yet.  
Model: `lifestyle_simulations` · Frontend route: `/patient/lifestyle-simulator`

---

## 4. Document ingestion (OCR optional)

OCR is **not mandatory**.

MVP uses:
- Demo upload  
- Sample prescription  
- Sample lab report  

OCR remains modular via a provider interface so **Gemini Vision** (or another vision model) can be plugged in later without changing business services.

---

## 5. PM-JAY — rule-based guidance

**Not** a live government API.

Rule-based content covers:
- Eligibility questions  
- Benefits  
- Required documents  
- Nearby PM-JAY hospitals (from demo hospital catalog)

---

## 6. ABDM — mock ABHA import

**Mock ABHA Import** only — structured demo records.  
No real ABDM / NHA APIs in this phase. Always label **Demo**.

---

## 7. Offline mode (simplified)

- Client: **localStorage / IndexedDB**  
- **Simulated sync** (mark pending → synced)  
- **No** complex conflict-resolution sync engine  

Server retains `health_worker_records` with a simple `sync_state` for demo persistence.

---

## 8. Analytics (exactly three charts)

1. Blood Sugar Trend  
2. Blood Pressure Trend  
3. Recovery Score / Readmission Trend  

No additional analytics charts in MVP.

---

## 9. Maps

- Leaflet + OpenStreetMap  
- **Ahmedabad only**  
- **3–5 demo hospitals** covering Government · PM-JAY · Emergency  

---

## 10. Patient Passport

Must include:
- QR Code  
- ABHA ID (Demo)  
- Medical History  
- Allergies  
- Current Medicines  
- Emergency Contacts  

---

## 11. AI provider abstraction

Business services call an **AI provider interface**.  
Default provider: **Exa** (wired later).  
Providers are swappable without changing Care Companion / education business logic.

---

## 12. Scaffold cleanup principles

- Prefer `webapp/` (TypeScript core) + `supabase/` + optional `ai-service/` (Python AI/ML only)  
- One service per domain concern  
- Demo/mock government & document flows clearly labeled  
- Recovery Score is the shared KPI across monitoring, simulator, and analytics  
