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
import { useSession } from "next-auth/react";
import { User, Globe, Palette, Shield, Camera } from "lucide-react";

const accentColors = [
  { name: "Teal", value: "oklch(0.52 0.12 160)", className: "bg-[oklch(0.52_0.12_160)]" },
  { name: "Rose", value: "oklch(0.55 0.18 10)", className: "bg-[oklch(0.55_0.18_10)]" },
  { name: "Violet", value: "oklch(0.52 0.16 280)", className: "bg-[oklch(0.52_0.16_280)]" },
  { name: "Amber", value: "oklch(0.65 0.18 70)", className: "bg-[oklch(0.65_0.18_70)]" },
  { name: "Cyan", value: "oklch(0.55 0.15 220)", className: "bg-[oklch(0.55_0.15_220)]" },
  { name: "Emerald", value: "oklch(0.55 0.14 150)", className: "bg-[oklch(0.55_0.14_150)]" },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [selectedAccent, setSelectedAccent] = useState("oklch(0.52 0.12 160)");
  const [compactView, setCompactView] = useState(false);

  const name = session?.user?.name ?? "User";
  const initial = name.charAt(0)?.toUpperCase() ?? "U";

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm md:text-base text-muted-foreground">Make SpendWise feel like yours.</p>
      </div>

      <Card className="animate-fade-in-up stagger-1">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 ring-2 ring-primary/20">
              <AvatarImage src={session?.user?.image ?? undefined} />
              <AvatarFallback
                className="text-lg"
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "#fff",
                }}
              >
                {initial}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>Your Profile</CardTitle>
              <p className="text-sm text-muted-foreground">This is how others see you.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2">
              <Camera className="h-4 w-4" />
              Change Photo
            </Button>
            <Button variant="ghost" size="sm" className="text-destructive">
              Remove
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" defaultValue={name} placeholder="Your name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={session?.user?.email ?? ""} disabled />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Appearance</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="compact-view">Compact View</Label>
              <p className="text-sm text-muted-foreground">Show more content with reduced spacing</p>
            </div>
            <Switch id="compact-view" checked={compactView} onCheckedChange={setCompactView} />
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Accent Color</Label>
            <p className="text-sm text-muted-foreground">Choose your app&apos;s personality.</p>
            <div className="flex gap-3 flex-wrap">
              {accentColors.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  title={color.name}
                  data-active={selectedAccent === color.value}
                  className="h-8 w-8 rounded-full transition-all hover:scale-110 data-[active=true]:scale-110 data-[active=true]:ring-2 data-[active=true]:ring-offset-2 data-[active=true]:ring-offset-background"
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedAccent(color.value)}
                />
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Dashboard Layout</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                data-active={!compactView}
                className="rounded-lg border p-4 text-left transition-all data-[active=true]:border-primary data-[active=true]:bg-primary/5 hover:border-primary/50"
                onClick={() => setCompactView(false)}
              >
                <Label className="text-sm font-medium cursor-pointer">Cozy</Label>
                <p className="text-xs text-muted-foreground mt-1">Spacious cards with generous spacing</p>
              </button>
              <button
                type="button"
                data-active={compactView}
                className="rounded-lg border p-4 text-left transition-all data-[active=true]:border-primary data-[active=true]:bg-primary/5 hover:border-primary/50"
                onClick={() => setCompactView(true)}
              >
                <Label className="text-sm font-medium cursor-pointer">Compact</Label>
                <p className="text-xs text-muted-foreground mt-1">Denser layout, more info at once</p>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-3">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Preferences</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Preferred Currency</Label>
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
          <div className="space-y-2">
            <Label htmlFor="week-start">Week Starts On</Label>
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
              <Label htmlFor="email-digest">Weekly Email Digest</Label>
              <p className="text-sm text-muted-foreground">Get a summary of your spending every week</p>
            </div>
            <Switch id="email-digest" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in-up stagger-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="2fa">Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Switch id="2fa" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          <Button variant="outline">Update Password</Button>
        </CardContent>
      </Card>
    </div>
  );
}
