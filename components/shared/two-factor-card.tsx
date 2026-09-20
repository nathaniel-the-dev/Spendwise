"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { Copy, KeyRound, Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

/**
 * Opt-in two-factor (TOTP) for the account. Disabled by default: nothing here
 * runs unless the user opens it, and the sign-in challenge only appears once a
 * factor is verified. Enrollment is three acts — enroll (server makes the
 * secret), scan + confirm a code (challenge/verify flips it to verified), and
 * unenroll to remove it. An abandoned enrollment is unenrolled on cancel so no
 * half-verified factor is left behind.
 */
type Status = "loading" | "off" | "on";

export function TwoFactorCard() {
  const [status, setStatus] = useState<Status>("loading");
  const [enrolling, setEnrolling] = useState(false);
  const [uri, setUri] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [removing, setRemoving] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadStatus = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    if (!mounted.current) return;
    const verified = data?.totp?.some((f) => f.status === "verified");
    setStatus(verified ? "on" : "off");
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function startEnroll() {
    setEnrolling(true);
    try {
      const supabase = createClient();
      // Clear any factor left half-enrolled by an earlier abandoned attempt.
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.totp ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator",
      });
      if (error || !data) throw error ?? new Error("enroll failed");
      setFactorId(data.id);
      setUri(data.totp.uri);
      setSecret(data.totp.secret);
    } catch {
      toast.error("Couldn't start setup. Please try again.");
    } finally {
      setEnrolling(false);
    }
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.trim().length !== 6) return;
    setVerifying(true);
    try {
      const supabase = createClient();
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId });
      if (!challenge) throw new Error("challenge failed");
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: code.trim(),
      });
      if (error) throw error;
      await supabase.auth.refreshSession();
      toast.success("Two-factor is on. You'll enter a code at each sign-in.");
      setStatus("on");
      resetEnroll();
    } catch {
      toast.error("That code didn't verify. Check the time on your phone and try again.");
    } finally {
      setVerifying(false);
    }
  }

  function resetEnroll() {
    setUri(null);
    setSecret(null);
    setFactorId(null);
    setCode("");
  }

  async function cancelEnroll() {
    if (factorId) {
      const supabase = createClient();
      await supabase.auth.mfa.unenroll({ factorId }).catch(() => undefined);
    }
    resetEnroll();
  }

  async function disable() {
    setRemoving(true);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      for (const f of data?.totp ?? []) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      await supabase.auth.refreshSession();
      toast.success("Two-factor turned off.");
      setStatus("off");
    } catch {
      toast.error("Couldn't turn two-factor off. Try again.");
    } finally {
      setRemoving(false);
    }
  }

  async function copySecret() {
    if (!secret) return;
    await navigator.clipboard.writeText(secret);
    toast.success("Setup key copied.");
  }

  return (
    <Card className="animate-fade-in-up stagger-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {status === "on" ? (
              <ShieldCheck className="h-4 w-4 text-success" />
            ) : (
              <ShieldOff className="h-4 w-4 text-muted-foreground" />
            )}
            <CardTitle className="text-sm">Two-factor authentication</CardTitle>
          </div>
          {status !== "loading" && (
            <span
              className={
                status === "on"
                  ? "rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success"
                  : "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
              }
            >
              {status === "on" ? "On" : "Off"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {status === "loading" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking…
          </div>
        ) : status === "on" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your authenticator app is protecting this account. Sign-ins ask for a 6-digit code
              after the password.
            </p>
            <Button variant="outline" size="sm" onClick={disable} disabled={removing}>
              {removing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Turn off two-factor
            </Button>
          </div>
        ) : uri ? (
          <form onSubmit={confirmEnroll} className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Scan this code with your authenticator app (1Password, Authy, Google Authenticator…),
              then enter the 6-digit code it produces to confirm.
            </p>
            <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-4">
              <div className="rounded-lg bg-white p-3">
                <QRCode value={uri} size={168} aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={copySecret}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Can&apos;t scan? Copy the setup key
              </button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="totp-code" className="text-sm">
                Confirmation code
              </Label>
              <div className="flex gap-2">
                <Input
                  id="totp-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="max-w-40 text-center text-lg tabular-nums tracking-[0.3em]"
                />
                <Button type="submit" disabled={verifying || code.length !== 6}>
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <KeyRound className="h-4 w-4 mr-1.5" aria-hidden="true" />}
                  Confirm
                </Button>
              </div>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={cancelEnroll}>
              Cancel setup
            </Button>
          </form>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add a 6-digit code from an authenticator app on your phone, on top of your password.
              Off by default — nothing changes until you turn it on.
            </p>
            <Button variant="outline" size="sm" onClick={startEnroll} disabled={enrolling}>
              {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <ShieldCheck className="h-4 w-4 mr-1.5" aria-hidden="true" />}
              Turn on two-factor
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
