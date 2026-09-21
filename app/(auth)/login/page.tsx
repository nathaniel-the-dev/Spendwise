"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "forgot">("signin");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      setNotice("Account created. Check your email to verify your address, then sign in.");
    } else if (params.get("error") === "auth") {
      setError("We couldn't complete sign in. Please try again.");
    }
  }, []);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) {
      setError("Invalid email or password");
      setIsLoading(false);
      return;
    }

    // Two-factor is opt-in per account: /mfa creates the challenge, and the
    // middleware keeps aal1 sessions out of the dashboard until it's verified.
    const { data: factors } = await supabase.auth.mfa.listFactors();
    if (factors?.totp?.some((f) => f.status === "verified")) {
      router.push("/mfa");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    // Always report success — the response must not reveal whether the
    // address has an account.
    setForgotSent(true);
    setIsLoading(false);
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signInError) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <Card className="relative w-full max-w-[420px] overflow-hidden shadow-dialog rounded-xl">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary/25 to-transparent" />
      <CardContent className="p-6 pt-9">
        <div className="text-center mb-6">
          <Link href="/" className="mb-4 inline-flex items-center gap-2 font-display text-base font-semibold tracking-tight lg:hidden">
            <Image src="/icon.png" alt="SpendWise logo" width={30} height={30} className="rounded-lg bg-white p-1 ring-1 ring-black/5" />
            <span>SpendWise</span>
          </Link>
          <h1 className="font-display text-2xl font-semibold tracking-[-0.01em]">
            {mode === "signin" ? "Welcome back" : "Reset your password"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {mode === "signin"
              ? "Sign in to your account to continue"
              : "We'll email you a secure link to choose a new password"}
          </p>
          {mode === "signin" && (
            <p className="text-xs text-muted-foreground mt-2">Your data stays yours — private by design, never sold, never bank-linked</p>
          )}
        </div>

        {notice && (
          <div className="bg-primary/10 text-primary text-sm rounded-lg p-3 mb-4" role="status">
            {notice}
          </div>
        )}

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3 mb-4" role="alert">
            {error}
          </div>
        )}

        {mode === "forgot" ? (
          forgotSent ? (
            <div className="space-y-4" role="status">
              <div className="bg-primary/10 text-primary text-sm rounded-lg p-4 leading-relaxed">
                If an account exists for <strong>{forgotEmail}</strong>, a reset link is on its way.
                It expires in 60 minutes. Check spam too.
              </div>
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => { setMode("signin"); setForgotSent(false); setError(null); }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <form key="forgot-form" onSubmit={handleForgot} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email" className="text-sm">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading || !forgotEmail}>
                {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> <span>Sending...</span></> : "Send reset link"}
              </Button>
              <button
                type="button"
                className="w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => { setMode("signin"); setError(null); }}
              >
                Remembered it? Back to sign in
              </button>
            </form>
          )
        ) : (
        <form key="signin-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!form.formState.errors.email}
              aria-describedby={form.formState.errors.email ? "login-email-error" : undefined}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p id="login-email-error" className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline"
                onClick={() => { setMode("forgot"); setError(null); }}
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className="pr-10"
                aria-invalid={!!form.formState.errors.password}
                aria-describedby={form.formState.errors.password ? "login-password-error" : undefined}
                {...form.register("password")}
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.formState.errors.password && (
              <p id="login-password-error" className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full h-11" disabled={isLoading}>
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> <span>Signing in...</span></> : "Sign In"}
          </Button>
        </form>
        )}

        {mode === "signin" && (
        <>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="label-mono bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full h-11 gap-2"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google
        </Button>
        </>
        )}
      </CardContent>
      <CardFooter className="justify-center px-6 pb-6 pt-0">
        <p className="text-sm text-muted-foreground">
          {mode === "signin" ? (
            <>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                Create one
              </Link>
            </>
          ) : (
            <>
              Need to sign in?{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => { setMode("signin"); setError(null); }}
              >
                Back
              </button>
            </>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}
