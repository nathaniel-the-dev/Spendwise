import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { FX_MIGRATION_REQUIRED, isMissingFxColumnError, resolveFxUpdate } from "@/lib/fx";
import { ACCOUNT_MIGRATION_REQUIRED, isMissingAccountTableError } from "@/lib/accounts";

const TRANSFER_SELECT = "*, from_account:from_account_id(*), to_account:to_account_id(*)";

const updateSchema = z.object({
  fromAccountId: z.string().min(1).optional(),
  toAccountId: z.string().min(1).optional(),
  amount: z.number().finite().positive().optional(),
  currency: z.string().length(3).optional(),
  date: z.string().optional(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  fxRate: z.number().finite().positive().optional().nullable(),
  fxSource: z.enum(["auto", "manual"]).optional().nullable(),
});

const CROSS_CURRENCY_TRANSFER =
  "Transfers between different currencies aren't supported yet — both accounts must use the same currency.";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function getTransfer(supabase: Supabase, id: string, userId: string) {
  const { data } = await supabase
    .from("transfer")
    .select("*")
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

    const transfer = await getTransfer(supabase, id, userId);

    if (!transfer) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("transfer")
      .select(TRANSFER_SELECT)
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      if (isMissingAccountTableError(error)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase query error:", error);
      return NextResponse.json({ error: "Failed to fetch transfer" }, { status: 500 });
    }

    return NextResponse.json(data ?? transfer);
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

    const existing = await getTransfer(supabase, id, userId);

    if (!existing) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
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
    const fromAccountId = patch.fromAccountId ?? existing.from_account_id;
    const toAccountId = patch.toAccountId ?? existing.to_account_id;

    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: "Pick two different accounts." }, { status: 400 });
    }

    const accountIdsChanged =
      patch.fromAccountId !== undefined || patch.toAccountId !== undefined;

    if (accountIdsChanged) {
      const { data: accounts, error: accountsError } = await supabase
        .from("account")
        .select("id, currency")
        .in("id", [fromAccountId, toAccountId])
        .eq("user_id", userId);

      if (accountsError) {
        if (isMissingAccountTableError(accountsError)) {
          return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
        }
        console.error("Supabase query error:", accountsError);
        return NextResponse.json({ error: "Failed to update transfer" }, { status: 500 });
      }

      if (!accounts || accounts.length !== 2) {
        return NextResponse.json({ error: "One of those accounts isn't yours." }, { status: 400 });
      }

      const targetCurrency = patch.currency ?? existing.currency;
      const mismatch = accounts.some(
        (a) => a.currency && targetCurrency.toUpperCase() !== String(a.currency).toUpperCase()
      );
      if (mismatch) {
        return NextResponse.json({ error: CROSS_CURRENCY_TRANSFER }, { status: 400 });
      }
    }

    if (patch.currency) {
      const { data: settings } = await supabase
        .from("user")
        .select("preferred_currency")
        .eq("id", userId)
        .maybeSingle();
      const preferred = settings?.preferred_currency ?? null;
      if (preferred && patch.currency.toUpperCase() !== preferred.toUpperCase()) {
        return NextResponse.json({ error: CROSS_CURRENCY_TRANSFER }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (patch.fromAccountId !== undefined) updateData.from_account_id = patch.fromAccountId;
    if (patch.toAccountId !== undefined) updateData.to_account_id = patch.toAccountId;
    if (patch.amount !== undefined) updateData.amount = patch.amount;
    if (patch.currency !== undefined) updateData.currency = patch.currency;
    if (patch.date !== undefined) updateData.date = patch.date;
    if (patch.description !== undefined) updateData.description = patch.description;
    if (patch.notes !== undefined) updateData.notes = patch.notes;

    Object.assign(
      updateData,
      resolveFxUpdate({
        existing: {
          amount: Number(existing.amount),
          currency: existing.currency,
          fx_rate: existing.fx_rate,
          fx_source: existing.fx_source,
        },
        patch: {
          amount: patch.amount,
          currency: patch.currency,
          fxRate: patch.fxRate,
          fxSource: patch.fxSource,
        },
      })
    );

    const { data, error: updateError } = await supabase
      .from("transfer")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select(TRANSFER_SELECT)
      .single();

    if (updateError) {
      if (isMissingFxColumnError(updateError)) {
        return NextResponse.json({ error: FX_MIGRATION_REQUIRED }, { status: 400 });
      }
      if (isMissingAccountTableError(updateError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: "Failed to update transfer" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Unlike accounts, a transfer has no dependents — nothing references it, so a
 * real delete is safe and reversible through the client's 5s Undo re-POST.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();
    const { id } = await params;

    const existing = await getTransfer(supabase, id, userId);

    if (!existing) {
      return NextResponse.json({ error: "Transfer not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase
      .from("transfer")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (deleteError) {
      if (isMissingAccountTableError(deleteError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete transfer" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}