"use client";

import { useEffect } from "react";

/**
 * Safety net for Supabase's OAuth Site-URL fallback.
 *
 * On some Google consent paths (notably first-time sign-up) GoTrue completes
 * the flow but loses the stored redirect target and delivers the PKCE `code`
 * to the project's Site URL — the site root — instead of /auth/callback.
 * Nothing exchanges the code there, so the visitor lands on the homepage
 * signed out with a dangling one-time code in the URL.
 *
 * Detection is unambiguous: only /auth/callback ever consumes `?code=`, so
 * any page load carrying one is forwarded to the server callback, which
 * exchanges it and lands on /dashboard. A load carrying an OAuth `?error=`
 * is forwarded to the login page so the failure is shown instead of
 * silently rendering the marketing homepage.
 */
export function AuthCodeRescue() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      const qs = new URLSearchParams({ code });
      const next = params.get("next");
      // Same allow-check as the callback route: only same-site paths.
      if (next?.startsWith("/") && !next.startsWith("//")) qs.set("next", next);
      window.location.replace(`/auth/callback?${qs.toString()}`);
      return;
    }

    if (params.get("error")) {
      window.location.replace("/login?error=auth");
    }
  }, []);

  return null;
}
