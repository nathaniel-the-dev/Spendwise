"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readableError } from "@/lib/api-error";

const feedbackSchema = z.object({
  name: z.string().trim().max(80).optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), "Enter a valid email"),
  category: z.enum(["bug", "question", "idea"]),
  message: z
    .string()
    .trim()
    .min(20, "Please add a bit more detail (20 characters minimum)")
    .max(4000, "Keep it under 4,000 characters"),
  /** Honeypot — rendered off-screen; humans never touch it. */
  website: z.string().optional(),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

/**
 * The support form. Posts to /api/feedback, which files the message as a
 * private issue in the maintainer's tracker — the UI never mentions GitHub.
 * `website` is a honeypot invisible to humans and screen readers.
 */
export function FeedbackForm() {
  const [sent, setSent] = useState(false);
  const form = useForm<FeedbackForm>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: { name: "", email: "", category: "question", message: "", website: "" },
  });

  async function onSubmit(data: FeedbackForm) {
    let res: Response | null = null;
    try {
      res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      res = null;
    }

    if (res?.ok) {
      setSent(true);
      form.reset();
      return;
    }
    toast.error(
      res
        ? await readableError(res, "We couldn't send your message. Please try again.")
        : "We couldn't reach the server. Check your connection and try again."
    );
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
        </span>
        <h3 className="text-sm font-semibold">Message received</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Thanks for reaching out — we&apos;ll read it and reply to your email if you left one.
        </p>
        <Button variant="ghost" size="sm" className="text-xs mt-1" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="fb-name" className="text-sm">Your name (optional)</Label>
          <Input id="fb-name" placeholder="How should we call you?" autoComplete="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fb-email" className="text-sm">Email (optional)</Label>
          <Input
            id="fb-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-describedby="fb-email-help"
            {...form.register("email")}
          />
          {form.formState.errors.email ? (
            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
          ) : (
            <p id="fb-email-help" className="text-xs text-muted-foreground">
              Leave this if you&apos;d like a reply.
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fb-category" className="text-sm">What&apos;s this about?</Label>
        <Select
          value={form.watch("category")}
          onValueChange={(v) => form.setValue("category", v as FeedbackForm["category"], { shouldDirty: true })}
        >
          <SelectTrigger id="fb-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="question">A question</SelectItem>
            <SelectItem value="bug">Something that looks broken</SelectItem>
            <SelectItem value="idea">An idea to make it better</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fb-message" className="text-sm">Message</Label>
        <textarea
          id="fb-message"
          rows={5}
          placeholder="What you expected, what happened, and roughly when — that's usually enough for us to find it."
          aria-describedby="fb-message-help"
          className="flex w-full rounded-xl border border-input bg-transparent px-3.5 py-2 text-sm shadow-sm transition-[color,box-shadow] placeholder:text-muted-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring aria-[invalid=true]:border-destructive"
          {...form.register("message")}
        />
        {form.formState.errors.message ? (
          <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>
        ) : (
          <p id="fb-message-help" className="text-xs text-muted-foreground">
            Please don&apos;t include real amounts, descriptions, or anything you&apos;d want kept private.
          </p>
        )}
      </div>

      {/* Honeypot — invisible to humans and assistive tech; bots fill it. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <Label htmlFor="fb-website">Website</Label>
        <Input id="fb-website" tabIndex={-1} autoComplete="off" {...form.register("website")} />
      </div>

      <Button type="submit" className="w-full gap-1.5 sm:w-auto" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" aria-hidden="true" /> Send message
          </>
        )}
      </Button>
    </form>
  );
}
