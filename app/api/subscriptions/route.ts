import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1),
  provider: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number(),
  currency: z.string().length(3).optional(),
  amountInPreferred: z.number().optional().nullable(),
  billingCycle: z.enum(["weekly", "monthly", "quarterly", "yearly", "custom"]),
  billingInterval: z.number().optional(),
  categoryId: z.string().optional().nullable(),
  startDate: z.string(),
  nextBillingDate: z.string(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["active", "paused", "cancelled"]).optional(),
  logo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const { userId } = await getAuthContext();
    const userSubscriptions = await db.query.subscriptions.findMany({
      where: eq(subscriptions.userId, userId),
      orderBy: (subs, { asc }) => [asc(subs.nextBillingDate)],
      with: { category: true },
    });
    return NextResponse.json(userSubscriptions);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await getAuthContext();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name, provider, description, amount, currency, amountInPreferred,
      billingCycle, billingInterval, categoryId, startDate, nextBillingDate,
      endDate, status, logo, notes,
    } = parsed.data;

    const id = generateId();

    await db.insert(subscriptions).values({
      id, name, provider: provider ?? null, description: description ?? null,
      amount, currency: currency ?? "USD", amountInPreferred: amountInPreferred ?? null,
      billingCycle, billingInterval: billingInterval ?? 1,
      categoryId: categoryId ?? null,
      startDate: new Date(startDate), nextBillingDate: new Date(nextBillingDate),
      endDate: endDate ? new Date(endDate) : null,
      status: status ?? "active", logo: logo ?? null, notes: notes ?? null,
      userId,
    });

    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, id),
      with: { category: true },
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
