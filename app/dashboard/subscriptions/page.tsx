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
import { Plus, Pencil, Trash2, Loader2, Calendar } from "lucide-react";
import {
  useSubscriptions,
  useCreateSubscription,
  useUpdateSubscription,
  useDeleteSubscription,
  type Subscription,
} from "@/hooks/use-subscriptions";
import { useCategories } from "@/hooks/use-categories";
import {
  SubscriptionFormDialog,
  type SubscriptionFormValues,
} from "@/components/shared/subscription-form-dialog";
import { formatCurrency, formatDate, normalizeBillingAmount } from "@/lib/utils";

export default function SubscriptionsPage() {
  const { data: subscriptions, isLoading } = useSubscriptions();
  const { data: categories } = useCategories();
  const createSubscription = useCreateSubscription();
  const updateSubscription = useUpdateSubscription();
  const deleteSubscription = useDeleteSubscription();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subscription | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function handleCreate(data: SubscriptionFormValues) {
    createSubscription.mutate({
      name: data.name,
      provider: data.provider || null,
      amount: data.amount,
      currency: data.currency,
      billingCycle: data.billingCycle,
      billingInterval: data.billingInterval || 1,
      categoryId: data.categoryId || null,
      startDate: new Date(data.startDate).toISOString(),
      nextBillingDate: new Date(data.nextBillingDate).toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
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
        currency: data.currency,
        billingCycle: data.billingCycle,
        billingInterval: data.billingInterval || 1,
        categoryId: data.categoryId || null,
        startDate: new Date(data.startDate).toISOString(),
        nextBillingDate: new Date(data.nextBillingDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        notes: data.notes || null,
      },
    }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
  }

  function handleDelete(id: string) {
    deleteSubscription.mutate(id, { onSuccess: () => setDeleting(null) });
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
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Subscriptions</h1>
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
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !subscriptions?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No subscriptions yet</p>
          <p className="text-sm">Add your first subscription to start tracking.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => {
            const monthlyAmount = normalizeBillingAmount(sub.amount, sub.billingCycle, sub.billingInterval, "monthly");
            const yearlyAmount = normalizeBillingAmount(sub.amount, sub.billingCycle, sub.billingInterval, "yearly");
            const nextDate = new Date(sub.nextBillingDate);
            const isUpcoming = nextDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            const cat = sub.categoryId ? categoryMap.get(sub.categoryId) : null;
            return (
              <Card key={sub.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-semibold uppercase text-muted-foreground flex-shrink-0">
                        {sub.name.charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{sub.name}</CardTitle>
                        {sub.provider && (
                          <p className="text-xs text-muted-foreground">{sub.provider}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label={`Edit ${sub.name} subscription`}
                        onClick={() => { setEditing(sub); setDialogOpen(true); }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" aria-label={`Delete ${sub.name} subscription`}
                        onClick={() => setDeleting(sub.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(sub.amount, sub.currency)}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {sub.billingCycle === "custom"
                        ? `Every ${sub.billingInterval} days`
                        : `Per ${sub.billingCycle}`}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                      ~{formatCurrency(monthlyAmount)}/mo &middot; ~{formatCurrency(yearlyAmount)}/yr
                    </span>
                    <Badge variant={statusVariant[sub.status] || "secondary"}>
                      {sub.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      Next: {formatDate(nextDate)}
                    </span>
                    {isUpcoming && sub.status === "active" && (
                      <Badge variant="outline">
                        Soon
                      </Badge>
                    )}
                  </div>

                  {cat && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
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
          currency: editing.currency,
          billingCycle: editing.billingCycle,
          billingInterval: editing.billingInterval,
          categoryId: editing.categoryId || "",
          startDate: new Date(editing.startDate).toISOString().split("T")[0],
          nextBillingDate: new Date(editing.nextBillingDate).toISOString().split("T")[0],
          endDate: editing.endDate ? new Date(editing.endDate).toISOString().split("T")[0] : "",
          notes: editing.notes || "",
        } : undefined}
        title={editing ? "Edit Subscription" : "Add Subscription"}
      />

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleting && handleDelete(deleting)}
              disabled={deleteSubscription.isPending}
            >
              {deleteSubscription.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
