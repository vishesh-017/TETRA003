import { Outlet } from "react-router-dom";

import { MarketingFooter } from "@/modules/marketing/components/marketing-footer";
import { MarketingNav } from "@/modules/marketing/components/marketing-nav";

export function MarketingLayout() {
  return (
    <div className="marketing-shell min-h-dvh">
      <MarketingNav />
      <main>
        <Outlet />
      </main>
      <MarketingFooter />
    </div>
  );
}
