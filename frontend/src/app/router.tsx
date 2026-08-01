import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "@/components/routing/protected-route";
import { AppLayout } from "@/layouts/app-layout";
import { AuthLayout } from "@/layouts/auth-layout";
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
            <Route
              path="/doctor"
              element={
                <ModulePlaceholder
                  title="Doctor Dashboard"
                  description="High-risk monitoring, patient management, and care plan oversight."
                />
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ModulePlaceholder
                  title="Patient Management"
                  description="Create patients, view history, and manage discharge summaries."
                />
              }
            />
            <Route
              path="/doctor/high-risk"
              element={
                <ModulePlaceholder
                  title="High Risk Dashboard"
                  description="Escalations and patients requiring early intervention."
                  showAiDisclaimer
                />
              }
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
          <Route element={<AppLayout />}>
            <Route
              path="/patient"
              element={
                <ModulePlaceholder
                  title="Patient Home"
                  description="Today's tasks, medicine reminders, and appointments."
                />
              }
            />
            <Route
              path="/patient/check-in"
              element={
                <ModulePlaceholder
                  title="Daily Health Check-in"
                  description="Capture symptoms and vitals for recovery monitoring."
                />
              }
            />
            <Route
              path="/patient/passport"
              element={
                <ModulePlaceholder
                  title="Patient Passport"
                  description="Personal details, allergies, medicines, ABHA demo, and QR."
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
                  description="Patient status, adherence, and upcoming appointments."
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
                  description="Offline-first health worker screening workspace."
                />
              }
            />
            <Route
              path="/rural/sync"
              element={
                <ModulePlaceholder
                  title="Offline Sync"
                  description="Push and pull queued rural screening mutations."
                />
              }
            />
            <Route
              path="/rural/education"
              element={
                <ModulePlaceholder
                  title="Caregiver Education"
                  description="Localized educational guidance for rural care settings."
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
              path="/maps"
              element={
                <ModulePlaceholder
                  title="Ahmedabad Hospital Finder"
                  description="Government, PM-JAY, and emergency hospitals with directions."
                />
              }
            />
            <Route
              path="/government/pmjay"
              element={
                <ModulePlaceholder
                  title="PM-JAY Guidance"
                  description="Eligibility, benefits, documents, and nearby empaneled hospitals."
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
