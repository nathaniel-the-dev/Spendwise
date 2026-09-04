import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  preferredCurrency: z.string().length(3).optional(),
  locale: z.enum(["en", "es"]).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
});

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

    const { data, error } = await supabase
      .from("user")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
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
