"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/components/supabase-provider";
import { User, Palette, Shield, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

const accentColors = [
  { name: "Green", value: "oklch(0.62 0.17 155)", className: "bg-[oklch(0.62_0.17_155)]" },
  { name: "Rose", value: "oklch(0.58 0.19 10)", className: "bg-[oklch(0.58_0.19_10)]" },
  { name: "Violet", value: "oklch(0.55 0.2 290)", className: "bg-[oklch(0.55_0.2_290)]" },
  { name: "Amber", value: "oklch(0.72 0.16 75)", className: "bg-[oklch(0.72_0.16_75)]" },
  { name: "Cyan", value: "oklch(0.62 0.14 220)", className: "bg-[oklch(0.62_0.14_220)]" },
  { name: "Emerald", value: "oklch(0.62 0.17 155)", className: "bg-[oklch(0.62_0.17_155)]" },
];

export default function SettingsPage() {
  const { user } = useUser();
  const [selectedAccent, setSelectedAccent] = useState("oklch(0.62 0.17 155)");
  const [compactView, setCompactView] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [name, setName] = useState(user?.name ?? "");

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? "U";

  async function handleSaveProfile() {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
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
      setSaving(false);
    }
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
        <h1 className="text-xl md:text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Make SpendWise feel like yours.</p>
      </div>

      <Card className="animate-fade-in-up stagger-1">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={user?.image ?? undefined} />
              <AvatarFallback
                className="text-base"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                }}
              >
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-sm">Your Profile</CardTitle>
              <p className="text-xs text-muted-foreground">This is how others see you.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" disabled>
              <Camera className="h-4 w-4" />
              Change Photo
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive" disabled>
              Remove
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm">Display Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input id="email" type="email" defaultValue={user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
            Save Changes
          </Button>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact-view" className="text-sm">Compact View</Label>
              <p className="text-xs text-muted-foreground">Show more content with reduced spacing</p>
            </div>
            <Switch id="compact-view" checked={compactView} onCheckedChange={setCompactView} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Accent Color</Label>
            <p className="text-xs text-muted-foreground">Choose your app&apos;s personality.</p>
            <div className="flex gap-2.5 flex-wrap">
              {accentColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  title={color.name}
                  aria-label={`Select ${color.name} accent color`}
                  data-active={selectedAccent === color.value}
                  className="h-7 w-7 rounded-full transition-all hover:scale-110 data-[active=true]:scale-110 data-[active=true]:ring-2 data-[active=true]:ring-offset-2 data-[active=true]:ring-offset-background"
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedAccent(color.value)}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-sm">Dashboard Layout</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-active={!compactView}
                className="rounded-lg border p-3 text-left transition-all data-[active=true]:border-primary data-[active=true]:bg-primary/5 hover:border-primary/50"
                onClick={() => setCompactView(false)}
              >
                <p className="text-sm font-medium">Cozy</p>
                <p className="text-xs text-muted-foreground mt-0.5">Spacious cards with generous spacing</p>
              </button>
              <button
                type="button"
                data-active={compactView}
                className="rounded-lg border p-3 text-left transition-all data-[active=true]:border-primary data-[active=true]:bg-primary/5 hover:border-primary/50"
                onClick={() => setCompactView(true)}
              >
                <p className="text-sm font-medium">Compact</p>
                <p className="text-xs text-muted-foreground mt-0.5">Denser layout, more info at once</p>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-3">
        <CardHeader>
          <CardTitle className="text-sm">Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="currency" className="text-sm">Preferred Currency</Label>
            <Select defaultValue="USD">
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - US Dollar</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="GBP">GBP - British Pound</SelectItem>
                <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="week-start" className="text-sm">Week Starts On</Label>
            <Select defaultValue="monday">
              <SelectTrigger id="week-start">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monday">Monday</SelectItem>
                <SelectItem value="sunday">Sunday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-digest" className="text-sm">Weekly Email Digest</Label>
              <p className="text-xs text-muted-foreground">Get a summary of your spending every week</p>
            </div>
            <Switch id="email-digest" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa" className="text-sm">Two-Factor Authentication</Label>
              <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch id="2fa" />
          </div>
          <Separator />
          <form id="password-form" onSubmit={(e) => { e.preventDefault(); handleChangePassword(new FormData(e.currentTarget)); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="current-password" className="text-sm">Current Password</Label>
              <Input id="current-password" name="currentPassword" type="password" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-password" className="text-sm">New Password</Label>
              <Input id="new-password" name="newPassword" type="password" />
            </div>
            <Button variant="outline" type="submit" disabled={changingPassword}>
              {changingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
