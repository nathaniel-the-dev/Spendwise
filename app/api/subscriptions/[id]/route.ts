import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number().optional(),
  currency: z.string().length(3).optional(),
  amountInPreferred: z.number().optional().nullable(),
  billingCycle: z.enum(["weekly", "monthly", "quarterly", "yearly", "custom"]).optional(),
  billingInterval: z.number().optional(),
  categoryId: z.string().optional().nullable(),
  startDate: z.string().optional(),
  nextBillingDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
  status: z.enum(["active", "paused", "cancelled"]).optional(),
  logo: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const { id } = await params;

    const subscription = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)),
      with: { category: true },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json(subscription);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const { id } = await params;

    const existing = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = { ...parsed.data, updatedAt: new Date() };
    if (parsed.data.startDate) updateData.startDate = new Date(parsed.data.startDate);
    if (parsed.data.nextBillingDate) updateData.nextBillingDate = new Date(parsed.data.nextBillingDate);
    if (parsed.data.endDate !== undefined) {
      updateData.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
    }

    await db.update(subscriptions).set(updateData).where(eq(subscriptions.id, id));

    const updated = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, id),
      with: { category: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const { id } = await params;

    const existing = await db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, id), eq(subscriptions.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    await db.delete(subscriptions).where(eq(subscriptions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
