"use client";

import {
  getBoundingBox,
  getLength,
  getPointAtLength,
  warpPath,
} from "@remotion/paths";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * Beat sheet (30fps, speed 1):
 * 0–10     a point of light ignites at the start of the stroke.
 * 6–86     it writes the path; the trail cools from hot white through the
 *          silk palette (peach, violet, indigo) to nothing over ~20 frames,
 *          with a faint exposure memory behind it.
 * 86–98    the head burns out and the whole exposure flashes in at once.
 * 98–122   a slanted bar of the same light sweeps across: behind it the
 *          script is gone and the real remocn logo stands in its place.
 * 122–160  the logo holds, a silk sheen drifting slowly through it.
 */

export interface LightTrailWriteProps {
  /**
   * A single monoline SVG path (any coordinate space) to paint. Defaults to a
   * slanted script "remocn". Draw it in writing order: the light follows `d`.
   */
  path?: string;
  /** Stroke width in path units; defaults to 3.4% of the path height. */
  strokeWidth?: number;
  /**
   * The logo the script turns into: "solid" is lit white with a silk sheen,
   * "accent" is lit in the accent.
   */
  finish?: "solid" | "accent";
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
}

/** Monoline script "remocn", baseline y=0, x-height 100, written upright. */
const SCRIPT_UPRIGHT = [
  "M -34 8",
  "C -12 6 18 -40 32 -96",
  "C 36 -84 44 -78 56 -82",
  "C 64 -85 70 -92 78 -92",
  "C 74 -60 70 -24 72 -2",
  "C 74 6 88 4 98 -12",
  "C 112 -32 140 -52 140 -76",
  "C 140 -96 116 -98 108 -80",
  "C 98 -56 104 -4 132 -2",
  "C 150 -1 162 -14 172 -30",
  "C 178 -48 182 -80 186 -96",
  "C 188 -64 186 -30 186 0",
  "C 188 -48 200 -96 218 -96",
  "C 234 -96 238 -82 238 -62",
  "C 238 -40 236 -18 236 0",
  "C 238 -48 250 -96 268 -96",
  "C 284 -96 288 -82 288 -62",
  "C 288 -36 286 -14 294 -4",
  "C 302 4 316 0 326 -24",
  "C 334 -48 344 -88 362 -98",
  "C 346 -98 338 -74 338 -50",
  "C 338 -22 348 -2 362 -2",
  "C 378 -2 386 -24 386 -50",
  "C 386 -78 376 -98 362 -98",
  "C 374 -96 392 -88 412 -88",
  "C 418 -96 430 -100 437 -92",
  "C 428 -100 413 -88 413 -60",
  "C 413 -26 421 -2 438 -2",
  "C 454 -2 464 -14 472 -28",
  "C 476 -50 480 -84 484 -96",
  "C 486 -64 484 -30 484 0",
  "C 486 -48 498 -96 516 -96",
  "C 532 -96 536 -82 536 -62",
  "C 536 -36 534 -14 542 -4",
  "C 552 6 572 2 594 -18",
].join(" ");

const SLANT = Math.tan((13 * Math.PI) / 180);
const DEFAULT_PATH = warpPath(SCRIPT_UPRIGHT, ({ x, y }) => ({
  x: x - y * SLANT,
  y,
}));

const BG = "#050508";
const HOT = [255, 255, 255];

/**
 * gradients.sh "silk" palette: [#3b3fd8, #f3d6c0, #8a7bff]. The light cools
 * through it as it trails, and it is the sheen inside the finished logo.
 */
const SILK = ["#3b3fd8", "#f3d6c0", "#8a7bff"] as const;
/** The cooling ramp of the trail, by age: hot → peach → violet → indigo. */
const COOL = [HOT, rgb(SILK[1]), rgb(SILK[2]), rgb(SILK[0])];
const WRITE_START = 6;
const WRITE_END = 86;
const TRAIL = 20;
const STEPS = 2;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const EASE_WRITE = Easing.bezier(0.42, 0, 0.58, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const SWEEP_START = WRITE_END + 12;
const SWEEP_END = SWEEP_START + 24;

function rgb(hex: string) {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  return [0, 2, 4].map((i) => Number.parseInt(n.slice(i, i + 2), 16));
}

function mixRgb(a: number[], b: number[], k: number) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * k));
}

