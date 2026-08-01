import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { HealNexusLogo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
      <HealNexusLogo showTagline />
      <EmptyState
        icon={Compass}
        className="w-full max-w-md"
        title="This page isn’t here"
        description="The link may be outdated, or the view isn’t part of your current workspace."
        action={
          <Link to="/" className={cn(buttonVariants())}>
            Return home
          </Link>
        }
      />
    </div>
  );
}
