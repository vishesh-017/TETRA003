import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/routing/protected-route";
import { AppLayout } from "@/layouts/app-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { AppointmentsPage } from "@/modules/doctor/pages/appointments-page";
import { DashboardPage } from "@/modules/doctor/pages/dashboard-page";
import { HighRiskPage } from "@/modules/doctor/pages/high-risk-page";
import { PatientDetailPage } from "@/modules/doctor/pages/patient-detail-page";
import { PatientsPage } from "@/modules/doctor/pages/patients-page";
import { AbhaPage } from "@/modules/identity/pages/abha-page";
import { BenefitsPage } from "@/modules/identity/pages/benefits-page";
import { EmergencyProfilePage } from "@/modules/identity/pages/emergency-profile-page";
import { HospitalMapPage } from "@/modules/identity/pages/hospital-map-page";
import { PmjayPage } from "@/modules/identity/pages/pmjay-page";
import { RuralShell } from "@/modules/rural/components/rural-shell";
import { RuralDashboardPage } from "@/modules/rural/pages/dashboard-page";
import { RuralEducationPage } from "@/modules/rural/pages/education-page";
import { RuralNotificationsPage } from "@/modules/rural/pages/notifications-page";
import { RuralPatientsPage } from "@/modules/rural/pages/patients-page";
import { RuralScreeningPage } from "@/modules/rural/pages/screening-page";
import { RuralSyncPage } from "@/modules/rural/pages/sync-page";
import { RuralVisitsPage } from "@/modules/rural/pages/visits-page";
import { AiAssistantPage } from "@/modules/patient/pages/ai-assistant-page";
import { AppointmentsPage as PatientAppointmentsPage } from "@/modules/patient/pages/appointments-page";
import { CarePlanPage } from "@/modules/patient/pages/care-plan-page";
import { CheckInPage } from "@/modules/patient/pages/check-in-page";
import { PatientHomePage } from "@/modules/patient/pages/home-page";
import { MedicinesPage } from "@/modules/patient/pages/medicines-page";
import { NotificationsPage } from "@/modules/patient/pages/notifications-page";
import { PassportPage } from "@/modules/patient/pages/passport-page";
import { ProfilePage } from "@/modules/patient/pages/profile-page";
import { LifestyleSimulatorPage } from "@/modules/patient/pages/lifestyle-simulator-page";
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

        {/* Public QR emergency profile — no auth */}
        <Route path="/emergency/:token" element={<EmergencyProfilePage />} />

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
              element={<LifestyleSimulatorPage />}
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
            <Route element={<RuralShell />}>
              <Route path="/rural" element={<RuralDashboardPage />} />
              <Route path="/rural/screening" element={<RuralScreeningPage />} />
              <Route path="/rural/patients" element={<RuralPatientsPage />} />
              <Route path="/rural/visits" element={<RuralVisitsPage />} />
              <Route path="/rural/education" element={<RuralEducationPage />} />
              <Route path="/rural/sync" element={<RuralSyncPage />} />
              <Route path="/rural/offline" element={<RuralSyncPage />} />
              <Route
                path="/rural/notifications"
                element={<RuralNotificationsPage />}
              />
            </Route>
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
              element={<Navigate to="/government/abha" replace />}
            />
            <Route path="/maps" element={<HospitalMapPage />} />
            <Route path="/government/pmjay" element={<PmjayPage />} />
            <Route path="/government/abha" element={<AbhaPage />} />
            <Route path="/government/benefits" element={<BenefitsPage />} />
          </Route>
        </Route>

        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
