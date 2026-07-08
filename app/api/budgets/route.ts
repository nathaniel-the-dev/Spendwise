import { db } from "@/lib/db";
import { budgets } from "@/lib/db/schema";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";

const createSchema = z.object({
  categoryId: z.string().optional().nullable(),
  amount: z.number(),
  currency: z.string().length(3).optional(),
  period: z.enum(["weekly", "monthly", "yearly"]),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
});

export async function GET() {
  try {
    const { userId } = await getAuthContext();
    const userBudgets = await db.query.budgets.findMany({
      where: eq(budgets.userId, userId),
      with: { category: true },
    });
    return NextResponse.json(userBudgets);
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

    const { categoryId, amount, currency, period, startDate, endDate } = parsed.data;
    const id = generateId();

    await db.insert(budgets).values({
      id,
      categoryId: categoryId ?? null,
      amount,
      currency: currency ?? "USD",
      period,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      userId,
    });

    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.id, id),
      with: { category: true },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