/** Color of the trail `age` frames behind the head: white → silk → gone. */
function trailColor(age: number) {
  const k = interpolate(age, [0.5, 4, 9, 16], [0, 1, 2, 3], CLAMP);
  const i = Math.min(2, Math.floor(k));
  const c = mixRgb(COOL[i], COOL[i + 1], k - i);
  const alpha = interpolate(age, [0, 6, TRAIL], [1, 0.85, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.3, 0, 0.6, 1),
  });
  return { color: `rgb(${c[0]},${c[1]},${c[2]})`, alpha };
}

/**
 * The remocn.dev logo as outlines: the R mark (0.76em, on the baseline) and
 * "emocn" in Manrope 600 at -0.025em, 100 units per em, baseline at y = 0.
 * Glyph contours overlap (m, n, the e's bar), so they fill nonzero.
 */
const LOGO_R =
  "M 0.01 -75.54 C 0.01 -75.02 0.2 -74.42 0.62 -73.66 C 2.78 -69.75 7.61 -66.29 12.28 -65.3 C 12.99 -65.15 13.12 -65.15 29.09 -65.09 C 43.06 -65.04 45.3 -65.02 46.03 -64.92 C 50.88 -64.29 54.46 -62.03 56.26 -58.45 C 58.41 -54.17 58.04 -47.64 55.42 -43.69 C 53.58 -40.93 50.76 -39.21 47.13 -38.64 C 46.88 -38.6 39.73 -38.17 31.25 -37.68 C 14.05 -36.7 15.3 -36.81 13.69 -36.15 C 11.26 -35.16 8.4 -33.15 6.03 -30.78 C 2.75 -27.5 0.74 -23.97 0.14 -20.45 C 0.07 -20.04 0.05 -17.62 0.02 -9.96 L 0 0 5.38 0 L 10.76 0 10.78 -8.41 C 10.81 -17.54 10.8 -17.23 11.22 -18.8 C 12.33 -22.99 15.77 -25.76 20.63 -26.4 C 21.07 -26.45 22.31 -26.47 24.66 -26.45 C 28.37 -26.42 28.73 -26.38 30.13 -25.93 C 32.04 -25.3 33.78 -24 35.11 -22.18 C 35.39 -21.79 39.26 -17.21 43.7 -11.99 C 48.14 -6.78 51.87 -2.39 51.99 -2.23 C 52.12 -2.08 52.36 -1.65 52.54 -1.3 C 52.94 -0.52 53.27 -0.19 53.81 -0.07 C 54.06 -0.02 56.02 0 60.21 -0.02 L 66.24 -0.04 57.07 -11.99 C 52.03 -18.57 47.84 -24.05 47.77 -24.17 C 47.19 -25.12 47.36 -26.45 48.17 -27.32 C 48.56 -27.74 48.89 -27.92 49.85 -28.24 C 54.44 -29.74 58.96 -32.63 62.25 -36.17 C 68.26 -42.64 70.23 -50.91 67.61 -58.77 C 64.87 -67.05 57.7 -73.72 49.61 -75.53 C 47.51 -75.99 49.86 -75.95 23.69 -75.98 L 0.01 -76 0.01 -75.54 Z";

