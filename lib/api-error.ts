/**
 * True when an error means "the request never reached the server" — the
 * classic fetch TypeError (Failed to fetch) on an offline device, or a
 * dropped connection. TanStack Query surfaces network failures this way, so
 * callers can branch: queue the write / show cached data instead of a scary
 * error. navigator.onLine is the fast path; the message checks catch captive
 * portals and flaky links where the OS still claims to be online.
 */
export function isOfflineError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (error instanceof TypeError) return true; // "Failed to fetch"
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes("failed to fetch") ||
      msg.includes("networkerror") ||
      msg.includes("err_internet_disconnected") ||
      msg.includes("load failed")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Turn a failed API Response into a plain-language message that names the
 * problem and implies the fix, instead of a generic "Failed to create X".
 * Zod validation failures come back as { error: "Invalid input", details: {
 * fieldErrors: { amount: ["..."] } } } — surface the field message.
 */
export async function readableError(res: Response, fallback: string): Promise<string> {
  try {
    const body = await res.json();
    const details = body?.details?.fieldErrors as Record<string, string[]> | undefined;
    if (details) {
      const first = Object.entries(details).find(([, msgs]) => msgs?.length);
      if (first) return first[1][0];
    }
    if (body?.error && body.error !== "Invalid input") return body.error as string;
  } catch {
    /* non-JSON error body */
  }
  return fallback;
}
