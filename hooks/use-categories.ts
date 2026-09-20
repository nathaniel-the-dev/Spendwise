import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { readableError } from "@/lib/api-error";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
  userId: string;
};

export type CategoryInput = {
  name: string;
  icon?: string;
  color?: string;
  type?: "expense" | "income";
};

type RawCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "expense" | "income";
  user_id: string;
  created_at: string;
  updated_at: string;
};

function mapCategory(raw: RawCategory): Category {
  return {
    id: raw.id,
    name: raw.name,
    icon: raw.icon,
    color: raw.color,
    type: raw.type,
    userId: raw.user_id,
  };
}

async function fetchCategories(): Promise<Category[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data: RawCategory[] = await res.json();
  return data.map(mapCategory);
}

async function createCategory(data: CategoryInput): Promise<Category> {
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't save the category. Check the name, then try again."));
  }
  return mapCategory(await res.json());
}

async function updateCategory(id: string, data: Partial<CategoryInput>): Promise<Category> {
  const res = await fetch(`/api/categories/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't update the category. Check the name, then try again."));
  }
  return mapCategory(await res.json());
}

async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(await readableError(res, "Couldn't delete the category."));
  }
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryInput> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
