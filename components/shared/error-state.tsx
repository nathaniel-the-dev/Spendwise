"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Error card for failed data loads. A fetch failure must never render as an
 * empty state — users with data would be told they have none.
 */
export function ErrorState({
  title = "Couldn't load this section",
  description = "Check your connection and try again. Your data is safe.",
  onRetry,
  retrying = false,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
          <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
        {onRetry && (
          <Button variant="outline" size="sm" className="mt-4 gap-1.5" onClick={onRetry} disabled={retrying}>
            <RotateCcw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} aria-hidden="true" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
