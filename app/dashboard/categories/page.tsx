"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { CategoryIcon } from "@/components/category-icon";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type Category,
} from "@/hooks/use-categories";
import {
  CategoryFormDialog,
  type CategoryFormValues,
} from "@/components/shared/category-form-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  function handleCreate(data: CategoryFormValues) {
    createCategory.mutate(data, { onSuccess: () => setDialogOpen(false) });
  }

  function handleUpdate(data: CategoryFormValues) {
    if (!editing) return;
    updateCategory.mutate(
      { id: editing.id, data },
      { onSuccess: () => { setDialogOpen(false); setEditing(null); } }
    );
  }

  function handleDelete(id: string) {
    deleteCategory.mutate(id, { onSuccess: () => setDeleting(null) });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize your transactions with categories.
          </p>
        </div>
        <Button
          className="gap-2 w-full sm:w-auto"
          onClick={() => { setEditing(null); setDialogOpen(true); }}
        >
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !categories?.length ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg mb-2">No categories yet</p>
          <p className="text-sm">Create your first category to start organizing expenses.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <CategoryIcon icon={cat.icon} className="h-5 w-5 text-foreground" />
                    </span>
                    <CardTitle className="text-base">{cat.name}</CardTitle>
                  </div>
                  <Badge variant={cat.type === "income" ? "success" : "default"}>
                    {cat.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label={`Edit ${cat.name} category`}
                      onClick={() => { setEditing(cat); setDialogOpen(true); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive" aria-label={`Delete ${cat.name} category`}
                      onClick={() => setDeleting(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={editing ? handleUpdate : handleCreate}
        defaultValues={editing ? { name: editing.name, icon: editing.icon, color: editing.color, type: editing.type } : undefined}
        title={editing ? "Edit Category" : "Create Category"}
      />

      <Dialog open={!!deleting} onOpenChange={() => setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure? Transactions in this category will be unlinked.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleting && handleDelete(deleting)}
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
