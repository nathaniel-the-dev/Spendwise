"use client";

/**
 * Reloads the failed navigation. Kept as a tiny client island so /offline can
 * stay a server component (and export metadata).
 */
export function OfflineRetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      Try again
    </button>
  );
}
