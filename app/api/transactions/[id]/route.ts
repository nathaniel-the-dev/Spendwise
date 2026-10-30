import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { FX_MIGRATION_REQUIRED, isMissingFxColumnError, resolveFxUpdate } from "@/lib/fx";
import { ACCOUNT_MIGRATION_REQUIRED, isMissingAccountTableError } from "@/lib/accounts";

const updateSchema = z.object({
  amount: z.number().finite().positive().optional(),
  currency: z.string().length(3).optional(),
  fxRate: z.number().finite().positive().optional().nullable(),
  fxSource: z.enum(["auto", "manual"]).optional().nullable(),
  description: z.string().min(1).optional(),
  date: z.string().optional(),
  type: z.enum(["expense", "income"]).optional(),
  categoryId: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/** `account` embed so an edited row reports which account it landed in. */
const TRANSACTION_SELECT = "*, category(*), account(*)";

async function getTransaction(supabase: Awaited<ReturnType<typeof createClient>>, id: string, userId: string) {
  const { data } = await supabase
    .from("transaction")
    .select(TRANSACTION_SELECT)
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

    const transaction = await getTransaction(supabase, id, userId);

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json(transaction);
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

    const existing = await getTransaction(supabase, id, userId);

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
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

    if (parsed.data.amount !== undefined) updateData.amount = parsed.data.amount;
    if (parsed.data.currency !== undefined) updateData.currency = parsed.data.currency;
    if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
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
    if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
    if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
    if (parsed.data.categoryId !== undefined) updateData.category_id = parsed.data.categoryId;
    // Same ownership guard as the create route, so re-assigning to someone
    // else's account is a clear 400 rather than an FK violation.
    if (parsed.data.accountId) {
      const { data: account, error: accountError } = await supabase
        .from("account")
        .select("id")
        .eq("id", parsed.data.accountId)
        .eq("user_id", userId)
        .maybeSingle();

      if (accountError) {
        if (isMissingAccountTableError(accountError)) {
          return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
        }
        console.error("Supabase query error:", accountError);
        return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
      }

      if (!account) {
        return NextResponse.json({ error: "That account isn't yours." }, { status: 400 });
      }
    }
    if (parsed.data.accountId !== undefined) updateData.account_id = parsed.data.accountId;
    if (parsed.data.tags !== undefined) updateData.tags = parsed.data.tags;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;

    const { data, error: updateError } = await supabase
      .from("transaction")
      .update(updateData)
      .eq("id", id)
      .select(TRANSACTION_SELECT)
      .single();

    if (updateError) {
      if (isMissingFxColumnError(updateError)) {
        return NextResponse.json({ error: FX_MIGRATION_REQUIRED }, { status: 400 });
      }
      if (isMissingAccountTableError(updateError)) {
        return NextResponse.json({ error: ACCOUNT_MIGRATION_REQUIRED }, { status: 400 });
      }
      console.error("Supabase update error:", updateError);
      return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
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

    const existing = await getTransaction(supabase, id, userId);

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const { error: deleteError } = await supabase.from("transaction").delete().eq("id", id);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete transaction" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
