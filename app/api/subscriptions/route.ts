import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import {
  buildFxColumns,
  FX_MIGRATION_REQUIRED,
  isMissingFxColumnError,
} from "@/lib/fx";

const createSchema = z.object({
  name: z.string().min(1),
  provider: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number().finite().positive(),
  currency: z.string().length(3).optional(),
  fxRate: z.number().finite().positive().optional().nullable(),
  fxSource: z.enum(["auto", "manual"]).optional().nullable(),
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
    const supabase = await createClient();

    const { data, error: insertError } = await supabase
      .from("subscription")
      .select("*, category(*)")
      .eq("user_id", userId)
      .order("next_billing_date");

    return NextResponse.json(data ?? []);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();
    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      name, provider, description, amount, currency, fxRate, fxSource,
      billingCycle, billingInterval, categoryId, startDate, nextBillingDate,
      endDate, status, logo, notes,
    } = parsed.data;

    const id = generateId();

    // Subscriptions billed in a foreign currency (e.g. USD while the workspace
    // tracks JMD) snapshot the resolved amount so totals need no live rate.
    const fxColumns = buildFxColumns({ currency, amount, fxRate, fxSource });

    const { data, error: insertError } = await supabase
      .from("subscription")
      .insert({
        id,
        name,
        provider: provider ?? null,
        description: description ?? null,
        amount,
        currency: currency ?? "USD",
        billing_cycle: billingCycle,
        billing_interval: billingInterval ?? 1,
        category_id: categoryId ?? null,
        start_date: startDate,
        next_billing_date: nextBillingDate,
        end_date: endDate ?? null,
        status: status ?? "active",
        logo: logo ?? null,
        notes: notes ?? null,
        user_id: userId,
        ...fxColumns,
      })
      .select("*, category(*)")
      .single();

    if (insertError) {
      if (isMissingFxColumnError(insertError)) {
        return NextResponse.json({ error: FX_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
