import { db } from "@/lib/db";
import { budgets } from "@/lib/db/schema";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  categoryId: z.string().optional().nullable(),
  amount: z.number().optional(),
  currency: z.string().length(3).optional(),
  period: z.enum(["weekly", "monthly", "yearly"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const { id } = await params;

    const budget = await db.query.budgets.findFirst({
      where: and(eq(budgets.id, id), eq(budgets.userId, userId)),
      with: { category: true },
    });

    if (!budget) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    return NextResponse.json(budget);
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

    const existing = await db.query.budgets.findFirst({
      where: and(eq(budgets.id, id), eq(budgets.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
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
    if (parsed.data.endDate !== undefined) {
      updateData.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
    }

    await db.update(budgets).set(updateData).where(eq(budgets.id, id));

    const updated = await db.query.budgets.findFirst({
      where: eq(budgets.id, id),
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

    const existing = await db.query.budgets.findFirst({
      where: and(eq(budgets.id, id), eq(budgets.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    await db.delete(budgets).where(eq(budgets.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
