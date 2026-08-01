import { Outlet } from "react-router-dom";

import { MarketingFooter } from "@/modules/marketing/components/marketing-footer";
import { MarketingNav } from "@/modules/marketing/components/marketing-nav";

export function MarketingLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <MarketingNav />
      <main>
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
