"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { categoryIcons, categoryColors } from "@/lib/utils";
import { CategoryIcon } from "@/components/category-icon";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  color: z.string().optional(),
  type: z.enum(["expense", "income"]),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CategoryFormValues) => void;
  defaultValues?: Partial<CategoryFormValues>;
  title?: string;
  /** True while the parent's create/update mutation is in flight. */
  pending?: boolean;
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Create Category",
  pending = false,
}: Props) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", icon: "circle", color: "#6b7280", type: "expense", ...defaultValues },
  });

  useEffect(() => {
    if (open) form.reset({ name: "", icon: "circle", color: "#6b7280", type: "expense", ...defaultValues });
  }, [open, defaultValues, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Organize your transactions with categories.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="e.g. Groceries" aria-invalid={!!form.formState.errors.name} aria-describedby={form.formState.errors.name ? "category-name-error" : undefined} {...form.register("name")} />
            {form.formState.errors.name && (
              <p id="category-name-error" className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={form.watch("type")}
              onValueChange={(v) => form.setValue("type", v as "expense" | "income")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Icon</legend>
            <div className="grid max-h-28 grid-cols-7 gap-2 overflow-y-auto pr-1 sm:grid-cols-8">
              {categoryIcons.map((icon) => (
                <label key={icon} className="cursor-pointer" title={icon}>
                  <input
                    type="radio"
                    name="category-icon"
                    value={icon}
                    checked={form.watch("icon") === icon}
                    onChange={() => form.setValue("icon", icon, { shouldDirty: true })}
                    className="peer sr-only"
                  />
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg border text-xs hover:bg-accent peer-checked:border-primary peer-checked:bg-primary/10 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                    <CategoryIcon icon={icon} className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{icon}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Color</legend>
            <div className="flex flex-wrap gap-2">
              {categoryColors.map((color) => (
                <label key={color} className="cursor-pointer" title={color}>
                  <input
                    type="radio"
                    name="category-color"
                    value={color}
                    checked={form.watch("color") === color}
                    onChange={() => form.setValue("color", color, { shouldDirty: true })}
                    className="peer sr-only"
                  />
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 transition-transform peer-checked:scale-110 peer-checked:border-foreground peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
                    style={{ backgroundColor: color }}
                  >
                    <span className="sr-only">Color {color}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {defaultValues?.name ? "Save" : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
