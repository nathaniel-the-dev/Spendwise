import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { generateId } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(["expense", "income"]).optional(),
});

export async function GET() {
  try {
    const { userId } = await getAuthContext();
    const userCategories = await db.query.categories.findMany({
      where: eq(categories.userId, userId),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
    return NextResponse.json(userCategories);
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

    const { name, icon, color, type } = parsed.data;
    const id = generateId();

    await db.insert(categories).values({
      id,
      name,
      icon: icon ?? "circle",
      color: color ?? "#6b7280",
      type: type ?? "expense",
      userId,
    });

    const category = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
