"use client";

import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* Scroll-motion primitives for the landing page, built on GSAP ScrollTrigger.
 *
 * Every animation is gated behind `(prefers-reduced-motion: no-preference)`
 * via gsap.matchMedia, so the SSR-rendered markup is itself the reduced-motion
 * fallback — content is never hidden by CSS it can't undo. Cleanup reverts
 * all inline styles, which keeps HMR and route changes clean.
 *
 * The Kanso rule still applies: short distances, exponential ease-out, one
 * authored moment (the receipt's count-up + the seal stamping), everything
 * else a quiet rise. */

/** Rises a block into place once as it enters the viewport. */
export function Reveal({
  children,
  className,
  y = 24,
  x = 0,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  x?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(el, { autoAlpha: 0, y, x });
      gsap.to(el, {
        autoAlpha: 1,
        y: 0,
        x: 0,
        duration: 0.7,
        ease: "power3.out",
        delay,
        scrollTrigger: { trigger: el, start: "top 88%", once: true },
      });
    });
    return () => mm.revert();
  }, [y, x, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Staggers every [data-reveal] descendant in, triggered by the group. */
export function RevealGroup({
  children,
  className,
  stagger = 0.09,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const items = gsap.utils.toArray<HTMLElement>("[data-reveal]", root);
      if (!items.length) return;
      gsap.set(items, { autoAlpha: 0, y: 24 });
      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger,
        scrollTrigger: { trigger: root, start: "top 82%", once: true },
      });
    });
    return () => mm.revert();
  }, [stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Drifts an element against the scroll (positive sinks, negative rises). */
export function Parallax({
  children,
  className,
  speed = 48,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        el,
        { y: -speed / 2 },
        {
          y: speed / 2,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
    return () => mm.revert();
  }, [speed]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Rotates its child slowly, tied to scroll position across the viewport. */
export function ScrollSpin({
  children,
  className,
  rotate = 36,
}: {
  children: ReactNode;
  className?: string;
  rotate?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        el,
        { rotate: -rotate / 2 },
        {
          rotate: rotate / 2,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
    });
    return () => mm.revert();
  }, [rotate]);

  return <div ref={ref} className={className}>{children}</div>;
}

/** A hanko seal dropping onto the paper: fast descent, small settle-bounce. */
export function Stamp({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
      tl.from(el, { autoAlpha: 0, scale: 2.1, rotate: -10, duration: 0.32, ease: "power2.in" })
        .to(el, { scale: 0.94, duration: 0.08, ease: "none" })
        .to(el, { scale: 1, rotate: 0, duration: 0.22, ease: "power1.out" });
    });
    return () => mm.revert();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Counts a money figure up from zero when it scrolls into view — the one
 *  authored motion moment on the page. Renders the final value on the
 *  server; the count-up only replaces it when motion is allowed. */
export function CountUp({
  value,
  prefix = "",
  decimals = 2,
  duration = 1.4,
  className,
}: {
  value: number;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const fmt = useCallback(
    (v: number) =>
      prefix +
      v.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [prefix, decimals],
  );

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      const state = { v: 0 };
      el.textContent = fmt(0);
      gsap.to(state, {
        v: value,
        duration,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: () => {
          el.textContent = fmt(state.v);
        },
      });
    });
    return () => {
      mm.revert();
      el.textContent = fmt(value);
    };
  }, [value, duration, fmt]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {fmt(value)}
    </span>
  );
}
