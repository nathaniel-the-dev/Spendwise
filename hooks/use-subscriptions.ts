import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type Subscription = {
  id: string;
  userId: string;
  name: string;
  provider: string | null;
  description: string | null;
  amount: number;
  currency: string;
  amountInPreferred: number | null;
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
  amountInPreferred?: number;
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

async function fetchSubscriptions(): Promise<Subscription[]> {
  const res = await fetch("/api/subscriptions");
  if (!res.ok) throw new Error("Failed to fetch subscriptions");
  return res.json();
}

async function createSubscription(data: SubscriptionInput): Promise<Subscription> {
  const res = await fetch("/api/subscriptions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to create subscription");
  }
  return res.json();
}

async function updateSubscription(id: string, data: Partial<SubscriptionInput>): Promise<Subscription> {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update subscription");
  }
  return res.json();
}

async function deleteSubscription(id: string): Promise<void> {
  const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete subscription");
  }
}

export function useSubscriptions() {
  return useQuery({ queryKey: ["subscriptions"], queryFn: fetchSubscriptions });
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

export function useDeleteSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subscriptions"] });
      toast.success("Subscription deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
