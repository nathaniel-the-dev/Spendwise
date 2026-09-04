import { createClient } from "@/lib/supabase/server";
import { getAuthContext, handleError } from "@/lib/api-utils";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateId } from "@/lib/utils";

const createSchema = z.object({
  name: z.string().min(1),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(["expense", "income"]).optional(),
});

export async function GET() {
  try {
    const { userId } = await getAuthContext();
    const supabase = await createClient();

    const { data } = await supabase
      .from("category")
      .select("*")
      .eq("user_id", userId)
      .order("name");

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

    const { name, icon, color, type } = parsed.data;
    const id = generateId();

    const { data } = await supabase
      .from("category")
      .insert({
        id,
        name,
        icon: icon ?? "circle",
        color: color ?? "#6b7280",
        type: type ?? "expense",
        user_id: userId,
      })
      .select()
      .single();

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
