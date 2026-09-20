import { useId } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CountUp } from "@/components/marketing/scroll";

/**
 * Hand-authored SVG graphics for the landing page — the "Kanso Ledger" world
 * rendered as physical materials: paper grain, ledger ruling, sumi brush
 * strokes, contour rings, a hanko seal, and a printed receipt. Every filter
 * id is namespaced with useId so multiple instances never collide.
 * All components inherit color from `currentColor`, so tone is set with a
 * text-* class by the caller; nothing here hardcodes a palette value.
 */

/* ── Paper grain ────────────────────────────────────────────────
   Fractal-noise texture laid over a section as a printing pass.
   Multiply in light mode (fibers darken the paper), soft overlay in
   dark (grain lightens the pine ground). */
export function PaperGrain({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full opacity-[0.28] mix-blend-multiply dark:opacity-[0.12] dark:mix-blend-screen",
        className,
      )}
      aria-hidden="true"
    >
      <filter id={`grain-${id}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${id})`} />
    </svg>
  );
}

/* ── Paper texture ────────────────────────────────────────────
   A real washi scan laid in as a section's ground. Light mode lets the
   fibers show through the page color (multiply); dark mode drops it to a
   faint screen-lit grain so the pine ground keeps its depth. */
export function PaperTexture({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <Image
        src="/marketing/washi-paper.webp"
        alt=""
        fill
        sizes="100vw"
        priority
        className="h-full w-full object-cover opacity-70 mix-blend-multiply dark:opacity-[0.06] dark:mix-blend-screen"
      />
    </div>
  );
}

/* ── Ledger ruling ──────────────────────────────────────────────
   The account-book ground: faint horizontal rules every 32px fading
   out downward, plus a single vertical margin rule on the left. */
export function LedgerRules({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: [
          "repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, color-mix(in oklch, var(--border) 70%, transparent) 31px, color-mix(in oklch, var(--border) 70%, transparent) 32px)",
          "linear-gradient(to right, transparent calc(50% - 30rem), color-mix(in oklch, var(--primary) 22%, transparent) calc(50% - 30rem), color-mix(in oklch, var(--primary) 22%, transparent) calc(50% - 30rem + 1px), transparent calc(50% - 30rem + 1px))",
        ].join(", "),
        maskImage: "linear-gradient(to bottom, black 40%, transparent 92%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 40%, transparent 92%)",
      }}
    />
  );
}

/* ── Ink underline ──────────────────────────────────────────────
   A brush stroke that draws itself once under a headline phrase —
   the page's single authored motion moment (globals.css .ink-draw). */
export function InkUnderline({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 300 14"
      preserveAspectRatio="none"
      className={cn("pointer-events-none absolute inset-x-0 -bottom-1 h-3 w-full", className)}
      aria-hidden="true"
    >
      <filter id={`ruled-${id}`}>
        <feTurbulence type="turbulence" baseFrequency="0.035 0.09" numOctaves="2" seed="11" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="2.4" />
      </filter>
      <g filter={`url(#ruled-${id})`} fill="none" stroke="currentColor" strokeLinecap="round">
        <path
          d="M3 9 C 58 4, 118 11, 178 7 S 262 5, 297 8"
          strokeWidth="3.4"
          pathLength={1}
          className="ink-draw"
        />
        <path
          d="M14 12 C 84 8, 168 13, 288 10"
          strokeWidth="1.3"
          opacity="0.55"
          pathLength={1}
          className="ink-draw ink-draw-late"
        />
      </g>
    </svg>
  );
}

/* ── Contour field ──────────────────────────────────────────────
   Topographic rings warped by turbulence into organic contours —
   the ledger's "where the money wanders" motif. */
export function ContourField({ className }: { className?: string }) {
  const id = useId();
  const rings = [
    { rx: 42, ry: 34, rot: -14 },
    { rx: 70, ry: 56, rot: -10 },
    { rx: 98, ry: 78, rot: -20 },
    { rx: 126, ry: 100, rot: -8 },
    { rx: 154, ry: 122, rot: -16 },
    { rx: 182, ry: 146, rot: -11 },
  ];
  return (
    <svg viewBox="0 0 400 400" className={cn("pointer-events-none", className)} aria-hidden="true">
      <filter id={`warp-${id}`} x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence type="turbulence" baseFrequency="0.011" numOctaves="2" seed="7" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="26" />
      </filter>
      <g filter={`url(#warp-${id})`} fill="none" stroke="currentColor" strokeWidth="1.1">
        {rings.map((r) => (
          <ellipse
            key={`ring-${r.rx}`}
            cx="200"
            cy="200"
            rx={r.rx}
            ry={r.ry}
            transform={`rotate(${r.rot} 200 200)`}
            opacity={0.62 - rings.indexOf(r) * 0.07}
          />
        ))}
        <circle cx="200" cy="200" r="3.4" fill="currentColor" stroke="none" opacity="0.7" />
      </g>
    </svg>
  );
}

/* ── Doodle arrow ───────────────────────────────────────────────
   A hand-drawn connector between the numbered steps. */
export function DoodleArrow({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 28" className={cn("pointer-events-none", className)} aria-hidden="true">
      <filter id={`doodle-${id}`}>
        <feTurbulence type="turbulence" baseFrequency="0.05 0.08" numOctaves="2" seed="4" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="2" />
      </filter>
      <g filter={`url(#doodle-${id})`} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 15 C 20 5, 38 23, 56 12" strokeDasharray="0.5 4.5" />
        <path d="M50 6 L 57 12 L 48 17" />
      </g>
    </svg>
  );
}

