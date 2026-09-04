"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

type UserData = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

type UserContextType = {
  user: UserData | null;
  loading: boolean;
};

const UserContext = createContext<UserContextType>({ user: null, loading: true });

function mapUser(user: User): UserData {
  return {
    id: user.id,
    name: user.user_metadata?.name ?? user.email?.split("@")[0] ?? "User",
    email: user.email ?? "",
    image: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
  };
}

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
      router.refresh();
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
