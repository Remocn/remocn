"use client";

import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const bricolage = loadBricolage("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const geist = loadGeist("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

/**
 * Beat sheet (30fps, speed 1, three items, 165 frames):
 * 6–40     "Fast." rises out of a mask at hero size, its line follows; a row
 *          of progress ticks under it fills for the current item.
 * 40–74    it leaves upward as "Composable." rises into the same spot.
 * 74–104   "Open source." rises and holds.
 * 104–132  resolve: the last title shrinks and travels into its column,
 *          the earlier titles rise back into theirs, the ticks stretch into
 *          the column rules, descriptions settle under each.
 * 132–165  poster hold.
 * The per-item slot stretches or shrinks with `durationInFrames`.
 */

export interface FeatureTrioItem {
  title: string;
  description: string;
}

export interface FeatureTrioProps {
  /** 2–4 short benefits. */
  items?: FeatureTrioItem[];
  accent?: string;
  /** Stage fill. "transparent" drops the stage and its glow. */
  background?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

/** gradients.sh "grain": bg #070505, [#ffd8b4, #e0703b, #8a2c1d, #2b1015]. */
const GRAIN = ["#ffd8b4", "#e0703b", "#8a2c1d", "#2b1015"] as const;
/** gradients.sh "smear" (light): bg #efe8dc, [#f2552c, #f7b23b, #e889b5, #2f6b3f]. */
const SMEAR = ["#f2552c", "#f7b23b", "#e889b5", "#2f6b3f"] as const;

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    muted: "#8E8D94",
    track: "rgba(255,255,255,0.14)",
    rule: "rgba(255,255,255,0.22)",
    glow: [GRAIN[0], GRAIN[1], GRAIN[2]],
    glowAlpha: [0.36, 0.4, 0.42],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    muted: "#6E6C67",
    track: "rgba(17,17,19,0.12)",
    rule: "rgba(17,17,19,0.2)",
    glow: [SMEAR[1], SMEAR[0], SMEAR[2]],
    glowAlpha: [0.22, 0.16, 0.18],
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.6, 0, 0.9, 0.5);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Bricolage Grotesque 500 advances (per 1000 em), ASCII 32–126. */
const BRICOLAGE_500 = [
  246, 266, 317, 612, 630, 947, 756, 158, 305, 290, 395, 516, 165, 339, 196,
  353, 656, 320, 583, 595, 595, 599, 646, 493, 645, 640, 207, 187, 516, 516,
  516, 413, 952, 671, 666, 670, 691, 599, 578, 706, 708, 274, 357, 666, 508,
  908, 746, 716, 629, 719, 660, 641, 553, 719, 657, 957, 652, 600, 560, 315,
  341, 300, 546, 578, 283, 567, 618, 555, 617, 570, 380, 588, 608, 259, 266,
  561, 257, 912, 608, 604, 618, 617, 411, 535, 380, 599, 546, 827, 534, 591,
  500, 353, 259, 331, 516,
];
const TRACK = -0.04;

function titleEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c <= 126 ? BRICOLAGE_500[c - 32] : 620;
  }
  return w / 1000 + TRACK * [...text].length;
}

const DEFAULT_ITEMS: FeatureTrioItem[] = [
  { title: "Fast.", description: "Drop in a scene and render it in minutes." },
  {
    title: "Composable.",
    description: "Every piece is a React component you can remix.",
  },
  {
    title: "Open source.",
    description: "MIT licensed. The code lands in your repo.",
  },
];

