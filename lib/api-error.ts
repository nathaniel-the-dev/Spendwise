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
