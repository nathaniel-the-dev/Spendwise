"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category } from "@/hooks/use-categories";

/**
 * Category dropdown that carries each category's color dot, so the same
 * visual identity used on charts and badges also works for recognition while
 * picking. `noneValue` adds an explicit "no category" option.
 */
export function CategorySelect({
  categories,
  value,
  onValueChange,
  placeholder = "Select category",
  noneLabel,
  id,
  className,
}: {
  categories: Category[] | undefined;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  noneLabel?: string;
  id?: string;
  className?: string;
}) {
  return (
    <Select value={noneLabel ? value || "none" : value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {noneLabel && <SelectItem value="none">{noneLabel}</SelectItem>}
        {categories?.map((cat) => (
          <SelectItem key={cat.id} value={cat.id}>
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: cat.color }}
                aria-hidden="true"
              />
              {cat.name}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
