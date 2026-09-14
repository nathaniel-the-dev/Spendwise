"use client";

import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { currencies } from "@/lib/utils";

const currencyOptions: ComboboxOption[] = currencies.map((c) => ({
  value: c.code,
  label: `${c.code} - ${c.name}`,
  keywords: [c.code, c.name, c.symbol],
}));

type CurrencySelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  triggerClassName?: string;
  contentClassName?: string;
};

export function CurrencySelect({
  value,
  onValueChange,
  placeholder = "Select currency",
  disabled,
  id,
  triggerClassName,
  contentClassName,
}: CurrencySelectProps) {
  return (
    <Combobox
      value={value}
      onValueChange={onValueChange}
      options={currencyOptions}
      placeholder={placeholder}
      searchPlaceholder="Search currencies…"
      emptyText="No currencies found."
      disabled={disabled}
      id={id}
      triggerClassName={triggerClassName}
      contentClassName={contentClassName}
    />
  );
}
