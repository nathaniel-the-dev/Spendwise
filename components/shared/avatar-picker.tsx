"use client";

import * as React from "react";
import { Dices } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AVATAR_STYLES,
  SAMPLE_SEEDS,
  DEFAULT_AVATAR_STYLE,
  avatarUrl,
  parseAvatarUrl,
  randomSeed,
} from "@/lib/avatar";
import { cn } from "@/lib/utils";

type AvatarPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current avatar URL (optional) used to prefill style + seed. */
  currentUrl?: string | null;
  /** Fallback seed when there is no existing avatar (e.g. the user's name). */
  seedHint?: string;
  saving?: boolean;
  onApply: (url: string) => void;
};

export function AvatarPicker({
  open,
  onOpenChange,
  currentUrl,
  seedHint,
  saving = false,
  onApply,
}: AvatarPickerProps) {
  const [style, setStyle] = React.useState<string>(DEFAULT_AVATAR_STYLE);
  const [seed, setSeed] = React.useState<string>("SpendWise");

  // Reset the local selection from the current avatar whenever the dialog opens.
  React.useEffect(() => {
    if (!open) return;
    const parsed = parseAvatarUrl(currentUrl);
    setStyle(parsed?.style ?? DEFAULT_AVATAR_STYLE);
    setSeed(parsed?.seed ?? seedHint?.trim() ?? "SpendWise");
  }, [open, currentUrl, seedHint]);

  const preview = avatarUrl(style, seed);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose an avatar</DialogTitle>
          <DialogDescription>
            Pick a style and character — SpendWise generates it for you.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20 ring-2 ring-primary/20">
            <AvatarImage src={preview} alt="Avatar preview" />
            <AvatarFallback className="text-xl">?</AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <Label htmlFor="avatar-seed" className="text-xs text-muted-foreground">
              Seed
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="avatar-seed"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
                className="h-8 w-44"
                placeholder="Your seed"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setSeed(randomSeed())}
                aria-label="Randomize avatar"
              >
                <Dices className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Style</Label>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
            {AVATAR_STYLES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStyle(s)}
                aria-label={s.replace(/-/g, " ")}
                aria-pressed={style === s}
                title={s.replace(/-/g, " ")}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
                  style === s
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-muted"
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl(s, seed)} alt="" />
                  <AvatarFallback className="text-[9px] capitalize">
                    {s.replace(/-/g, " ").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <span className="w-full truncate text-center text-[9px] capitalize leading-none text-muted-foreground">
                  {s.replace(/-/g, " ")}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Characters</Label>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SEEDS.map((sample) => {
              const isActive = sample === seed;
              return (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setSeed(sample)}
                  aria-label={`Character ${sample}`}
                  aria-pressed={isActive}
                  title={sample}
                  className={cn(
                    "rounded-full transition-all",
                    isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "hover:scale-105"
                  )}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl(style, sample)} alt="" />
                    <AvatarFallback className="text-xs">{sample.charAt(0)}</AvatarFallback>
                  </Avatar>
                </button>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving || !seed.trim()} onClick={() => onApply(preview)}>
            {saving ? "Saving…" : "Save avatar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
