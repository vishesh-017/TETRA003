import { Outlet } from "react-router-dom";

import { CaregiverProvider } from "./context";

export function CaregiverLayout() {
  return (
    <CaregiverProvider>
      <div className="caregiver-shell relative min-h-full">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(14,165,233,0.08),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_rgba(15,118,110,0.08),_transparent_45%)]" />
        <Outlet />
      </div>
    </CaregiverProvider>
  );
}
