import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Public "message us" endpoint used by the Support page form. Submissions are
 * filed as issues in GITHUB_FEEDBACK_REPO via a server-only fine-grained PAT —
 * the token never reaches the client, and the form never mentions the tracker.
 *
 * Abuse posture (this route has no auth by design): a honeypot field, a
 * per-IP rate limit, and hard length caps. Bots that fill `website` get a
 * fake success and nothing is filed.
 */

const schema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email"),
  category: z.enum(["bug", "question", "idea"]),
  message: z
    .string()
    .trim()
    .min(20, "Please add a bit more detail (20 characters minimum)")
    .max(4000, "Keep it under 4,000 characters"),
  /** Honeypot: must stay empty. Any value is schema-accepted so bots get a
   *  fake success instead of an informative 400 they could adapt to. */
  website: z.string().max(200).optional(),
});

const CATEGORY_LABELS: Record<z.infer<typeof schema>["category"], string> = {
  bug: "Bug report",
  question: "Question",
  idea: "Feature idea",
};

// ── Simple in-memory rate limit: RATE_MAX submissions per IP per window ──
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 3;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

// Periodic cleanup so the map can't grow unbounded on long-lived servers.
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of hits) {
    const fresh = times.filter((t) => now - t < RATE_WINDOW_MS);
    if (fresh.length === 0) hits.delete(ip);
    else hits.set(ip, fresh);
  }
}, RATE_WINDOW_MS).unref?.();

function firstLine(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

async function createIssue(repo: string, token: string, payload: Record<string, unknown>) {
  return fetch(`https://api.github.com/repos/${repo}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      "User-Agent": "spendwise-support-form",
    },
    body: JSON.stringify(payload),
  });
}

export async function POST(request: Request) {
  try {
    const token = process.env.GITHUB_FEEDBACK_TOKEN;
    const repo = process.env.GITHUB_FEEDBACK_REPO || "nathaniel-the-dev/Spendwise";
    if (!token) {
      return NextResponse.json(
        { error: "Messages aren't accepting submissions right now — please try again later." },
        { status: 503 }
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "That's a few too many messages at once — please wait a few minutes." },
        { status: 429 }
      );
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { name, email, category, message } = parsed.data;

    // Honeypot tripped: pretend it worked so bots don't adapt.
    if (parsed.data.website) {
      return NextResponse.json({ ok: true }, { status: 201 });
    }

    const title = `[${CATEGORY_LABELS[category]}] ${firstLine(message, 72)}`;
    const body = [
      message,
      "",
      "---",
      `From: ${name?.trim() || "anonymous"}${email ? ` (${email})` : ""}`,
      `Category: ${CATEGORY_LABELS[category]}`,
      `Page: ${new URL(request.referrer || request.url).pathname}`,
    ].join("\n");

    let gh = await createIssue(repo, token, { title, body, labels: ["user-feedback"] });
    if (gh.status === 422) {
      // The label may not exist in the repo yet — retry without it.
      gh = await createIssue(repo, token, { title, body });
    }
    if (!gh.ok) {
      console.error("Feedback issue creation failed:", gh.status, await gh.text().catch(() => ""));
      return NextResponse.json(
        { error: "We couldn't send your message right now. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Feedback API error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "We couldn't send your message right now. Please try again shortly." },
      { status: 500 }
    );
  }
}