const LOGO_EMOCN = [
  // e
  "M105.2 1.5L105.2 1.5Q97.1 1.5 91 -2Q85 -5.6 81.6 -11.9Q78.2 -18.2 78.2 -26.6L78.2 -26.6Q78.2 -35.4 81.5 -41.9Q84.9 -48.4 90.8 -52Q96.8 -55.5 104.7 -55.5L104.7 -55.5Q112.9 -55.5 118.7 -51.7Q124.5 -47.9 127.4 -40.8Q130.3 -33.8 129.7 -24.1L129.7 -24.1L119.2 -24.1L119.2 -27.9Q119.1 -37.3 115.6 -41.8Q112.2 -46.3 105.1 -46.3L105.1 -46.3Q97.2 -46.3 93.3 -41.3Q89.3 -36.4 89.3 -27L89.3 -27Q89.3 -18.1 93.3 -13.2Q97.2 -8.3 104.7 -8.3L104.7 -8.3Q109.6 -8.3 113.1 -10.6Q116.7 -12.8 118.7 -16.9L118.7 -16.9L128.9 -13.7Q125.8 -6.5 119.4 -2.5Q113 1.5 105.2 1.5ZM124.5 -24.1L85.9 -24.1L85.9 -32.2L124.5 -32.2L124.5 -24.1Z",
  // m
  "M212 0L201.6 0L201.6 -33.6Q201.6 -39.5 198.6 -42.8Q195.6 -46.1 190.7 -46.1L190.7 -46.1Q187.7 -46.1 185.2 -44.7Q182.8 -43.3 181.2 -40.6Q179.7 -37.9 179.7 -33.8L179.7 -33.8L174.7 -36.3Q174.6 -42 177.1 -46.3Q179.6 -50.6 183.9 -53Q188.3 -55.4 193.7 -55.4L193.7 -55.4Q202.4 -55.4 207.3 -50.1Q212.1 -44.9 212.1 -36.1L212.1 -36.1L212 0ZM147.3 0L136.8 0L136.8 -54L146.1 -54L146.1 -38.4L147.3 -38.4L147.3 0ZM179.7 0L169.2 0L169.3 -33.5Q169.3 -39.4 166.3 -42.7Q163.3 -46.1 158.3 -46.1L158.3 -46.1Q153.3 -46.1 150.3 -42.7Q147.3 -39.3 147.3 -33.8L147.3 -33.8L142.3 -37Q142.3 -42.3 144.8 -46.4Q147.4 -50.6 151.8 -53Q156.1 -55.4 161.6 -55.4L161.6 -55.4Q167.3 -55.4 171.4 -52.9Q175.4 -50.5 177.6 -46.2Q179.7 -41.8 179.7 -36.1L179.7 -36.1L179.7 0Z",
  // o
  "M245.3 1.5L245.3 1.5Q237.2 1.5 231.3 -2.1Q225.3 -5.8 222.1 -12.2Q218.9 -18.7 218.9 -27.1L218.9 -27.1Q218.9 -35.5 222.2 -41.9Q225.5 -48.4 231.4 -51.9Q237.4 -55.5 245.3 -55.5L245.3 -55.5Q253.4 -55.5 259.4 -51.9Q265.3 -48.2 268.6 -41.8Q271.8 -35.4 271.8 -27.1L271.8 -27.1Q271.8 -18.6 268.6 -12.2Q265.3 -5.8 259.3 -2.1Q253.4 1.5 245.3 1.5ZM245.3 -8.3L245.3 -8.3Q253.1 -8.3 256.9 -13.6Q260.8 -18.8 260.8 -27.1L260.8 -27.1Q260.8 -35.5 256.9 -40.6Q253 -45.7 245.3 -45.7L245.3 -45.7Q240.1 -45.7 236.7 -43.3Q233.3 -40.9 231.6 -36.7Q230 -32.6 230 -27.1L230 -27.1Q230 -18.6 233.9 -13.5Q237.8 -8.3 245.3 -8.3Z",
  // c
  "M303.4 1.5L303.4 1.5Q295.1 1.5 289.3 -2.2Q283.5 -5.9 280.5 -12.4Q277.4 -18.8 277.3 -27L277.3 -27Q277.4 -35.4 280.5 -41.8Q283.7 -48.2 289.5 -51.9Q295.4 -55.5 303.6 -55.5L303.6 -55.5Q312.4 -55.5 318.7 -51.1Q325 -46.7 327 -39.1L327 -39.1L316.6 -36.1Q315 -40.6 311.5 -43.1Q308 -45.7 303.4 -45.7L303.4 -45.7Q298.3 -45.7 295 -43.2Q291.7 -40.8 290.1 -36.6Q288.5 -32.4 288.4 -27L288.4 -27Q288.5 -18.7 292.3 -13.5Q296 -8.3 303.4 -8.3L303.4 -8.3Q308.5 -8.3 311.6 -10.7Q314.8 -13 316.4 -17.4L316.4 -17.4L327 -14.9Q324.3 -7 318.3 -2.7Q312.1 1.5 303.4 1.5Z",
  // n
  "M383.2 0L372.6 0L372.6 -26.6Q372.6 -29.7 372.1 -33Q371.6 -36.4 370.1 -39.2Q368.6 -42.1 365.9 -43.8Q363.3 -45.6 358.9 -45.6L358.9 -45.6Q356.1 -45.6 353.6 -44.6Q351.1 -43.7 349.3 -41.7Q347.4 -39.6 346.3 -36.3Q345.3 -32.9 345.3 -28.1L345.3 -28.1L338.8 -30.6Q338.8 -37.9 341.5 -43.5Q344.3 -49.2 349.4 -52.3Q354.6 -55.5 361.8 -55.5L361.8 -55.5Q367.4 -55.5 371.3 -53.7Q375.1 -51.9 377.4 -48.9Q379.8 -46 381.1 -42.6Q382.3 -39.1 382.8 -35.8Q383.2 -32.5 383.2 -30L383.2 -30L383.2 0ZM345.3 0L334.6 0L334.6 -54L344 -54L344 -38.4L345.3 -38.4L345.3 0Z",
];
/** Ink box of the outlined logo, in its own units; the R is `rW` wide. */
const LOGO = { x: 0, y: -76, w: 383.2, h: 77.5, rW: 70.23 } as const;

