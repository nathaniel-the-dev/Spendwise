import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1),
  provider: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  amount: z.number().finite().positive(),
  currency: z.string().length(3).optional(),
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
      name, provider, description, amount, currency,
      billingCycle, billingInterval, categoryId, startDate, nextBillingDate,
      endDate, status, logo, notes,
    } = parsed.data;

    const id = generateId();

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
      })
      .select("*, category(*)")
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
