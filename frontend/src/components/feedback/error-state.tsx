import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not complete that request. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {onRetry ? (
        <CardContent>
          <Button onClick={onRetry}>Try again</Button>
        </CardContent>
      ) : null}
    </Card>
  );
}
