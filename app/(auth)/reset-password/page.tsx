"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Lands here after the reset-link code is exchanged (auth/callback forwards
 * to /reset-password). The session in cookies is a recovery session: setting
 * the password upgrades it to a normal one and the user goes to the dashboard.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // A recovery session exists only if the link was valid and fresh.
    createClient().auth.getSession().then(({ data: { session } }) => {
      setReady(!!session);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    setIsLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError("This reset link no longer works. Request a new one.");
      setIsLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  if (ready === null) {
    return (
      <Card className="relative w-full max-w-[420px] overflow-hidden shadow-dialog rounded-xl">
        <CardContent className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Checking your reset link…
        </CardContent>
      </Card>
    );
  }

  if (!ready) {
    return (
      <Card className="relative w-full max-w-[420px] overflow-hidden shadow-dialog rounded-xl">
        <CardContent className="p-6 pt-9 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Link expired</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6 leading-relaxed">
            This reset link is invalid or has been used. Request a fresh one and try again.
          </p>
          <Button className="w-full h-11" onClick={() => router.replace("/login")}>
            Back to sign in
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative w-full max-w-[420px] overflow-hidden shadow-dialog rounded-xl">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary/25 to-transparent" />
      <CardContent className="p-6 pt-9">
        <div className="text-center mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Choose a new password</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Your identity is verified — pick something you haven&apos;t used here before
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new-password" className="text-sm">New Password</Label>
            <Input
              id="new-password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Use at least 8 characters.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> <span>Saving…</span></> : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
