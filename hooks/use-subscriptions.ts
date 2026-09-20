import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readableError } from "@/lib/api-error";

export type Subscription = {
  id: string;
  userId: string;
  name: string;
  provider: string | null;
  description: string | null;
  amount: number;
  currency: string;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  billingInterval: number;
  categoryId: string | null;
  startDate: string;
  nextBillingDate: string;
  endDate: string | null;
  status: "active" | "paused" | "cancelled";
  logo: string | null;
  notes: string | null;
  category?: { id: string; name: string; color: string } | null;
};

export type SubscriptionInput = {
  name: string;
  provider?: string | null;
  description?: string | null;
  amount: number;
  currency?: string;
  billingCycle: "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  billingInterval?: number;
  categoryId?: string | null;
  startDate: string;
  nextBillingDate: string;
  endDate?: string | null;
  status?: "active" | "paused" | "cancelled";
  logo?: string | null;
  notes?: string | null;
};

type RawSubscription = {
  id: string;
  user_id: string;
  name: string;
  provider: string | null;
  description: string | null;
  amount: number;
  currency: string;
  billing_cycle: "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  billing_interval: number | null;
  category_id: string | null;
  start_date: string;
  next_billing_date: string;
  end_date: string | null;
  status: "active" | "paused" | "cancelled";
  logo: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; color: string; icon: string } | null;
};

function mapSubscription(raw: RawSubscription): Subscription {
  return {
    id: raw.id,
    userId: raw.user_id,
    name: raw.name,
    provider: raw.provider,
    description: raw.description,
    amount: raw.amount,
    currency: raw.currency,
    billingCycle: raw.billing_cycle,
    billingInterval: raw.billing_interval ?? 1,
    categoryId: raw.category_id,
    startDate: raw.start_date,
    nextBillingDate: raw.next_billing_date,
    endDate: raw.end_date,
    status: raw.status,
    logo: raw.logo,
    notes: raw.notes,
    category: raw.category ?? null,
  };
}

async function fetchSubscriptions(): Promise<Subscription[]> {
  const res = await fetch("/api/subscriptions");
  if (!res.ok) throw new Error("Failed to fetch subscriptions");
  const data: RawSubscription[] = await res.json();
  return data.map(mapSubscription);
}

async function createSubscription(data: SubscriptionInput): Promise<Subscription> {
  const res = await fetch("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't save the subscription. Check the amount and dates, then try again."));
  }
  return mapSubscription(await res.json());
}

async function updateSubscription(id: string, data: Partial<SubscriptionInput>): Promise<Subscription> {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't update the subscription. Check the amount and dates, then try again."));
  }
  return mapSubscription(await res.json());
}

async function deleteSubscription(id: string): Promise<void> {
  const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't delete the subscription."));
  }
}

/** Re-creates a deleted subscription exactly as stored (used by Undo); no toast. */
async function restoreSubscription(s: Subscription): Promise<void> {
  const res = await fetch("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: s.name,
      provider: s.provider,
      description: s.description,
      amount: s.amount,
      currency: s.currency,
      billingCycle: s.billingCycle,
      billingInterval: s.billingInterval,
      categoryId: s.categoryId,
      startDate: s.startDate,
      nextBillingDate: s.nextBillingDate,
      endDate: s.endDate,
      status: s.status,
      logo: s.logo,
      notes: s.notes,
    }),
  });
  if (!res.ok) throw new Error("Undo failed");
}

export function useSubscriptions() {
  return useQuery({ queryKey: ["subscriptions"], queryFn: fetchSubscriptions, staleTime: 30_000 });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SubscriptionInput> }) =>
      updateSubscription(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/** Deletes with a 5s Undo, mirroring the transaction delete flow. */
export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sub: Subscription) => deleteSubscription(sub.id),
    onSuccess: (_data, sub) => {
      const invalidate = () => qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success(`${sub.name} deleted`, {
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              await restoreSubscription(sub);
              invalidate();
              toast.success("Subscription restored");
            } catch {
              toast.error("Couldn't undo — the subscription was not restored.");
            }
          },
        },
        duration: 5000,
      });
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
