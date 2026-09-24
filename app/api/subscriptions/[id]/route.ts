import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { FX_MIGRATION_REQUIRED, isMissingFxColumnError, resolveFxUpdate } from "@/lib/fx";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  provider: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number().finite().positive().optional(),
  currency: z.string().length(3).optional(),
  fxRate: z.number().finite().positive().optional().nullable(),
  fxSource: z.enum(["auto", "manual"]).optional().nullable(),
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

async function getSubscription(supabase: Awaited<ReturnType<typeof createClient>>, id: string, userId: string) {
  const { data } = await supabase
    .from("subscription")
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

    const subscription = await getSubscription(supabase, id, userId);

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
    const supabase = await createClient();
    const { id } = await params;

    const existing = await getSubscription(supabase, id, userId);

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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.provider !== undefined) updateData.provider = parsed.data.provider;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
    if (parsed.data.currency !== undefined) updateData.currency = parsed.data.currency;
    if (parsed.data.billingCycle !== undefined) updateData.billing_cycle = parsed.data.billingCycle;
    if (parsed.data.billingInterval !== undefined) updateData.billing_interval = parsed.data.billingInterval;
    if (parsed.data.categoryId !== undefined) updateData.category_id = parsed.data.categoryId;
    if (parsed.data.startDate !== undefined) updateData.start_date = parsed.data.startDate;
    if (parsed.data.nextBillingDate !== undefined) updateData.next_billing_date = parsed.data.nextBillingDate;
    if (parsed.data.endDate !== undefined) updateData.end_date = parsed.data.endDate;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
    if (parsed.data.logo !== undefined) updateData.logo = parsed.data.logo;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
    Object.assign(
      updateData,
      resolveFxUpdate({
        existing,
        patch: {
          amount: parsed.data.amount,
          currency: parsed.data.currency,
          fxRate: parsed.data.fxRate,
          fxSource: parsed.data.fxSource,
        },
      })
    );

    const { data, error: updateError } = await supabase
      .from("subscription")
      .update(updateData)
      .eq("id", id)
      .select("*, category(*)")
      .single();

    if (updateError) {
      if (isMissingFxColumnError(updateError)) {
        return NextResponse.json({ error: FX_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
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

    const existing = await getSubscription(supabase, id, userId);

    if (!existing) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from("subscription").delete().eq("id", id);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete subscription" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
