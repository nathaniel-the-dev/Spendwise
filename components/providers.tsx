"use client";

import { SupabaseProvider, useUser } from "@/components/supabase-provider";
import { ThemeProvider } from "next-themes";
import {
  PersistQueryClientProvider,
  type PersistedClient,
  type Persister,
} from "@tanstack/react-query-persist-client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { OutboxSync } from "@/components/outbox-sync";
import { AuthCodeRescue } from "@/components/auth-code-rescue";
import { makeQueryClient } from "@/lib/query-client";
import {
  createQueryPersister,
  QUERY_CACHE_BUSTER,
  QUERY_CACHE_MAX_AGE,
  shouldDehydrateQuery,
} from "@/lib/query-persistence";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <QueryLayer>{children}</QueryLayer>
    </SupabaseProvider>
  );
}

/**
 * Chooses the query-cache scope for the current session. Keying the inner
 * tree by user id means a login/logout/account switch remounts with a fresh
 * QueryClient that restores (only) that account's persisted cache — combined
 * with the sign-out purge, one account's data never lingers into another's
 * session on a shared device.
 *
 * The cache-restore gate lives in the dashboard layout (the only consumer of
 * persisted queries), so marketing pages render their server HTML immediately.
 */
function QueryLayer({ children }: { children: React.ReactNode }) {
  const { user } = useUser();
  return (
    <PersistedQueryTree key={user?.id ?? "anon"} userId={user?.id}>
      {children}
    </PersistedQueryTree>
  );
}

const NOOP_PERSISTER: Persister = {
  persistClient: async () => {},
  restoreClient: async () => undefined as PersistedClient | undefined,
  removeClient: async () => {},
};

function PersistedQueryTree({
  userId,
  children,
}: {
  userId: string | undefined;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(makeQueryClient);
  const [persister] = useState<Persister>(() =>
    userId ? createQueryPersister(userId) : NOOP_PERSISTER
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: QUERY_CACHE_BUSTER,
        maxAge: QUERY_CACHE_MAX_AGE,
        dehydrateOptions: { shouldDehydrateQuery },
      }}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          {children}
          <ServiceWorkerRegister />
          <AuthCodeRescue />
          <OutboxSync />
        </TooltipProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
