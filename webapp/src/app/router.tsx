import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { LoadingScreen } from "@/components/feedback/loading-screen";
import { ProtectedRoute } from "@/components/routing/protected-route";
import { AppLayout } from "@/layouts/app-layout";
import { AuthLayout } from "@/layouts/auth-layout";
import { MarketingLayout } from "@/modules/marketing/layouts/marketing-layout";
import { LoginPage } from "@/pages/auth/login-page";
import { SignupPage } from "@/pages/auth/signup-page";
import { AnalyticsRedirect } from "@/pages/analytics-redirect";
import { HomeRedirect } from "@/pages/home-redirect";
import { ModulePlaceholder } from "@/pages/module-placeholder";
import { NotFoundPage } from "@/pages/not-found-page";

const LandingPage = lazy(() =>
  import("@/modules/marketing/pages/landing-page").then((m) => ({
    default: m.LandingPage,
  })),
);
const FeaturesPage = lazy(() =>
  import("@/modules/marketing/pages/features-page").then((m) => ({
    default: m.FeaturesPage,
  })),
);
const PricingPage = lazy(() =>
  import("@/modules/marketing/pages/pricing-page").then((m) => ({
    default: m.PricingPage,
  })),
);
const AboutPage = lazy(() =>
  import("@/modules/marketing/pages/about-page").then((m) => ({
    default: m.AboutPage,
  })),
);
const ContactPage = lazy(() =>
  import("@/modules/marketing/pages/contact-page").then((m) => ({
    default: m.ContactPage,
  })),
);

const DashboardPage = lazy(() =>
  import("@/modules/doctor/pages/dashboard-page").then((m) => ({
    default: m.DashboardPage,
  })),
);
const DoctorAnalyticsPage = lazy(() =>
  import("@/modules/doctor/pages/analytics-page").then((m) => ({
    default: m.DoctorAnalyticsPage,
  })),
);
const PatientsPage = lazy(() =>
  import("@/modules/doctor/pages/patients-page").then((m) => ({
    default: m.PatientsPage,
  })),
);
const PatientDetailPage = lazy(() =>
  import("@/modules/doctor/pages/patient-detail-page").then((m) => ({
    default: m.PatientDetailPage,
  })),
);
const HighRiskPage = lazy(() =>
  import("@/modules/doctor/pages/high-risk-page").then((m) => ({
    default: m.HighRiskPage,
  })),
);
const AppointmentsPage = lazy(() =>
  import("@/modules/doctor/pages/appointments-page").then((m) => ({
    default: m.AppointmentsPage,
  })),
);

const PatientHomePage = lazy(() =>
  import("@/modules/patient/pages/home-page").then((m) => ({
    default: m.PatientHomePage,
  })),
);
const CarePlanPage = lazy(() =>
  import("@/modules/patient/pages/care-plan-page").then((m) => ({
    default: m.CarePlanPage,
  })),
);
const CheckInPage = lazy(() =>
  import("@/modules/patient/pages/check-in-page").then((m) => ({
    default: m.CheckInPage,
  })),
);
const MedicinesPage = lazy(() =>
  import("@/modules/patient/pages/medicines-page").then((m) => ({
    default: m.MedicinesPage,
  })),
);
const PatientAppointmentsPage = lazy(() =>
  import("@/modules/patient/pages/appointments-page").then((m) => ({
    default: m.AppointmentsPage,
  })),
);
const NotificationsPage = lazy(() =>
  import("@/modules/patient/pages/notifications-page").then((m) => ({
    default: m.NotificationsPage,
  })),
);
const PassportPage = lazy(() =>
  import("@/modules/patient/pages/passport-page").then((m) => ({
    default: m.PassportPage,
  })),
);
const ProfilePage = lazy(() =>
  import("@/modules/patient/pages/profile-page").then((m) => ({
    default: m.ProfilePage,
  })),
);
const SettingsPage = lazy(() =>
  import("@/modules/patient/pages/settings-page").then((m) => ({
    default: m.SettingsPage,
  })),
);
const AiAssistantPage = lazy(() =>
  import("@/modules/patient/pages/ai-assistant-page").then((m) => ({
    default: m.AiAssistantPage,
  })),
);
const RecoveryPage = lazy(() =>
  import("@/modules/patient/pages/recovery-page").then((m) => ({
    default: m.RecoveryPage,
  })),
);
const LifestyleSimulatorPage = lazy(() =>
  import("@/modules/patient/pages/lifestyle-simulator-page").then((m) => ({
    default: m.LifestyleSimulatorPage,
  })),
);

