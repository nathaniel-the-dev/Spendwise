import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  amount: z.number().optional(),
  currency: z.string().length(3).optional(),
  amountInPreferred: z.number().optional().nullable(),
  description: z.string().min(1).optional(),
  date: z.string().optional(),
  type: z.enum(["expense", "income"]).optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const { id } = await params;

    const transaction = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
      with: { category: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(transaction);
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

    const existing = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
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
    if (parsed.data.date) {
      updateData.date = new Date(parsed.data.date);
    }

    await db.update(transactions).set(updateData).where(eq(transactions.id, id));

    const updated = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
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

    const existing = await db.query.transactions.findFirst({
      where: and(eq(transactions.id, id), eq(transactions.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    await db.delete(transactions).where(eq(transactions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
