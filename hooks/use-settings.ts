import { useQuery } from "@tanstack/react-query";

export type Settings = {
  id: string;
  name: string;
  email: string;
  preferredCurrency: string;
  locale: string;
  theme: string;
  /** Day of month the financial month begins; null/undefined = calendar month. */
  payday: number | null;
};

type RawSettings = {
  id?: string;
  name?: string;
  email?: string;
  preferred_currency?: string;
  locale?: string;
  theme?: string;
  payday?: number | null;
};

function mapSettings(raw: RawSettings): Settings {
  return {
    id: raw.id ?? "",
    name: raw.name ?? "",
    email: raw.email ?? "",
    preferredCurrency: raw.preferred_currency ?? "USD",
    locale: raw.locale ?? "en",
    theme: raw.theme ?? "system",
    payday: raw.payday ?? null,
  };
}

async function fetchSettings(): Promise<Settings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return mapSettings((await res.json()) as RawSettings);
}

/**
 * Reads the user's persisted profile settings (shared by the settings page and
 * any surface that needs the user's display currency, locale, or theme).
 */
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
    staleTime: 60_000,
  });
}