const AbhaPage = lazy(() =>
  import("@/modules/identity/pages/abha-page").then((m) => ({
    default: m.AbhaPage,
  })),
);
const BenefitsPage = lazy(() =>
  import("@/modules/identity/pages/benefits-page").then((m) => ({
    default: m.BenefitsPage,
  })),
);
const EmergencyProfilePage = lazy(() =>
  import("@/modules/identity/pages/emergency-profile-page").then((m) => ({
    default: m.EmergencyProfilePage,
  })),
);
const HospitalMapPage = lazy(() =>
  import("@/modules/identity/pages/hospital-map-page").then((m) => ({
    default: m.HospitalMapPage,
  })),
);
const PmjayPage = lazy(() =>
  import("@/modules/identity/pages/pmjay-page").then((m) => ({
    default: m.PmjayPage,
  })),
);

const RuralShell = lazy(() =>
  import("@/modules/rural/components/rural-shell").then((m) => ({
    default: m.RuralShell,
  })),
);
const RuralDashboardPage = lazy(() =>
  import("@/modules/rural/pages/dashboard-page").then((m) => ({
    default: m.RuralDashboardPage,
  })),
);
const RuralEducationPage = lazy(() =>
  import("@/modules/rural/pages/education-page").then((m) => ({
    default: m.RuralEducationPage,
  })),
);
const RuralNotificationsPage = lazy(() =>
  import("@/modules/rural/pages/notifications-page").then((m) => ({
    default: m.RuralNotificationsPage,
  })),
);
const RuralPatientsPage = lazy(() =>
  import("@/modules/rural/pages/patients-page").then((m) => ({
    default: m.RuralPatientsPage,
  })),
);
const RuralScreeningPage = lazy(() =>
  import("@/modules/rural/pages/screening-page").then((m) => ({
    default: m.RuralScreeningPage,
  })),
);
const RuralSyncPage = lazy(() =>
  import("@/modules/rural/pages/sync-page").then((m) => ({
    default: m.RuralSyncPage,
  })),
);
const RuralVisitsPage = lazy(() =>
  import("@/modules/rural/pages/visits-page").then((m) => ({
    default: m.RuralVisitsPage,
  })),
);

