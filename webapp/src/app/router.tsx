import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/routing/protected-route";
import { AppLayout } from "@/layouts/app-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { AppointmentsPage } from "@/modules/doctor/pages/appointments-page";
import { DashboardPage } from "@/modules/doctor/pages/dashboard-page";
import { HighRiskPage } from "@/modules/doctor/pages/high-risk-page";
import { PatientDetailPage } from "@/modules/doctor/pages/patient-detail-page";
import { PatientsPage } from "@/modules/doctor/pages/patients-page";
import { AiAssistantPage } from "@/modules/patient/pages/ai-assistant-page";
import { AppointmentsPage as PatientAppointmentsPage } from "@/modules/patient/pages/appointments-page";
import { CarePlanPage } from "@/modules/patient/pages/care-plan-page";
import { CheckInPage } from "@/modules/patient/pages/check-in-page";
import { PatientHomePage } from "@/modules/patient/pages/home-page";
import { MedicinesPage } from "@/modules/patient/pages/medicines-page";
import { NotificationsPage } from "@/modules/patient/pages/notifications-page";
import { PassportPage } from "@/modules/patient/pages/passport-page";
import { ProfilePage } from "@/modules/patient/pages/profile-page";
import { RecoveryPage } from "@/modules/patient/pages/recovery-page";
import { SettingsPage } from "@/modules/patient/pages/settings-page";
import { LoginPage } from "@/pages/auth/login-page";
import { HomeRedirect } from "@/pages/home-redirect";
import { ModulePlaceholder } from "@/pages/module-placeholder";
import { NotFoundPage } from "@/pages/not-found-page";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/doctor" element={<DashboardPage />} />
            <Route path="/doctor/patients" element={<PatientsPage />} />
            <Route path="/doctor/patients/:patientId" element={<PatientDetailPage />} />
            <Route path="/doctor/high-risk" element={<HighRiskPage />} />
            <Route path="/doctor/appointments" element={<AppointmentsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
          <Route element={<AppLayout />}>
            <Route path="/patient" element={<PatientHomePage />} />
            <Route path="/patient/care-plan" element={<CarePlanPage />} />
            <Route path="/patient/check-in" element={<CheckInPage />} />
            <Route path="/patient/medicines" element={<MedicinesPage />} />
            <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
            <Route path="/patient/notifications" element={<NotificationsPage />} />
            <Route path="/patient/passport" element={<PassportPage />} />
            <Route path="/patient/profile" element={<ProfilePage />} />
            <Route path="/patient/settings" element={<SettingsPage />} />
            <Route path="/patient/ai-assistant" element={<AiAssistantPage />} />
            <Route path="/patient/recovery-score" element={<RecoveryPage />} />
            <Route
              path="/patient/lifestyle-simulator"
              element={
                <ModulePlaceholder
                  title="Lifestyle Simulator"
                  description="Adjust weight, exercise, sleep, water intake, and medication adherence to visualize Recovery Score and risk. Full simulator UI in a later pass."
                  showAiDisclaimer
                />
              }
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["caregiver"]} />}>
          <Route element={<AppLayout />}>
            <Route
              path="/caregiver"
              element={
                <ModulePlaceholder
                  title="Caregiver Status"
                  description="Patient status, adherence, Recovery Score visibility, and appointments."
                />
              }
            />
            <Route
              path="/caregiver/alerts"
              element={
                <ModulePlaceholder
                  title="Caregiver Alerts"
                  description="Escalation notifications for the patients you support."
                />
              }
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["health_worker"]} />}>
          <Route element={<AppLayout />}>
            <Route
              path="/rural"
              element={
                <ModulePlaceholder
                  title="Rural Screening"
                  description="Health worker screening with local offline capture."
                />
              }
            />
            <Route
              path="/rural/offline"
              element={
                <ModulePlaceholder
                  title="Offline Mode"
                  description="IndexedDB / localStorage capture with simulated sync."
                />
              }
            />
            <Route
              path="/rural/sync"
              element={<Navigate to="/rural/offline" replace />}
            />
            <Route
              path="/rural/education"
              element={
                <ModulePlaceholder
                  title="Caregiver Education"
                  description="Localized educational guidance via AI Care Companion (assistive only)."
                  showAiDisclaimer
                />
              }
            />
          </Route>
        </Route>

        <Route
          element={
            <ProtectedRoute
              allowedRoles={["doctor", "patient", "caregiver", "health_worker"]}
            />
          }
        >
          <Route element={<AppLayout />}>
            <Route
              path="/analytics"
              element={
                <ModulePlaceholder
                  title="Analytics"
                  description="Exactly three charts: Blood Sugar Trend, Blood Pressure Trend, and Recovery Score / Readmission Trend."
                  showAiDisclaimer
                />
              }
            />
            <Route
              path="/documents"
              element={
                <ModulePlaceholder
                  title="Documents"
                  description="Demo upload, sample prescription, and sample lab report."
                />
              }
            />
            <Route
              path="/maps"
              element={
                <ModulePlaceholder
                  title="Ahmedabad Hospital Finder"
                  description="Leaflet + OpenStreetMap. Ahmedabad only — 3–5 demo hospitals."
                />
              }
            />
            <Route
              path="/government/pmjay"
              element={
                <ModulePlaceholder
                  title="PM-JAY Guidance"
                  description="Rule-based guidance (not a live API)."
                />
              }
            />
            <Route
              path="/government/abha"
              element={
                <ModulePlaceholder
                  title="Mock ABHA Import"
                  description="Structured demo ABHA records only. No real ABDM APIs."
                />
              }
            />
          </Route>
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
