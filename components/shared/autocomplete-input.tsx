"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Free-text input with suggestions from previous entries (e.g. past
 * transaction descriptions). Unlike the select-style Combobox, the value
 * stays freely typable — picking a suggestion is a shortcut, not a
 * constraint. Keyboard: ArrowDown/Up to move, Enter to accept the highlighted
 * suggestion, Escape to close.
 */
export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  id,
  placeholder,
  autoComplete = "off",
  className,
  inputRef,
  onKeyDown: onKeyDownProp,
  ...rest
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  id?: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
  inputRef?: React.Ref<HTMLInputElement>;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "id" | "placeholder" | "autoComplete" | "className">) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const ownRef = useRef<HTMLInputElement>(null);
  const ref = (inputRef ?? ownRef) as React.RefObject<HTMLInputElement>;

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of suggestions) {
      const key = s.toLowerCase();
      if (seen.has(key)) continue;
      if (q && (key === q || !key.includes(q))) continue;
      seen.add(key);
      out.push(s);
      if (out.length >= 6) break;
    }
    return out;
  }, [suggestions, value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const showList = open && matches.length > 0;

  function pick(s: string) {
    onChange(s);
    setOpen(false);
    setHighlight(-1);
    ref.current?.focus();
  }

  return (
    <div ref={wrapRef} className="relative">
      <Input
        id={id}
        ref={ref}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={showList ? `${id ?? "ac"}-listbox` : undefined}
        aria-activedescendant={highlight >= 0 ? `${id ?? "ac"}-opt-${highlight}` : undefined}
        className={className}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && showList) {
            e.preventDefault();
            setHighlight((h) => (h + 1) % matches.length);
          } else if (e.key === "ArrowUp" && showList) {
            e.preventDefault();
            setHighlight((h) => (h <= 0 ? matches.length - 1 : h - 1));
          } else if (e.key === "Enter" && showList && highlight >= 0) {
            e.preventDefault();
            pick(matches[highlight]);
          } else if (e.key === "Escape" && showList) {
            e.preventDefault();
            e.stopPropagation();
            setOpen(false);
          }
          onKeyDownProp?.(e);
        }}
        {...rest}
      />
      {showList && (
        <ul
          id={`${id ?? "ac"}-listbox`}
          role="listbox"
          aria-label="Previous entries"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-dialog"
        >
          {matches.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                id={`${id ?? "ac"}-opt-${i}`}
                role="option"
                aria-selected={i === highlight}
                className={cn(
                  "flex w-full items-center rounded-lg px-2.5 py-1.5 text-left text-sm outline-none",
                  i === highlight ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                )}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => pick(s)}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
