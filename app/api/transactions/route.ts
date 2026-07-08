import { db } from "@/lib/db";
import { transactions } from "@/lib/db/schema";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { eq, and, desc, gte, lte, like, or, sql } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";

const createSchema = z.object({
  amount: z.number(),
  currency: z.string().length(3).optional(),
  amountInPreferred: z.number().optional(),
  description: z.string().min(1),
  date: z.string(),
  type: z.enum(["expense", "income"]).optional(),
  categoryId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(request: Request) {
  try {
    const { userId } = await getAuthContext();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const categoryId = url.searchParams.get("categoryId");
    const type = url.searchParams.get("type");
    const startDate = url.searchParams.get("startDate");
    const endDate = url.searchParams.get("endDate");
    const limit = parseInt(url.searchParams.get("limit") ?? "50");
    const offset = parseInt(url.searchParams.get("offset") ?? "0");

    const conditions: import("drizzle-orm").SQL[] = [eq(transactions.userId, userId)];

    if (search) {
      conditions.push(
        or(
          like(transactions.description, `%${search}%`),
          like(transactions.notes ?? "", `%${search}%`)
        )!
      );
    }

    if (categoryId) {
      conditions.push(eq(transactions.categoryId, categoryId));
    }

    if (type) {
      conditions.push(eq(transactions.type, type as "expense" | "income"));
    }

    if (startDate) {
      conditions.push(gte(transactions.date, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(transactions.date, new Date(endDate)));
    }

    const results = await db.query.transactions.findMany({
      where: and(...conditions),
      orderBy: [desc(transactions.date), desc(transactions.createdAt)],
      limit,
      offset,
      with: { category: true },
    });

    return NextResponse.json(results);
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

    const { amount, currency, amountInPreferred, description, date, type, categoryId, tags, notes } = parsed.data;
    const id = generateId();

    await db.insert(transactions).values({
      id,
      amount,
      currency: currency ?? "USD",
      amountInPreferred: amountInPreferred ?? null,
      description,
      date: new Date(date),
      type: type ?? "expense",
      categoryId: categoryId ?? null,
      tags: tags ?? null,
      notes: notes ?? null,
      userId,
    });

    const transaction = await db.query.transactions.findFirst({
      where: eq(transactions.id, id),
      with: { category: true },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
