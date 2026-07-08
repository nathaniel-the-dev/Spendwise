import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(["expense", "income"]).optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const { id } = await params;

    const category = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, userId)),
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
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

    const existing = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await db
      .update(categories)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(categories.id, id));

    const updated = await db.query.categories.findFirst({
      where: eq(categories.id, id),
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

    const existing = await db.query.categories.findFirst({
      where: and(eq(categories.id, id), eq(categories.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    await db.delete(categories).where(eq(categories.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
