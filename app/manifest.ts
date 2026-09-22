import type { MetadataRoute } from "next";

/**
 * Web App Manifest (PWA). Next.js serves this at /manifest.webmanifest and
 * auto-links it from the root layout, so no <link rel="manifest"> is needed.
 * Colors mirror the light-theme tokens in app/globals.css (oklch(0.975 0.006
 * 85) background → #faf8f5). Icons live in public/icons/ and are generated
 * from app/icon.png.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SpendWise — Budgeting without bank sync",
    short_name: "SpendWise",
    description:
      "Track expenses, budgets, and subscriptions by hand — no bank logins, no trackers, nothing to monetize. One honest number: what you can actually spend.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#faf8f5",
    theme_color: "#faf8f5",
    categories: ["finance", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
