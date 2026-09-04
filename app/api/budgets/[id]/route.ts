import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateSchema = z.object({
  categoryId: z.string().optional().nullable(),
  amount: z.number().finite().positive().optional(),
  currency: z.string().length(3).optional(),
  period: z.enum(["weekly", "monthly", "yearly"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional().nullable(),
});

async function getBudget(supabase: Awaited<ReturnType<typeof createClient>>, id: string, userId: string) {
  const { data } = await supabase
    .from("budget")
    .select("*, category(*)")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();
    const { id } = await params;

    const budget = await getBudget(supabase, id, userId);

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
    const supabase = await createClient();
    const { id } = await params;

    const existing = await getBudget(supabase, id, userId);

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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.categoryId !== undefined) updateData.category_id = parsed.data.categoryId;
    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
    if (parsed.data.currency !== undefined) updateData.currency = parsed.data.currency;
    if (parsed.data.period !== undefined) updateData.period = parsed.data.period;
    if (parsed.data.startDate !== undefined) updateData.start_date = parsed.data.startDate;
    if (parsed.data.endDate !== undefined) updateData.end_date = parsed.data.endDate;

    const { data, error: updateError } = await supabase
      .from("budget")
      .update(updateData)
      .eq("id", id)
      .select("*, category(*)")
      .single();

    if (updateError) {
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: "Failed to update budget" }, { status: 500 });
    }

    return NextResponse.json(data);
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
    const supabase = await createClient();
    const { id } = await params;

    const existing = await getBudget(supabase, id, userId);

    if (!existing) {
      return NextResponse.json({ error: "Budget not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from("budget").delete().eq("id", id);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete budget" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
