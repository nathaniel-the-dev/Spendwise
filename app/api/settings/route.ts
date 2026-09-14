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
});

export async function GET() {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user")
      .select("id, name, email, preferred_currency, locale, theme")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Settings fetch error:", error);
      return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }

    return NextResponse.json(data ?? {});
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

    const { data, error } = await supabase
      .from("user")
      .update(updateData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Settings update error:", error);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return handleError(error);
  }
}
