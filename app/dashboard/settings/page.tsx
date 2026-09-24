"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { User, Palette, Shield, Monitor, Sun, Moon, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CurrencySelect } from "@/components/shared/currency-select";
import { AvatarPicker } from "@/components/shared/avatar-picker";
import { TwoFactorCard } from "@/components/shared/two-factor-card";
import { useUser } from "@/components/supabase-provider";
import { cn } from "@/lib/utils";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

type Profile = {
  name?: string;
  preferred_currency?: string;
  theme?: string;
};

export default function SettingsPage() {
  const { user, refresh } = useUser();
  const { setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name ?? "");
  const [currency, setCurrency] = useState("USD");
  const [themePref, setThemePref] = useState<string>("system");

  const [loading, setLoading] = useState(true);
  const [savingName, setSavingName] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  // Load persisted settings from the user profile row.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = (await res.json()) as Profile;
        if (!active) return;
        if (data.name) setName(data.name);
        if (data.preferred_currency) setCurrency(data.preferred_currency);
        if (data.theme) {
          setThemePref(data.theme);
          setTheme(data.theme);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSaveName() {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingName(false);
    }
  }

  async function handleAvatarApply(url: string) {
    setSavingAvatar(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: url }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save avatar");
      }
      await refresh();
      toast.success("Avatar updated");
      setPickerOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save avatar");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function persist(payload: Record<string, unknown>, successMsg: string) {
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      // Keep cached settings (display currency, locale, theme) fresh everywhere.
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast.success(successMsg);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    }
  }

  function handleCurrencyChange(value: string) {
    setCurrency(value);
    persist({ preferredCurrency: value }, "Currency preference saved");
  }

  function handleThemeChange(value: string) {
    setThemePref(value);
    setTheme(value);
    persist({ theme: value }, "Theme updated");
  }

  async function handleChangePassword(formData: FormData) {
    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    if (!currentPassword || !newPassword) {
      toast.error("Both password fields are required");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to change password");
      }
      toast.success("Password updated");
      (document.getElementById("password-form") as HTMLFormElement)?.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <div className="space-y-5 max-w-2xl animate-fade-in">
      <div>
        <p className="label-mono text-muted-foreground mb-1.5">Settings</p>
        <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-[-0.01em]">Make SpendWise yours</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card id="profile" className="animate-fade-in-up stagger-1">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                <AvatarImage src={user?.image ?? undefined} />
                <AvatarFallback className="text-2xl">{initial}</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-sm"
                onClick={() => setPickerOpen(true)}
                aria-label="Choose an avatar"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                Your Profile
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Personalize your avatar and account details.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={loading}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">
              Your sign-in email can't be changed here. To use a different email, create a new account or contact support.
            </p>
          </div>
          <Button onClick={handleSaveName} disabled={savingName || loading}>
            {savingName ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="animate-fade-in-up stagger-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">Theme</Label>
            <p className="text-xs text-muted-foreground">Choose how SpendWise looks for you.</p>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Theme">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                const active = themePref === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => handleThemeChange(option.value)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-lg border p-3 text-sm font-medium transition-all",
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="animate-fade-in-up stagger-3">
        <CardHeader>
          <CardTitle className="text-sm">Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="currency" className="text-sm">Currency</Label>
            <p className="text-xs text-muted-foreground">
              The currency everything is totalled in. Charges billed in another currency are
              converted when you enter them, at a rate you can see and edit.
            </p>
            <CurrencySelect
              value={currency}
              onValueChange={handleCurrencyChange}
              id="currency"
              disabled={loading}
              triggerClassName="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Two-factor (opt-in) */}
      <TwoFactorCard />

      {/* Security */}
      <Card className="animate-fade-in-up stagger-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form
            id="password-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleChangePassword(new FormData(e.currentTarget));
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-sm">Current Password</Label>
              <Input id="current-password" name="currentPassword" type="password" autoComplete="current-password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-sm">New Password</Label>
              <Input id="new-password" name="newPassword" type="password" autoComplete="new-password" />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters and include upper &amp; lowercase letters and a number.
              </p>
            </div>
            <Separator />
            <Button variant="outline" type="submit" disabled={changingPassword}>
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <AvatarPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        currentUrl={user?.image}
        seedHint={name}
        saving={savingAvatar}
        onApply={handleAvatarApply}
      />
    </div>
  );
}
