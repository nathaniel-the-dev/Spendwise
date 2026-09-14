// Dicebear avatar helpers.
// An avatar is identified by a Dicebear "style" plus a deterministic "seed".
// The final display URL is derived from both, so it can be regenerated/edited later.

export const DEFAULT_AVATAR_STYLE = "adventurer";

export const AVATAR_STYLES = [
  "adventurer",
  "avataaars",
  "bottts",
  "fun-emoji",
  "lorelei",
  "micah",
  "miniavs",
  "notionists",
  "open-peeps",
  "pixel-art",
  "thumbs",
] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];

export const SAMPLE_SEEDS = [
  "Mia",
  "Liam",
  "Noah",
  "Ava",
  "Leo",
  "Zoe",
  "Mason",
  "Ivy",
] as const;

const SEED_POOL = [
  "Aria",
  "Ezra",
  "Nova",
  "Kai",
  "Luna",
  "Finn",
  "Ruby",
  "Theo",
  "Wren",
  "Otis",
];

// Pastel background discs so each character stands out on both light & dark UIs.
const PALETTE = [
  "b6e3f4",
  "c0aede",
  "d1f4d9",
  "ffd5dc",
  "ffdfbf",
  "f4d7ff",
  "d7f4ff",
  "ffd1f0",
];

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Build a Dicebear avatar URL for a given style + seed. */
export function avatarUrl(style: string, seed: string): string {
  const bg = PALETTE[hashCode(seed) % PALETTE.length];
  return `https://api.dicebear.com/9.x/${encodeURIComponent(style)}/svg?seed=${encodeURIComponent(
    seed
  )}&backgroundColor=${bg}`;
}

/** Reverse an avatar URL back into its { style, seed } parts (null if not Dicebear). */
export function parseAvatarUrl(url: string | null | undefined): {
  style: string;
  seed: string;
} | null {
  if (!url) return null;
  const match = url.match(/\/9\.x\/([^/?]+)\/svg\?seed=([^&]+)/);
  if (!match) return null;
  return { style: decodeURIComponent(match[1]), seed: decodeURIComponent(match[2]) };
}

/** Pick a random seed for the "surprise me" behaviour. */
export function randomSeed(): string {
  return SEED_POOL[hashCode(`${Date.now()}-${Math.random()}`) % SEED_POOL.length];
}
