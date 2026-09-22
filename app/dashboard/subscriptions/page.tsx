"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Calendar, Pause, Play, RefreshCcw } from "lucide-react";
import {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  type Subscription,
} from "@/hooks/use-subscriptions";
import { useCategories } from "@/hooks/use-categories";
import { useSettings } from "@/hooks/use-settings";
import {
  SubscriptionFormDialog,
  type SubscriptionFormValues,
} from "@/components/shared/subscription-form-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { formatCurrency, formatDate, normalizeBillingAmount, txValue } from "@/lib/utils";

export default function SubscriptionsPage() {
  const { data: subscriptions, isLoading, isError, refetch } = useSubscriptions();
  const { data: categories } = useCategories();
  const { data: settings } = useSettings();
  const preferredCurrency = settings?.preferredCurrency ?? "USD";
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState<Subscription | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  function handleCreate(data: SubscriptionFormValues) {
    createSubscription.mutate({
      name: data.name,
      provider: data.provider || null,
      amount: data.amount,
      currency: preferredCurrency,
      billingCycle: data.billingCycle,
      billingInterval: data.billingInterval || 1,
      categoryId: data.categoryId || null,
      startDate: new Date(data.startDate).toISOString(),
      nextBillingDate: new Date(data.nextBillingDate).toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      status: data.status || "active",
      notes: data.notes || null,
    }, { onSuccess: () => setDialogOpen(false) });
  }

  function handleUpdate(data: SubscriptionFormValues) {
    if (!editing) return;
    updateSubscription.mutate({
      id: editing.id,
      data: {
        name: data.name,
        provider: data.provider || null,
        amount: data.amount,
        currency: preferredCurrency,
        billingCycle: data.billingCycle,
        billingInterval: data.billingInterval || 1,
        categoryId: data.categoryId || null,
        startDate: new Date(data.startDate).toISOString(),
        nextBillingDate: new Date(data.nextBillingDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        status: data.status,
        notes: data.notes || null,
      },
    }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
  }

  function toggleStatus(sub: Subscription) {
    const next = sub.status === "active" ? "paused" : "active";
    setTogglingId(sub.id);
    updateSubscription.mutate(
      { id: sub.id, data: { status: next } },
      { onSettled: () => setTogglingId(null) }
    );
  }

  const categoryMap = new Map(categories?.map((c) => [c.id, c]));

  const statusVariant: Record<string, "success" | "warning" | "secondary"> = {
    active: "success",
    paused: "warning",
    cancelled: "secondary",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="label-mono text-muted-foreground mb-1.5">Subscriptions</p>
          <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em]">Know what renews next</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage your recurring subscriptions.
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Add Subscription
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Loading subscriptions" />
        </div>
      ) : isError && !subscriptions ? (
        <ErrorState
          title="Couldn't load your subscriptions"
          description="We couldn't reach your data. Nothing was lost — try again."
          onRetry={refetch}
        />
      ) : !subscriptions?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-3">
              <RefreshCcw className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold mb-1">No subscriptions yet</h2>
            <p className="text-sm text-muted-foreground mb-5 max-w-sm">
              Track recurring payments so renewals never surprise you.
            </p>
            <Button size="sm" className="gap-1.5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Add Your First Subscription
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => {
            const base = txValue(sub);
            const monthlyAmount = normalizeBillingAmount(base, sub.billingCycle, sub.billingInterval, "monthly");
            const yearlyAmount = normalizeBillingAmount(base, sub.billingCycle, sub.billingInterval, "yearly");
            const nextDate = new Date(sub.nextBillingDate);
            const isUpcoming = sub.status === "active" && nextDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const cat = sub.categoryId ? categoryMap.get(sub.categoryId) : null;
            return (
              <Card key={sub.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold uppercase flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${cat?.color ?? "#6b7280"} 14%, transparent)`, color: cat?.color ?? "var(--muted-foreground)" }}>
                        {sub.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{sub.name}</CardTitle>
                        {sub.provider && (
                          <p className="text-xs text-muted-foreground">{sub.provider}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg"
                        aria-label={sub.status === "active" ? `Pause ${sub.name}` : `Resume ${sub.name}`}
                        title={sub.status === "active" ? "Pause" : "Resume"}
                        onClick={() => toggleStatus(sub)}
                        disabled={togglingId === sub.id || sub.status === "cancelled"}
                      >
                        {togglingId === sub.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : sub.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label={`Edit ${sub.name} subscription`}
                        onClick={() => { setEditing(sub); setDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" aria-label={`Delete ${sub.name} subscription`}
                        onClick={() => setDeleting(sub)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(sub.amount, preferredCurrency)}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {sub.billingCycle === "custom"
                        ? `Every ${sub.billingInterval} days`
                        : `Per ${sub.billingCycle}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                      ~{formatCurrency(monthlyAmount, preferredCurrency)}/mo &middot; ~{formatCurrency(yearlyAmount, preferredCurrency)}/yr
                    </span>
                    <Badge variant={statusVariant[sub.status] || "secondary"} className="capitalize">
                      {sub.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span className="text-xs text-muted-foreground">
                      {sub.status === "cancelled" ? "Cancelled" : `Next: ${formatDate(nextDate)}`}
                    </span>
                    {isUpcoming && (
                      <Badge variant="outline">Soon</Badge>
                    )}
                  </div>

                  {cat && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} aria-hidden="true" />
                      <span className="text-xs text-muted-foreground">{cat.name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <SubscriptionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={editing ? handleUpdate : handleCreate}
        defaultValues={editing ? {
          name: editing.name,
          provider: editing.provider || "",
          amount: editing.amount,
          billingCycle: editing.billingCycle,
          billingInterval: editing.billingInterval,
          categoryId: editing.categoryId || "",
          startDate: new Date(editing.startDate).toISOString().split("T")[0],
          nextBillingDate: new Date(editing.nextBillingDate).toISOString().split("T")[0],
          endDate: editing.endDate ? new Date(editing.endDate).toISOString().split("T")[0] : "",
          status: editing.status,
          notes: editing.notes || "",
        } : undefined}
        title={editing ? "Edit Subscription" : "Add Subscription"}
      />

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleting?.name ?? "Subscription"}</DialogTitle>
            <DialogDescription>
              {deleting
                ? `${deleting.name} (${formatCurrency(deleting.amount, preferredCurrency)} ${deleting.billingCycle === "custom" ? `every ${deleting.billingInterval} days` : `per ${deleting.billingCycle}`}) will be removed. You can undo this for 5 seconds after deleting.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleting && deleteSubscription.mutate(deleting, { onSuccess: () => setDeleting(null) })}
              disabled={deleteSubscription.isPending}
            >
              {deleteSubscription.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