function Lazy({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={<LoadingScreen fullScreen={false} label="Opening…" />}
    >
      {children}
    </Suspense>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MarketingLayout />}>
          <Route
            path="/"
            element={
              <Lazy>
                <LandingPage />
              </Lazy>
            }
          />
          <Route
            path="/features"
            element={
              <Lazy>
                <FeaturesPage />
              </Lazy>
            }
          />
          <Route
            path="/pricing"
            element={
              <Lazy>
                <PricingPage />
              </Lazy>
            }
          />
          <Route
            path="/about"
            element={
              <Lazy>
                <AboutPage />
              </Lazy>
            }
          />
          <Route
            path="/contact"
            element={
              <Lazy>
                <ContactPage />
              </Lazy>
            }
          />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route path="/app" element={<HomeRedirect />} />

        <Route
          path="/emergency/:token"
          element={
            <Lazy>
              <EmergencyProfilePage />
            </Lazy>
          }
        />

        <Route element={<ProtectedRoute allowedRoles={["doctor"]} />}>
          <Route element={<AppLayout />}>
            <Route
              path="/doctor"
              element={
                <Lazy>
                  <DashboardPage />
                </Lazy>
              }
            />
            <Route
              path="/doctor/analytics"
              element={
                <Lazy>
                  <DoctorAnalyticsPage />
                </Lazy>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <Lazy>
                  <PatientsPage />
                </Lazy>
              }
            />
            <Route
              path="/doctor/patients/:patientId"
              element={
                <Lazy>
                  <PatientDetailPage />
                </Lazy>
              }
            />
            <Route
              path="/doctor/high-risk"
              element={
                <Lazy>
                  <HighRiskPage />
                </Lazy>
              }
            />
            <Route
              path="/doctor/appointments"
              element={
                <Lazy>
                  <AppointmentsPage />
                </Lazy>
              }
            />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["patient"]} />}>
          <Route element={<AppLayout />}>
            <Route
              path="/patient"
              element={
                <Lazy>
                  <PatientHomePage />
                </Lazy>
              }
            />
            <Route
              path="/patient/care-plan"
              element={
                <Lazy>
                  <CarePlanPage />
                </Lazy>
              }
            />
            <Route
              path="/patient/check-in"
              element={
                <Lazy>
                  <CheckInPage />
                </Lazy>
              }
            />
            <Route
              path="/patient/medicines"
              element={
                <Lazy>
                  <MedicinesPage />
                </Lazy>
              }
            />
            <Route
              path="/patient/appointments"
              element={
                <Lazy>
                  <PatientAppointmentsPage />
                </Lazy>
              }
            />
            <Route
              path="/patient/notifications"
              element={
                <Lazy>
                  <NotificationsPage />
                </Lazy>
              }
            />
            <Route
              path="/patient/passport"
              element={
                <Lazy>
                  <PassportPage />
                </Lazy>
              }
            />
            <Route
              path="/patient/profile"
              element={
                <Lazy>
                  <ProfilePage />
                </Lazy>
              }
            />
            <Route
              path="/patient/settings"
              element={
                <Lazy>
                  <SettingsPage />
                </Lazy>
              }
            />
            <Route
              path="/patient/ai-assistant"
              element={
                <Lazy>
                  <AiAssistantPage />
                </Lazy>
              }
            />
            <Route
              path="/patient/recovery-score"
              element={
                <Lazy>
                  <RecoveryPage />
                </Lazy>
              }
            />
            <Route
              path="/patient/lifestyle-simulator"
              element={
                <Lazy>
                  <LifestyleSimulatorPage />
                </Lazy>
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
              element={
                <Lazy>
                  <RuralShell />
                </Lazy>
              }
            >
              <Route
                path="/rural"
                element={
                  <Lazy>
                    <RuralDashboardPage />
                  </Lazy>
                }
              />
              <Route
                path="/rural/screening"
                element={
                  <Lazy>
                    <RuralScreeningPage />
                  </Lazy>
                }
              />
              <Route
                path="/rural/patients"
                element={
                  <Lazy>
                    <RuralPatientsPage />
                  </Lazy>
                }
              />
              <Route
                path="/rural/visits"
                element={
                  <Lazy>
                    <RuralVisitsPage />
                  </Lazy>
                }
              />
              <Route
                path="/rural/education"
                element={
                  <Lazy>
                    <RuralEducationPage />
                  </Lazy>
                }
              />
              <Route
                path="/rural/sync"
                element={
                  <Lazy>
                    <RuralSyncPage />
                  </Lazy>
                }
              />
              <Route
                path="/rural/offline"
                element={
                  <Lazy>
                    <RuralSyncPage />
                  </Lazy>
                }
              />
              <Route
                path="/rural/notifications"
                element={
                  <Lazy>
                    <RuralNotificationsPage />
                  </Lazy>
                }
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
            <Route path="/analytics" element={<AnalyticsRedirect />} />
            <Route
              path="/documents"
              element={<Navigate to="/government/abha" replace />}
            />
            <Route
              path="/maps"
              element={
                <Lazy>
                  <HospitalMapPage />
                </Lazy>
              }
            />
            <Route
              path="/government/pmjay"
              element={
                <Lazy>
                  <PmjayPage />
                </Lazy>
              }
            />
            <Route
              path="/government/abha"
              element={
                <Lazy>
                  <AbhaPage />
                </Lazy>
              }
            />
            <Route
              path="/government/benefits"
              element={
                <Lazy>
                  <BenefitsPage />
                </Lazy>
              }
            />
          </Route>
        </Route>

        <Route path="/home" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
