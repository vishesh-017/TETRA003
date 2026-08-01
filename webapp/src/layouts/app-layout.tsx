import { Outlet } from "react-router-dom";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { PageTransition } from "@/components/motion/page-transition";
import { ShellProvider } from "@/contexts/shell-context";
import { useCareGraphSync } from "@/hooks/use-care-graph-sync";

function CareGraphSync() {
  useCareGraphSync();
  return null;
}

export function AppLayout() {
  return (
    <ShellProvider>
      <CareGraphSync />
      <div className="flex h-dvh max-h-dvh overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
