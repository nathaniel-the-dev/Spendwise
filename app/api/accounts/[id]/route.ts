import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ACCOUNT_TYPES,
  ACCOUNT_MIGRATION_REQUIRED,
  isMissingAccountTableError,
} from "@/lib/accounts";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
  currency: z.string().length(3).optional(),
  openingBalance: z.number().finite().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  includeInNetWorth: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

const CROSS_CURRENCY_ACCOUNT =
  "Cross-currency accounts aren't supported yet — this account must use your preferred currency.";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getAccountRow(supabase: Supabase, id: string, userId: string) {
  const { data } = await supabase
    .from("account")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

/** Read an account back through the balance view so responses always carry a balance. */
async function readBalance(supabase: Supabase, id: string) {
  const { data, error } = await supabase
    .from("account_balance")
    .select("*")
    .eq("account_id", id)
    .maybeSingle();

  if (error) {
    if (isMissingAccountTableError(error)) {
      return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
    }
    console.error("Supabase read error:", error);
    return NextResponse.json({ error: "Failed to read account" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();
    const { id } = await params;

    const account = await getAccountRow(supabase, id, userId);

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return readBalance(supabase, id);
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

    const existing = await getAccountRow(supabase, id, userId);

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const patch = parsed.data;

    if (patch.currency) {
      const { data: settings } = await supabase
        .from("user")
        .select("preferred_currency")
        .eq("id", userId)
        .maybeSingle();
      const preferred = settings?.preferred_currency ?? null;
      if (preferred && patch.currency.toUpperCase() !== preferred.toUpperCase()) {
        return NextResponse.json({ error: CROSS_CURRENCY_ACCOUNT }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (patch.name !== undefined) updateData.name = patch.name;
    if (patch.type !== undefined) updateData.type = patch.type;
    if (patch.currency !== undefined) updateData.currency = patch.currency;
    if (patch.openingBalance !== undefined) updateData.opening_balance = patch.openingBalance;
    if (patch.icon !== undefined) updateData.icon = patch.icon;
    if (patch.color !== undefined) updateData.color = patch.color;
    if (patch.includeInNetWorth !== undefined) updateData.include_in_net_worth = patch.includeInNetWorth;
    if (patch.isArchived !== undefined) updateData.is_archived = patch.isArchived;
    if (patch.sortOrder !== undefined) updateData.sort_order = patch.sortOrder;

    const { error: updateError } = await supabase
      .from("account")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      if (isMissingAccountTableError(updateError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
    }

    return readBalance(supabase, id);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Archives rather than deletes. `transfer` references accounts with
 * `on delete restrict`, and a hard delete would orphan history; archiving keeps
 * every balance and transfer intact while taking the account out of the active
 * list. The client's Undo flips `isArchived` back.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();
    const { id } = await params;

    const existing = await getAccountRow(supabase, id, userId);

    if (!existing) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("account")
      .update({ is_archived: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (updateError) {
      if (isMissingAccountTableError(updateError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: "Failed to archive account" }, { status: 500 });
    }

    return NextResponse.json({ success: true, archived: true, id });
  } catch (error) {
    return handleError(error);
  }
}