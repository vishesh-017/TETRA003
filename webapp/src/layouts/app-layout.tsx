import { Outlet } from "react-router-dom";

import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { PageTransition } from "@/components/motion/page-transition";
import { ShellProvider } from "@/contexts/shell-context";

export function AppLayout() {
  return (
    <ShellProvider>
      <div className="flex min-h-dvh bg-background">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />
          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
            <PageTransition>
              <Outlet />
            </PageTransition>
          </main>
        </div>
      </div>
    </ShellProvider>
  );
}
