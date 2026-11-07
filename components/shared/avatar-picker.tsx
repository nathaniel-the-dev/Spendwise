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

        <fieldset className="space-y-1.5">
            <legend className="text-xs text-muted-foreground">Style</legend>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-11">
            {AVATAR_STYLES.map((s) => (
              <label key={s} className="cursor-pointer" title={s.replace(/-/g, " ")}>
                <input type="radio" name="avatar-style" value={s} checked={style === s} onChange={() => setStyle(s)} className="peer sr-only" />
                <span className="flex min-h-12 flex-col items-center gap-1 rounded-lg border border-transparent p-1.5 transition-colors hover:bg-muted peer-checked:border-primary peer-checked:bg-primary/5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={avatarUrl(s, seed)} alt="" />
                    <AvatarFallback className="text-[9px] capitalize">{s.replace(/-/g, " ").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="w-full truncate text-center text-[9px] capitalize leading-none text-muted-foreground">{s.replace(/-/g, " ")}</span>
                </span>
              </label>
            ))}
            </div>
        </fieldset>

        <fieldset className="space-y-1.5">
            <legend className="text-xs text-muted-foreground">Characters</legend>
            <div className="flex flex-wrap gap-2">
            {SAMPLE_SEEDS.map((sample) => {
              const isActive = sample === seed;
              return (
                <label key={sample} className="cursor-pointer" title={sample}>
                  <input type="radio" name="avatar-character" value={sample} checked={isActive} onChange={() => setSeed(sample)} className="peer sr-only" />
                  <span className="block rounded-full transition-all hover:scale-105 peer-checked:ring-2 peer-checked:ring-primary peer-checked:ring-offset-2 peer-checked:ring-offset-background peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={avatarUrl(style, sample)} alt="" />
                      <AvatarFallback className="text-xs">{sample.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Character {sample}</span>
                  </span>
                </label>
              );
            })}
            </div>
        </fieldset>

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
