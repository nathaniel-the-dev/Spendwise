"use client";

import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/**
 * Second step of sign-in for accounts with two-factor enabled. Creates its own
 * challenge against the user's verified authenticator, verifies the 6-digit
 * code, then upgrades the session to aal2 and continues.
 */
export default function MfaPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "none">("loading");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const started = useRef(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const supabase = createClient();
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp?.find((f) => f.status === "verified");
      if (!verified) {
        setState("none");
        return;
      }
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: verified.id });
      if (!challenge?.id) {
        setError("Couldn't start the verification. Please try again.");
        setState("none");
        return;
      }
      setFactorId(verified.id);
      setChallengeId(challenge.id);
      setState("ready");
      requestAnimationFrame(() => inputsRef.current[0]?.focus());
    })();
  }, []);

  const code = digits.join("");

  async function sendChallenge() {
    if (!factorId) return;
    const supabase = createClient();
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId });
    if (challenge?.id) setChallengeId(challenge.id);
  }

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, "");
    if (!clean) {
      setDigits((d) => d.map((v, i) => (i === index ? "" : v)));
      return;
    }
    // multi-digit entry or paste spreads across the boxes
    setDigits((d) => {
      const next = [...d];
      for (let i = 0; i < clean.length && index + i < 6; i++) next[index + i] = clean[i];
      return next;
    });
    inputsRef.current[Math.min(index + clean.length, 5)]?.focus();
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    const text = e.clipboardData.getData("text")?.replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    setDigits(text.padEnd(6, " ").slice(0, 6).split("").map((c) => (c === " " ? "" : c)));
    inputsRef.current[Math.min(text.length, 5)]?.focus();
  }

  async function verify() {
    if (!factorId || !challengeId) return;
    setError(null);
    if (code.length !== 6) {
      setError("Enter all six digits from your authenticator.");
      return;
    }
    setIsLoading(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (verifyError) {
      setError("That code didn't work. Check your authenticator and try again.");
      setDigits(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
      setIsLoading(false);
      // challenges expire quickly — issue a fresh one for the next attempt
      await sendChallenge();
      return;
    }
    await supabase.auth.refreshSession();
    router.push("/dashboard");
    router.refresh();
  }

  if (state === "none") {
    return (
      <Card className="relative w-full max-w-[420px] overflow-hidden shadow-dialog rounded-xl">
        <CardContent className="p-6 pt-9 text-center">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">No authenticator set up</h1>
          <p className="text-sm text-muted-foreground mt-1 mb-6 leading-relaxed">
            This page only appears for accounts with two-factor enabled.
          </p>
          <Button className="w-full h-11" onClick={() => router.replace("/dashboard")}>
            Continue to dashboard
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
          <a href="/" className="mb-4 inline-flex items-center gap-2 font-display text-base font-semibold tracking-tight lg:hidden">
            <Image src="/icon.png" alt="SpendWise logo" width={30} height={30} className="rounded-lg bg-white p-1 ring-1 ring-black/5" />
            <span>SpendWise</span>
          </a>
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">Two-factor check</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        {state === "loading" ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Preparing verification…
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              verify();
            }}
          >
            {error && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4" role="alert">
                {error}
              </div>
            )}
            <div className="flex justify-center gap-2" onPaste={handlePaste} role="group" aria-label="Authentication code">
              {digits.map((d, i) => (
                <input
                  key={`digit-${i}`}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  aria-label={`Digit ${i + 1}`}
                  maxLength={6}
                  value={d}
                  disabled={isLoading}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !d && i > 0) inputsRef.current[i - 1]?.focus();
                  }}
                  className="h-12 w-11 rounded-lg border bg-transparent text-center text-lg font-semibold tabular-nums outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                />
              ))}
            </div>
            <Button type="submit" className="mt-6 w-full h-11" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> <span>Verifying…</span></> : "Verify and continue"}
            </Button>
            <button
              type="button"
              onClick={sendChallenge}
              className="mt-3 w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Code not working? Send a new challenge
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Lost your device? <a href="/support" className="text-primary hover:underline">Contact support</a> to restore access.
        </p>
      </CardContent>
    </Card>
  );
}
