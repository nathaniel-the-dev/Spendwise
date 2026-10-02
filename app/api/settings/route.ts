import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  preferredCurrency: z.string().length(3).optional(),
  locale: z.enum(["en", "es"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  avatarUrl: z.string().url().optional(),
  // Day of the month the user's financial month begins (their payday).
  // `null` means "use the calendar month" — the pre-pay-cycle behaviour.
  // Nullable so the setting can be cleared back to the default.
  payday: z.number().int().min(1).max(31).nullable().optional(),
});

export async function GET() {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();

    const selectColumns = async (columns: string) => {
      const { data, error } = await supabase
        .from("user")
        .select(columns)
        .eq("id", userId)
        .maybeSingle();
      return { data, error };
    };

    // PostgREST rejects an explicit column list that names a column the table
    // doesn't have, so selecting `payday` before the one-time SQL has been run
    // (see docs/pay-cycle.md) would 500 this endpoint for every user. Retry
    // without it so the app works both before and after the migration; the
    // client treats an absent `payday` as the calendar-month default.
    const withPayday = await selectColumns("id, name, email, preferred_currency, locale, theme, payday");
    const result = withPayday.error ? await selectColumns("id, name, email, preferred_currency, locale, theme") : withPayday;

    if (result.error) {
      console.error("Settings fetch error:", result.error);
      return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }

    return NextResponse.json(result.data ?? {});
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json({ error: messages }, { status: 400 });
    }

    // Keep auth metadata in sync so the displayed name/avatar change everywhere.
    const metadata: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) metadata.name = parsed.data.name;
    if (parsed.data.avatarUrl !== undefined) metadata.avatar_url = parsed.data.avatarUrl;

    if (Object.keys(metadata).length > 0) {
      const { error: metaError } = await supabase.auth.updateUser({ data: metadata });
      if (metaError) {
        console.error("Auth metadata update error:", metaError);
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 400 }
        );
      }
    }

    // Map camelCase request fields onto snake_case DB columns (avatarUrl is
    // metadata-only and is intentionally excluded from the DB row).
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.preferredCurrency !== undefined)
      updateData.preferred_currency = parsed.data.preferredCurrency;
    if (parsed.data.locale !== undefined) updateData.locale = parsed.data.locale;
    if (parsed.data.theme !== undefined) updateData.theme = parsed.data.theme;
    // Checked against `undefined`, not truthiness — `null` is a meaningful value
    // here (reset to the calendar month) and must reach the database.
    if (parsed.data.payday !== undefined) updateData.payday = parsed.data.payday;

    const { data, error } = await supabase
      .from("user")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Settings update error:", error);
      // The column doesn't exist until the one-time SQL in docs/pay-cycle.md is
      // run — surface that as an actionable message rather than a bare 500.
      if (parsed.data.payday !== undefined && /payday|column|schema/i.test(error.message)) {
        return NextResponse.json(
          { error: "Couldn't save the pay cycle — its database column hasn't been created yet." },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
