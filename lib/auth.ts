import { createClient } from "@/lib/supabase/server";

export async function auth() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return {
    user: {
      id: user.id,
      name:
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "User",
      email: user.email ?? "",
      image:
        user.user_metadata?.avatar_url ??
        user.user_metadata?.picture ??
        null,
    },
  };
}