/* ── Hanko seal ─────────────────────────────────────────────────
   A registration stamp for the privacy band: rough double ring with
   the display-face mark inside, edges eaten by turbulence like a real
   stamp's ink bite. */
export function HankoSeal({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 96 96" className={cn("pointer-events-none", className)} aria-hidden="true">
      <filter id={`seal-${id}`} x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="turbulence" baseFrequency="0.06" numOctaves="3" seed="2" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="3.6" />
      </filter>
      <g filter={`url(#seal-${id})`}>
        <circle cx="48" cy="48" r="41" fill="none" stroke="currentColor" strokeWidth="5" opacity="0.85" />
        <circle cx="48" cy="48" r="32" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.7" />
        <text
          x="48"
          y="61"
          textAnchor="middle"
          fontSize="34"
          fontWeight="600"
          fill="currentColor"
          style={{ fontFamily: "var(--font-display)" }}
        >
          $
        </text>
      </g>
    </svg>
  );
}

/* ── Ink arc ────────────────────────────────────────────────────
   A single sumi-e sweep for the committed band — broad, tapered,
   brassy-dry at the ends. The band's one graphic gesture. */
export function InkArc({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 720 320"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none", className)}
      aria-hidden="true"
    >
      <filter id={`brush-${id}`} x="-10%" y="-40%" width="120%" height="180%">
        <feTurbulence type="turbulence" baseFrequency="0.012 0.06" numOctaves="3" seed="9" result="t" />
        <feDisplacementMap in="SourceGraphic" in2="t" scale="14" />
      </filter>
      <g filter={`url(#brush-${id})`} fill="none" stroke="currentColor" strokeLinecap="round">
        <path d="M-30 280 C 160 70, 470 40, 750 210" strokeWidth="54" opacity="0.10" />
        <path d="M-30 280 C 160 70, 470 40, 750 210" strokeWidth="16" opacity="0.16" />
        <path d="M60 300 C 220 150, 470 120, 700 240" strokeWidth="5" opacity="0.22" />
      </g>
    </svg>
  );
}

/* ── Watermark glyph ────────────────────────────────────────────
   An oversized display-face character sitting behind a section,
   like a printer's ghost mark on the paper. */
export function WatermarkGlyph({ char, className }: { char: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "font-display select-none font-semibold leading-none text-primary/6 dark:text-primary/10",
        className,
      )}
    >
      {char}
    </span>
  );
}

/* ── Receipt card ───────────────────────────────────────────────
   The hero's proof object: a thermal-printed receipt whose bottom edge
   is torn, whose arithmetic is honest (4,280.00 − 2,150.40 − 287.00 =
   1,842.60), and whose one number is the product's answer. */
export function ReceiptCard({ className }: { className?: string }) {
  const rows = [
    { label: "Income this month", value: "$4,280.00", tone: "text-success" },
    { label: "Spent so far", value: "$2,150.40", tone: "text-spend" },
    { label: "Committed (subs)", value: "$287.00", tone: "text-warning" },
  ];

  // Zigzag tear across the bottom edge, generated so the teeth stay even.
  const teeth = 16;
  const depth = "10px";
  const pts = [`0% 0%`, `100% 0%`, `100% calc(100% - ${depth})`];
  for (let i = 0; i <= teeth; i++) {
    const x = 100 - (i * 100) / teeth;
    const y = i % 2 === 0 ? `calc(100% - ${depth})` : "100%";
    pts.push(`${x.toFixed(3)}% ${y}`);
  }
  pts.push(`0% calc(100% - ${depth})`);

  return (
    <div
      className={cn("relative w-full max-w-sm", className)}
      style={{
        filter: "drop-shadow(0 18px 30px rgb(0 0 0 / 0.10)) drop-shadow(0 4px 10px rgb(0 0 0 / 0.06))",
      }}
    >
      <div
        className="bg-card px-6 pb-9 pt-6"
        style={{ clipPath: `polygon(${pts.join(", ")})` }}
      >
        <div className="flex items-baseline justify-between">
          <span className="label-mono text-muted-foreground">SpendWise</span>
          <span className="label-mono text-muted-foreground">Sept · 20</span>
        </div>
        <div className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{r.label}</span>
              <span className={cn("font-medium tabular-nums", r.tone)}>{r.value}</span>
            </div>
          ))}
        </div>
        <div className="my-4 border-t border-dashed" />
        <p className="label-mono text-muted-foreground">Available this month</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight">
          <CountUp value={1842.6} prefix="$" duration={1.6} />
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
          Income, minus what&apos;s gone, minus what&apos;s committed. No guessing.
        </p>
        {/* faux barcode — the receipt's own texture, drawn from the data */}
        <Barcode value={184260} className="mt-5 h-8 w-full text-foreground/70" />
      </div>
      {/* hairline frame that the clip would cut, drawn as a sibling instead */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 rounded-none border border-b-0"
        style={{ borderColor: "color-mix(in oklch, var(--border) 70%, transparent)" }}
      />
    </div>
  );
}

function Barcode({ value, className }: { value: number; className?: string }) {
  // Deterministic pseudo-random bar widths from the total, so the barcode
  // "encodes" the number it sits under.
  const bars: number[] = [];
  let seed = value;
  for (let i = 0; i < 42; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    bars.push(1 + Math.round((seed / 233280) * 2.6));
  }
  let x = 0;
  return (
    <svg viewBox="0 0 220 32" preserveAspectRatio="none" className={className} aria-hidden="true">
      <g fill="currentColor">
        {bars.map((w, i) => {
          const bar = <rect key={`bar-${i}-${w}`} x={x} y={0} width={w} height={i % 7 === 3 ? 26 : 32} />;
          x += w + 2.4;
          return bar;
        })}
      </g>
    </svg>
  );
}
