export const CREDIT_MODES = ["roller", "cards", "static"] as const;
export const CREDIT_ORDERS = ["listed", "shuffled"] as const;
export const CREDIT_FONTS = ["sans", "mono"] as const;

export type CreditMode = (typeof CREDIT_MODES)[number];

/**
 * Everything the credits render from. The page is a pure function of this
 * object: the seed drives the shuffled order and the film-gate weave, so a
 * saved config reproduces exactly what was saved.
 */
export type CreditsConfig = {
  seed: number;
  mode: CreditMode;
  order: (typeof CREDIT_ORDERS)[number];
  slate: string;
  endCard: string;
  /** roller: crawl speed, px per second */
  speed: number;
  /** roller: empty run between loops, in viewport heights */
  loopGap: number;
  /** cards: names per card */
  perCard: number;
  /** cards: seconds each card holds */
  hold: number;
  /** cards: crossfade, ms */
  fade: number;
  font: (typeof CREDIT_FONTS)[number];
  uppercase: boolean;
  fontSize: number;
  /** letter-spacing, em */
  tracking: number;
  avatar: number;
  /** distance from the center axis to the avatar and to the handle, px */
  gutter: number;
  rowGap: number;
  /** space around the slate and the end card, px */
  blockGap: number;
  /** avatar grayscale at rest, 0..1 */
  mute: number;
  /** text opacity at rest, 0..1 */
  dim: number;
  /** film-gate weave amplitude, px */
  weave: number;
  /** projector flicker depth, 0..1 */
  flicker: number;
};

export const DEFAULT_CREDITS: CreditsConfig = {
  seed: 1,
  mode: "roller",
  order: "listed",
  slate: "Inspired by",
  endCard: "Thank you",
  speed: 28,
  loopGap: 0.6,
  perCard: 1,
  hold: 2.6,
  fade: 700,
  font: "sans",
  uppercase: true,
  fontSize: 15,
  tracking: 0.14,
  avatar: 36,
  gutter: 14,
  rowGap: 44,
  blockGap: 120,
  mute: 1,
  dim: 0.82,
  weave: 0.4,
  flicker: 0.04,
};

/** mulberry32: a tiny seeded PRNG, so every random choice replays from the seed. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function orderedHandles(
  handles: readonly string[],
  config: Pick<CreditsConfig, "order" | "seed">,
) {
  if (config.order === "listed") return [...handles];
  const random = seeded(config.seed);
  const out = [...handles];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
