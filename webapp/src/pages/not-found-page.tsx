import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <Card className="max-w-md text-center">
        <CardHeader>
          <CardTitle className="font-display text-3xl">404</CardTitle>
          <CardDescription>
            The page you requested is not part of the HealNexus scaffold yet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/" className={cn(buttonVariants(), "inline-flex")}>
            Return home
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
