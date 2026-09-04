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
};

export function CategoryFormDialog({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  title = "Create Category",
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
            <Input id="name" placeholder="e.g. Groceries" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              defaultValue={form.watch("type")}
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

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2">
              {categoryIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  data-active={form.watch("icon") === icon}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border text-xs hover:bg-accent data-[active=true]:border-primary data-[active=true]:bg-primary/10"
                  onClick={() => form.setValue("icon", icon)}
                  title={icon}
                  aria-label={icon}
                >
                  <CategoryIcon icon={icon} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {categoryColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  data-active={form.watch("color") === color}
                  className="h-7 w-7 rounded-full border-2 transition-all data-[active=true]:scale-110 data-[active=true]:border-foreground"
                  style={{ backgroundColor: color }}
                  onClick={() => form.setValue("color", color)}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{defaultValues?.name ? "Save" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