export function FeatureTrio({
  items = DEFAULT_ITEMS,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: FeatureTrioProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, durationInFrames } = useVideoConfig();
  const p = PALETTES[theme];
  const list = items.slice(0, 4);
  const n = list.length;
  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.5
    : Math.min(width / 1280, height / 720);

  // ---- timing ----------------------------------------------------------------
  const START = 6;
  const RESOLVE = 24;
  const HOLD = 36;
  const total = durationInFrames * speed;
  const slot = Math.max(
    22,
    Math.min(40, (total - START - RESOLVE - HOLD + 4) / Math.max(1, n)),
  );
  const at = (i: number) => START + i * slot;
  const r0 = at(n - 1) + slot - 4;
  const resolve = interpolate(frame, [r0, r0 + RESOLVE], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  // ---- geometry ----------------------------------------------------------------
  const maxEm = Math.max(...list.map((it) => titleEm(it.title)), 1);
  const heroFs = Math.min((portrait ? 150 : 172) * s, (width * 0.84) / maxEm);
  const heroY = height * (portrait ? 0.46 : 0.45);
  const heroDescFs = (portrait ? 34 : 28) * s;
  const heroDescTop = heroY + heroFs * 0.52 + 18 * s;
  // progress ticks sit above the hero title, so on the way to becoming the
  // column rules they never cross a line of text
  const ticksY = heroY - heroFs * 0.62 - (portrait ? 48 : 34) * s;
  const tickW = 40 * s;
  const tickGap = 8 * s;
  const ticksW = n * tickW + (n - 1) * tickGap;

  // final layout: a row (landscape) or a stack (portrait)
  const rowW = Math.min(width * 0.88, 1180 * s);
  const colW = portrait ? width * 0.84 : rowW / n;
  const gutter = (portrait ? 0 : 26) * s;
  const rowFs = portrait
    ? Math.min(84 * s, (colW * 0.92) / maxEm)
    : Math.min(60 * s, ((colW - gutter * 2) * 0.94) / maxEm);
  const rowDescFs = (portrait ? 28 : 19) * s;
  const ruleToTitle = rowFs * 0.5 + 30 * s;
  const titleToDesc = rowFs * 0.52 + 12 * s;
  const blockH = ruleToTitle + titleToDesc + rowDescFs * 1.45 * 2;
  const stackGap = 64 * s;
  const col = (i: number) => {
    if (portrait) {
      const groupH = n * blockH + (n - 1) * stackGap;
      const top = height / 2 - groupH / 2 + i * (blockH + stackGap);
      return { x: width / 2, ruleY: top, w: colW * 0.4 };
    }
    const groupH = blockH;
    return {
      x: width / 2 - rowW / 2 + colW * (i + 0.5),
      ruleY: height / 2 - groupH / 2,
      w: colW - gutter * 2,
    };
  };

  const transparent = background === "transparent";

  // the glow breathes with each new item and widens into a band for the row
  const beat = list.reduce(
    (acc, _, i) =>
      acc +
      interpolate(
        frame,
        [at(i), at(i) + 10, at(i) + slot],
        [0, 1, 0.35],
        CLAMP,
      ) *
        (i === n - 1
          ? 1
          : interpolate(frame, [at(i + 1), at(i + 1) + 6], [1, 0], CLAMP)),
    0,
  );
  const glowIn = interpolate(frame, [0, 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const glowW = interpolate(resolve, [0, 1], [46, 95]);
  const glowH = interpolate(resolve, [0, 1], [58, 44]);
  const glowY = interpolate(resolve, [0, 1], [104, 112]);
  const glowLift = 0.75 + Math.min(1, beat) * 0.25;

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: glowIn * glowLift,
            background: [
              `radial-gradient(${glowW * 0.6}% ${glowH * 0.6}% at 50% ${glowY}%, color-mix(in oklab, ${p.glow[0]} ${p.glowAlpha[0] * 100}%, transparent) 0%, transparent 70%)`,
              `radial-gradient(${glowW * 0.85}% ${glowH * 0.85}% at 50% ${glowY}%, color-mix(in oklab, ${p.glow[1]} ${p.glowAlpha[1] * 100}%, transparent) 0%, transparent 70%)`,
              `radial-gradient(${glowW * 1.1}% ${glowH * 1.1}% at 50% ${glowY + 4}%, color-mix(in oklab, ${p.glow[2]} ${p.glowAlpha[2] * 100}%, transparent) 0%, transparent 72%)`,
            ].join(", "),
          }}
        />
      ) : null}

      {/* ticks → column rules */}
      {list.map((it, i) => {
        const c = col(i);
        const tickX =
          width / 2 - ticksW / 2 + i * (tickW + tickGap) + tickW / 2;
        const x = interpolate(resolve, [0, 1], [tickX, c.x]);
        const y = interpolate(resolve, [0, 1], [ticksY, c.ruleY]);
        const w = interpolate(resolve, [0, 1], [tickW, c.w]);
        const th = interpolate(resolve, [0, 1], [3, 1.5]) * s;
        const fill =
          i === n - 1
            ? interpolate(frame, [at(i), at(i) + slot - 6], [0, 1], CLAMP)
            : interpolate(frame, [at(i), at(i + 1)], [0, 1], CLAMP);
        const tickIn = interpolate(frame, [0, 14], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        // the accent hands over to a neutral rule once the row stands
        const accentShare = 1 - resolve;
        return (
          <div
            key={`${it.title}-rule`}
            style={{
              position: "absolute",
              left: x - w / 2,
              top: y - th / 2,
              width: w,
              height: th,
              borderRadius: th,
              background: resolve > 0 ? p.rule : p.track,
              overflow: "hidden",
              opacity: tickIn,
              transform: `scaleX(${0.4 + tickIn * 0.6})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${fill * 100}%`,
                background: accent,
                opacity: accentShare,
              }}
            />
          </div>
        );
      })}

      {list.map((it, i) => {
        const last = i === n - 1;
        const c = col(i);
        const rowTitleY = c.ruleY + ruleToTitle;
        const rowDescTop = c.ruleY + ruleToTitle + titleToDesc;

        // solo: rise in, hold, leave upward (except the last)
        const rise = interpolate(frame, [at(i), at(i) + 14], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        const leave = last
          ? 0
          : interpolate(frame, [at(i + 1) - 8, at(i + 1) + 2], [0, 1], {
              ...CLAMP,
              easing: EASE_IN,
            });
        const descIn = interpolate(frame, [at(i) + 5, at(i) + 19], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        // row: earlier titles come back into their columns
        const back = interpolate(
          frame,
          [r0 + 15 + i * 3, r0 + 31 + i * 3],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        );
        const rowDescIn = interpolate(
          frame,
          [r0 + 20 + i * 3, r0 + 36 + i * 3],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        );

        const titleStyle = {
          fontFamily: bricolage.fontFamily,
          fontWeight: 500,
          letterSpacing: `${TRACK}em`,
          lineHeight: 1,
          color: p.fg,
          whiteSpace: "nowrap" as const,
        };

        // hero copy (and, for the last item, the copy that travels)
        const heroX = last
          ? interpolate(resolve, [0, 1], [width / 2, c.x])
          : width / 2;
        const heroYNow = last
          ? interpolate(resolve, [0, 1], [heroY, rowTitleY])
          : heroY;
        const heroFsNow = last
          ? interpolate(resolve, [0, 1], [heroFs, rowFs])
          : heroFs;
        const soloY = (1 - rise) * 112 - leave * 112;
        const heroVisible = rise > 0 && leave < 1 && (last || frame < r0);
        const heroDescOut = last
          ? interpolate(resolve, [0, 0.35], [1, 0], CLAMP)
          : interpolate(frame, [at(i + 1) - 10, at(i + 1) - 3], [1, 0], CLAMP);

        return (
          <div key={it.title}>
            {heroVisible ? (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: heroX,
                    top: heroYNow,
                    transform: "translate(-50%, -50%)",
                    overflow: resolve > 0 && last ? "visible" : "hidden",
                    padding: `${heroFsNow * 0.08}px ${heroFsNow * 0.06}px ${heroFsNow * 0.14}px`,
                  }}
                >
                  <div
                    style={{
                      ...titleStyle,
                      fontSize: heroFsNow,
                      transform: `translateY(${soloY}%)`,
                    }}
                  >
                    {it.title}
                  </div>
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: width / 2 - width * 0.35,
                    width: width * 0.7,
                    top: heroDescTop,
                    textAlign: "center",
                    textWrap: "balance",
                    fontFamily: geist.fontFamily,
                    fontWeight: 400,
                    fontSize: heroDescFs,
                    lineHeight: 1.35,
                    letterSpacing: "-0.01em",
                    color: p.muted,
                    opacity: descIn * heroDescOut,
                    transform: `translateY(${(1 - descIn) * 12 * s - (1 - heroDescOut) * 10 * s}px)`,
                    filter: `blur(${(1 - descIn) * 5 * s}px)`,
                  }}
                >
                  {it.description}
                </div>
              </>
            ) : null}

            {/* row copy for the earlier items */}
            {!last && back > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: c.x,
                  top: rowTitleY,
                  transform: "translate(-50%, -50%)",
                  overflow: "hidden",
                  padding: `${rowFs * 0.08}px ${rowFs * 0.06}px ${rowFs * 0.14}px`,
                }}
              >
                <div
                  style={{
                    ...titleStyle,
                    fontSize: rowFs,
                    transform: `translateY(${(1 - back) * 112}%)`,
                  }}
                >
                  {it.title}
                </div>
              </div>
            ) : null}

            {/* row description */}
            {rowDescIn > 0 ? (
              <div
                style={{
                  position: "absolute",
                  left: c.x - (portrait ? colW : c.w) / 2,
                  width: portrait ? colW : c.w,
                  top: rowDescTop,
                  textAlign: "center",
                  textWrap: "balance",
                  fontFamily: geist.fontFamily,
                  fontWeight: 400,
                  fontSize: rowDescFs,
                  lineHeight: 1.45,
                  letterSpacing: "-0.005em",
                  color: p.muted,
                  opacity: rowDescIn,
                  transform: `translateY(${(1 - rowDescIn) * 10 * s}px)`,
                  filter: `blur(${(1 - rowDescIn) * 4 * s}px)`,
                }}
              >
                {it.description}
              </div>
            ) : null}
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