/** The whole logo in one fill (a colour or a `url(#gradient)`). */
function LogoPaths({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path d={LOGO_R} />
      {LOGO_EMOCN.map((d) => (
        <path key={d.slice(0, 16)} d={d} />
      ))}
    </g>
  );
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function LightTrailWrite({
  path = DEFAULT_PATH,
  strokeWidth,
  finish = "solid",
  accent = "#3B5BFD",
  speed = 1,
}: LightTrailWriteProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const ids = {
    wide: `w${uid}`,
    mid: `m${uid}`,
    head: `h${uid}`,
    wash: `s${uid}`,
    logo: `l${uid}`,
    bloom: `b${uid}`,
  };

  const { len, box } = useMemo(
    () => ({ len: getLength(path), box: getBoundingBox(path) }),
    [path],
  );
  const bw = box.x2 - box.x1;
  const bh = box.y2 - box.y1;
  const sw = strokeWidth ?? bh * 0.034;

  // fit the path to ~64% of the frame width (or 34% of the height)
  const k = Math.min((width * 0.64) / bw, (height * 0.34) / bh);
  const vbW = width / k;
  const vbH = height / k;
  const vbX = (box.x1 + box.x2) / 2 - vbW / 2;
  const vbY = (box.y1 + box.y2) / 2 - vbH / 2 - vbH * 0.02;

  const writeAt = (frame: number) =>
    interpolate(frame, [WRITE_START, WRITE_END], [0, len], {
      ...CLAMP,
      easing: EASE_WRITE,
    });
  const headS = writeAt(t);
  const head = getPointAtLength(path, Math.min(len - 0.01, headS)) ?? {
    x: 0,
    y: 0,
  };

  // light levels
  const ignite = interpolate(t, [0, 10], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const burnOut = interpolate(
    t,
    [WRITE_END - 2, WRITE_END + 10],
    [1, 0],
    CLAMP,
  );
  const headOn = ignite * burnOut;
  const memory = interpolate(t, [WRITE_START, WRITE_END], [0.06, 0.11], CLAMP);
  const reveal = interpolate(t, [WRITE_END, WRITE_END + 10], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const drain = interpolate(t, [WRITE_END + 10, SWEEP_END], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const glow = reveal * (1 - 0.7 * drain);

  // the hand-over: a slanted bar of light crosses the frame; left of it the
  // logo, right of it what is left of the script
  const sweep = interpolate(t, [SWEEP_START, SWEEP_END], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const sweeping = t >= SWEEP_START - 1 && t <= SWEEP_END + 1;
  const logoW = width * 0.52;
  const logoK = logoW / LOGO.w;
  const logoH = LOGO.h * logoK;
  const logoLeft = (width - logoW) / 2;
  const logoTop = height * 0.5 - logoH / 2;
  const edgeFrom = logoLeft - width * 0.12;
  const edgeTo = logoLeft + logoW + width * 0.12;
  const edge = edgeFrom + (edgeTo - edgeFrom) * sweep;
  const slant = 103;
  // where `edge` (on the centre row) falls along the slanted gradient line
  const sn = Math.sin((slant * Math.PI) / 180);
  const gradLen =
    width * sn + height * Math.abs(Math.cos((slant * Math.PI) / 180));
  const edgePct = 50 + (((edge - width / 2) * sn) / gradLen) * 100;
  const soft = 3.5;
  const logoMask =
    t >= SWEEP_END
      ? undefined
      : `linear-gradient(${slant}deg, #000 ${edgePct - soft}%, transparent ${edgePct + soft}%)`;
  const scriptMask =
    t < SWEEP_START
      ? undefined
      : `linear-gradient(${slant}deg, transparent ${edgePct - soft}%, #000 ${edgePct + soft}%)`;
  const barO =
    interpolate(sweep, [0, 0.12, 0.85, 1], [0, 1, 1, 0], CLAMP) *
    (sweeping ? 1 : 0);
  // the finished logo: a silk sheen drifting slowly through it
  const sheen = interpolate(t, [SWEEP_START, SWEEP_END + 60], [0, 1], CLAMP);
  const bloom = interpolate(t, [SWEEP_START + 6, SWEEP_END + 14], [1, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const logoStops =
    finish === "accent"
      ? [SILK[2], accent, accent, SILK[0]]
      : ["#FFFFFF", "#FBF3EC", "#C9C1FF", SILK[2]];

  // the live trail: short dashes of the same path, each a little older
  const segments: { a: number; b: number; color: string; alpha: number }[] = [];
  if (t < WRITE_END + TRAIL) {
    for (let i = 0; i < TRAIL * STEPS; i++) {
      const age0 = i / STEPS;
      const age1 = (i + 1) / STEPS;
      const b = writeAt(t - age0);
      const a = writeAt(t - age1);
      if (b - a < 0.01) continue;
      const { color, alpha } = trailColor((age0 + age1) / 2);
      if (alpha <= 0.002) continue;
      segments.push({ a, b, color, alpha: alpha * burnOutTrail(t, age0) });
    }
  }

  const dash = (a: number, b: number) => ({
    strokeDasharray: `${b - a + 0.6} ${len + 10}`,
    strokeDashoffset: -a,
  });

  const trailLayer = (w: number, opacity: number, filter?: string) => (
    <g
      filter={filter ? `url(#${filter})` : undefined}
      opacity={opacity}
      style={{ mixBlendMode: "screen" }}
    >
      {segments.map((s, i) => (
        <path
          key={i}
          d={path}
          fill="none"
          stroke={s.color}
          strokeOpacity={s.alpha}
          strokeWidth={w}
          strokeLinecap="butt"
          strokeLinejoin="round"
          {...dash(s.a, s.b)}
        />
      ))}
    </g>
  );

  const washR = bh * 2.2;

  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.035), transparent 70%)",
        }}
      />
      {/* what the exposure leaves on the stage: a faint silk sheen */}
      <AbsoluteFill
        style={{
          opacity: reveal * 0.55,
          background: `radial-gradient(70% 46% at ${42 + 8 * sheen}% 60%, color-mix(in oklab, ${SILK[0]} 30%, transparent), transparent 70%), radial-gradient(42% 30% at ${62 - 6 * sheen}% 40%, color-mix(in oklab, ${SILK[2]} 14%, transparent), transparent 70%)`,
        }}
      />
      <svg
        width={width}
        height={height}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        style={{
          position: "absolute",
          inset: 0,
          maskImage: scriptMask,
          WebkitMaskImage: scriptMask,
        }}
        aria-hidden
      >
        <defs>
          <filter
            id={ids.wide}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            filterUnits="objectBoundingBox"
          >
            <feGaussianBlur stdDeviation={sw * 2.6} />
          </filter>
          <filter
            id={ids.mid}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
            filterUnits="objectBoundingBox"
          >
            <feGaussianBlur stdDeviation={sw * 0.8} />
          </filter>
          <radialGradient id={ids.head}>
            <stop offset="0%" stopColor="#fff" stopOpacity={0.95} />
            <stop offset="18%" stopColor="#fff" stopOpacity={0.5} />
            <stop offset="45%" stopColor={SILK[1]} stopOpacity={0.2} />
            <stop offset="100%" stopColor={SILK[2]} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={ids.wash}>
            <stop offset="0%" stopColor="#fff" stopOpacity={0.035} />
            <stop offset="100%" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* the light spills a little onto the stage around the head */}
        <circle
          cx={head.x}
          cy={head.y}
          r={washR}
          fill={`url(#${ids.wash})`}
          opacity={headOn}
        />

        {/* exposure memory: what the light has already written, barely there */}
        <path
          d={path}
          fill="none"
          stroke={SILK[2]}
          strokeOpacity={memory * (1 - reveal)}
          strokeWidth={sw * 0.9}
          strokeLinecap="round"
          strokeLinejoin="round"
          {...dash(0, headS)}
        />

        {trailLayer(sw * 5.5, 0.32, ids.wide)}
        {trailLayer(sw * 2.2, 0.55, ids.mid)}
        {trailLayer(sw, 1)}

        {/* full exposure: the whole trail at once, then it cools */}
        <g opacity={glow}>
          <path
            d={path}
            fill="none"
            stroke={SILK[2]}
            strokeWidth={sw * 5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${ids.wide})`}
            opacity={0.24}
          />
          <path
            d={path}
            fill="none"
            stroke={SILK[1]}
            strokeWidth={sw * 2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${ids.mid})`}
            opacity={0.4}
          />
        </g>
        <path
          d={path}
          fill="none"
          stroke="#ffffff"
          strokeWidth={sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={reveal}
        />

        {/* the point of light */}
        <g opacity={headOn}>
          <circle
            cx={head.x}
            cy={head.y}
            r={sw * 7}
            fill={`url(#${ids.head})`}
          />
          <circle cx={head.x} cy={head.y} r={sw * 0.95} fill="#fff" />
        </g>
      </svg>

      {/* the logo the light leaves behind */}
      {t >= SWEEP_START ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            maskImage: logoMask,
            WebkitMaskImage: logoMask,
          }}
        >
          <svg
            width={logoW}
            height={logoH}
            viewBox={`${LOGO.x} ${LOGO.y} ${LOGO.w} ${LOGO.h}`}
            style={{
              position: "absolute",
              left: logoLeft,
              top: logoTop,
              overflow: "visible",
            }}
            aria-hidden
          >
            <defs>
              <linearGradient
                id={ids.logo}
                gradientUnits="userSpaceOnUse"
                x1={LOGO.x - 40 + 30 * sheen}
                y1={LOGO.y - 40}
                x2={LOGO.x + LOGO.w + 30 * sheen}
                y2={LOGO.y + LOGO.h + 60}
              >
                <stop offset="0%" stopColor={logoStops[0]} />
                <stop offset="40%" stopColor={logoStops[1]} />
                <stop offset="75%" stopColor={logoStops[2]} />
                <stop offset="100%" stopColor={logoStops[3]} />
              </linearGradient>
              <filter
                id={ids.bloom}
                x="-20%"
                y="-60%"
                width="140%"
                height="220%"
              >
                <feGaussianBlur stdDeviation={6} />
              </filter>
            </defs>
            <g opacity={bloom * 0.8} filter={`url(#${ids.bloom})`}>
              <LogoPaths fill={SILK[1]} />
            </g>
            <LogoPaths fill={`url(#${ids.logo})`} />
          </svg>
        </div>
      ) : null}

      {/* the bar of light doing the hand-over */}
      {barO > 0 ? (
        <div
          style={{
            position: "absolute",
            left: edge - 90,
            top: -height * 0.2,
            width: 180,
            height: height * 1.4,
            opacity: barO,
            transform: `rotate(${slant - 90}deg)`,
            mixBlendMode: "screen",
            background: `linear-gradient(90deg, transparent 0%, color-mix(in oklab, ${SILK[0]} 30%, transparent) 22%, color-mix(in oklab, ${SILK[2]} 55%, transparent) 38%, color-mix(in oklab, ${SILK[1]} 85%, transparent) 47%, #fff 50%, color-mix(in oklab, ${SILK[1]} 85%, transparent) 53%, color-mix(in oklab, ${SILK[2]} 55%, transparent) 62%, color-mix(in oklab, ${SILK[0]} 30%, transparent) 78%, transparent 100%)`,
            maskImage:
              "linear-gradient(180deg, transparent 18%, #000 40%, #000 60%, transparent 82%)",
          }}
        />
      ) : null}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 55%, rgba(0,0,0,0.5))",
        }}
      />
      <Grain opacity={0.06} />
    </AbsoluteFill>
  );
}

/** Once the head has stopped, the remaining trail drains a little faster. */
function burnOutTrail(t: number, age: number) {
  return interpolate(t - age, [WRITE_END, WRITE_END + 8], [1, 0.6], CLAMP);
}
