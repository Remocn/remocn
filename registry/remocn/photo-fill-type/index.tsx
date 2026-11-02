"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/BarlowCondensed";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PhotoFillTypeProps {
  /** The word cut out of the stage. Short and wide reads best (3–5 letters). */
  title?: string;
  /** Small line that lands once the image fills the frame. */
  caption?: string;
  /** Image seen through the letters. Defaults to a generated dusk landscape. */
  src?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Beat sheet (30fps):
//  0–22    letters open onto the image (fade + settle from 1.035)
//  0–end   the image trucks slowly sideways; its layers move with parallax
//  22–72   hold on the masked word (hero)
//  72–92   tracking opens and each letter fills with image from the
//          baseline up, center letters first: the word becomes tall windows
//  90–102  the gutters between the windows close into one cap-height band
//  98–124  the band opens like a letterbox to a full-bleed image
//  118–136 caption lands bottom-left
//  136–165 hold on the full-bleed frame
export const PHOTO_FILL_TYPE_DURATION = 165;
const EXPAND = 72;
const CAPTION = 118;

/** Barlow Condensed 500 advances (em) for caps, figures and a few marks. */
const ADVANCE: Record<string, number> = {
  A: 0.436,
  B: 0.456,
  C: 0.452,
  D: 0.469,
  E: 0.432,
  F: 0.41,
  G: 0.457,
  H: 0.475,
  I: 0.22,
  J: 0.435,
  K: 0.466,
  L: 0.407,
  M: 0.53,
  N: 0.501,
  O: 0.462,
  P: 0.451,
  Q: 0.45,
  R: 0.453,
  S: 0.426,
  T: 0.439,
  U: 0.477,
  V: 0.457,
  W: 0.646,
  X: 0.449,
  Y: 0.442,
  Z: 0.401,
  "0": 0.447,
  "1": 0.266,
  "2": 0.415,
  "3": 0.418,
  "4": 0.44,
  "5": 0.42,
  "6": 0.42,
  "7": 0.381,
  "8": 0.429,
  "9": 0.414,
  " ": 0.2,
  "&": 0.564,
  "-": 0.32,
  ".": 0.202,
};
const CAP = 0.7;
/** Side bearing the fill cell keeps inside each advance, in em. */
const CELL_INSET = 0.012;

/**
 * gradients.sh "horizon": the dusk band. Plum night at the top, steel blue,
 * dusty rose, a rust line at the horizon and a pale glint for the sun.
 */
const HORIZON = {
  bg: "#000000",
  colors: ["#b4553a", "#c98f8a", "#6f8fb0", "#3a1f33", "#dfe8ff"],
} as const;

const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);
const CAMERA = Easing.bezier(0.65, 0, 0.35, 1);
const OPEN = Easing.bezier(0.72, 0, 0.12, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: { bg: "#0A0A0B", grain: 0.05 },
  light: { bg: "#F5F4F0", grain: 0.035 },
} as const;

// ── Deterministic noise ───────────────────────────────────────────────────

function hash(i: number, seed: number) {
  const s = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function valueNoise(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const t = f * f * (3 - 2 * f);
  return hash(i, seed) * (1 - t) + hash(i + 1, seed) * t;
}

/** Ridged fractal noise in [0, 1]: sharp crests like real ridgelines. */
function ridge(x: number, seed: number, octaves: number) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    const n = valueNoise(x * freq, seed + o * 17);
    const r = o < 2 ? 1 - Math.abs(2 * n - 1) : n;
    sum += r * amp;
    norm += amp;
    amp *= 0.5;
    freq *= 2.07;
  }
  return sum / norm;
}

function ridgePath(
  seed: number,
  baseY: number,
  amp: number,
  scale: number,
  octaves: number,
) {
  let d = "";
  for (let x = -500; x <= 2100; x += 5) {
    const y = baseY - amp * ridge(x / scale, seed, octaves);
    d += `${d ? "L" : "M"}${x} ${y.toFixed(1)}`;
  }
  return `${d}L2100 1000L-500 1000Z`;
}

// ── Default image: a dusk landscape built from light and haze ─────────────

interface Range {
  seed: number;
  base: number;
  amp: number;
  scale: number;
  octaves: number;
  top: string;
  bottom: string;
  depth: number;
  blur: number;
  rough?: number;
  haze: number;
}

const RANGES: Range[] = [
  {
    seed: 3,
    base: 590,
    amp: 120,
    scale: 340,
    octaves: 6,
    top: "#A88A9C",
    bottom: "#D29C8E",
    depth: 0.3,
    blur: 1.6,
    haze: 0.5,
  },
  {
    seed: 11,
    base: 628,
    amp: 120,
    scale: 260,
    octaves: 6,
    top: "#6E6F8E",
    bottom: "#9C8190",
    depth: 0.45,
    blur: 1,
    haze: 0.4,
  },
  {
    seed: 23,
    base: 690,
    amp: 110,
    scale: 220,
    octaves: 7,
    top: "#46304A",
    bottom: "#5A3E55",
    depth: 0.65,
    blur: 0.5,
    rough: 3,
    haze: 0.28,
  },
  {
    seed: 37,
    base: 790,
    amp: 120,
    scale: 300,
    octaves: 7,
    top: "#24131F",
    bottom: "#1B0F18",
    depth: 0.9,
    blur: 0,
    rough: 6,
    haze: 0.16,
  },
  {
    seed: 51,
    base: 905,
    amp: 70,
    scale: 420,
    octaves: 7,
    top: "#0C070A",
    bottom: "#080507",
    depth: 1.25,
    blur: 0.7,
    rough: 9,
    haze: 0,
  },
];

function DuskScene({ pan, uid }: { pan: number; uid: string }) {
  const id = (s: string) => `pft-${s}-${uid}`;
  const SUN_X = 1060;
  const SUN_Y = 548;
  const TRUCK = 150;
  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0 }}
      aria-hidden
    >
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={HORIZON.bg} />
          <stop offset="0.1" stopColor={HORIZON.colors[3]} />
          <stop offset="0.3" stopColor={HORIZON.colors[2]} />
          <stop offset="0.47" stopColor={HORIZON.colors[1]} />
          <stop offset="0.58" stopColor={HORIZON.colors[0]} />
          <stop offset="0.68" stopColor={HORIZON.colors[1]} />
          <stop offset="1" stopColor={HORIZON.colors[4]} />
        </linearGradient>
        <radialGradient
          id={id("sun")}
          cx={SUN_X}
          cy={SUN_Y}
          r="620"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFF6EE" stopOpacity="0.95" />
          <stop offset="0.06" stopColor={HORIZON.colors[4]} stopOpacity="0.7" />
          <stop
            offset="0.25"
            stopColor={HORIZON.colors[1]}
            stopOpacity="0.34"
          />
          <stop offset="0.6" stopColor={HORIZON.colors[0]} stopOpacity="0.1" />
          <stop offset="1" stopColor={HORIZON.colors[0]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("cloudband")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.2" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="0.7" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask
          id={id("cloudmask")}
          maskUnits="userSpaceOnUse"
          x="-500"
          y="0"
          width="2600"
          height="900"
        >
          <rect
            x="-500"
            y="0"
            width="2600"
            height="900"
            fill={`url(#${id("cloudband")})`}
          />
        </mask>
        <filter
          id={id("clouds")}
          x="-500"
          y="0"
          width="2600"
          height="900"
          filterUnits="userSpaceOnUse"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0014 0.0068"
            numOctaves={5}
            seed={9}
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.97  0 0 0 0 0.9  0 0 0 0 0.9  3.4 0 0 0 -1.55"
          />
        </filter>
        <filter
          id={id("cloudshade")}
          x="-500"
          y="0"
          width="2600"
          height="900"
          filterUnits="userSpaceOnUse"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.0014 0.0068"
            numOctaves={5}
            seed={9}
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.22  0 0 0 0 0.2  0 0 0 0 0.32  4 0 0 0 -2.1"
          />
          <feOffset dy="-6" />
        </filter>
        {RANGES.map((r, i) => (
          <linearGradient
            key={r.seed}
            id={id(`range${i}`)}
            x1="0"
            y1={r.base - r.amp}
            x2="0"
            y2={r.base + 60}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={r.top} />
            <stop offset="1" stopColor={r.bottom} />
          </linearGradient>
        ))}
        {RANGES.map((r, i) => (
          <filter
            key={r.seed}
            id={id(`rf${i}`)}
            x="-600"
            y="0"
            width="2800"
            height="1000"
            filterUnits="userSpaceOnUse"
          >
            {r.rough ? (
              <>
                <feTurbulence
                  type="fractalNoise"
                  baseFrequency="0.09 0.05"
                  numOctaves={2}
                  seed={r.seed}
                  result="n"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="n"
                  scale={r.rough}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="d"
                />
                <feGaussianBlur in="d" stdDeviation={r.blur} />
              </>
            ) : (
              <feGaussianBlur stdDeviation={r.blur} />
            )}
          </filter>
        ))}
        <linearGradient id={id("haze")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D9958A" stopOpacity="0" />
          <stop offset="0.55" stopColor="#D9958A" stopOpacity="1" />
          <stop offset="1" stopColor="#D9958A" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={id("vignette")} cx="0.5" cy="0.48" r="0.75">
          <stop offset="0.55" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.36" />
        </radialGradient>
      </defs>

      <g transform={`translate(${-pan * TRUCK * 0.12} 0)`}>
        <rect
          x="-500"
          y="0"
          width="2600"
          height="900"
          fill={`url(#${id("sky")})`}
        />
        <rect
          x="-500"
          y="0"
          width="2600"
          height="900"
          fill={`url(#${id("sun")})`}
        />
      </g>
      <g
        transform={`translate(${-pan * TRUCK * 0.2} 0)`}
        mask={`url(#${id("cloudmask")})`}
      >
        <rect
          x="-500"
          y="0"
          width="2600"
          height="900"
          filter={`url(#${id("cloudshade")})`}
          opacity={0.22}
        />
        <rect
          x="-500"
          y="0"
          width="2600"
          height="900"
          filter={`url(#${id("clouds")})`}
          opacity={0.7}
        />
      </g>
      {/* the sun disc, low and soft, already touching the far haze */}
      <g transform={`translate(${-pan * TRUCK * 0.12} 0)`}>
        <circle cx={SUN_X} cy={SUN_Y} r="17" fill="#FFF8E6" />
        <circle cx={SUN_X} cy={SUN_Y} r="34" fill="#FFF1D2" opacity={0.35} />
      </g>

      {RANGES.map((r, i) => (
        <g key={r.seed} transform={`translate(${-pan * TRUCK * r.depth} 0)`}>
          {r.haze > 0 && (
            <rect
              x="-500"
              y={r.base - r.amp * 0.55}
              width="2600"
              height={r.amp * 0.9}
              fill={`url(#${id("haze")})`}
              opacity={r.haze * 0.6}
            />
          )}
          <path
            d={ridgePath(r.seed, r.base, r.amp, r.scale, r.octaves)}
            fill={`url(#${id(`range${i}`)})`}
            filter={`url(#${id(`rf${i}`)})`}
          />
        </g>
      ))}

      {/* warm light scattering across the whole frame from the sun */}
      <rect
        x="0"
        y="0"
        width="1600"
        height="900"
        fill={`url(#${id("sun")})`}
        opacity={0.28}
        style={{ mixBlendMode: "screen" }}
      />
      <rect
        x="0"
        y="0"
        width="1600"
        height="900"
        fill={`url(#${id("vignette")})`}
      />
    </svg>
  );
}

function Grain({ opacity, uid }: { opacity: number; uid: string }) {
  const id = `pft-grain-${uid}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        opacity,
        pointerEvents: "none",
        mixBlendMode: "overlay",
      }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={4}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function PhotoFillType({
  title = "Dusk",
  caption = "Not a photograph. Every pixel is code.",
  src,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: PhotoFillTypeProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const u = H / 720;
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const maskId = `pft-mask-${uid}`;

  const letters = title.toUpperCase().split("");
  const n = Math.max(letters.length, 1);
  const adv = letters.map((ch) => ADVANCE[ch] ?? 0.45);
  const sumAdv = adv.reduce((a, b) => a + b, 0) || 0.45;
  // Condensed caps at 500: size, not weight, carries the word. Tracking opens
  // from 0 to TRACK1 while the letters fill, so fit both widths.
  const TRACK1 = 0.065;
  const fs = Math.min(
    (W * 0.84) / sumAdv,
    (W * 0.94) / (sumAdv + (n - 1) * TRACK1),
    (H * 0.58) / CAP,
  );
  const capH = fs * CAP;

  // Open.
  const open = interpolate(frame, [0, 22], [0.18, 1], {
    ...CLAMP,
    easing: SETTLE,
  });
  const wordScaleIn = interpolate(open, [0, 1], [1.035, 1]);

  // Expand: tracking opens while each letter fills with image from the
  // baseline up (center letters first), the gutters between the filled
  // windows close into one band, and the band opens like a letterbox.
  const track = interpolate(frame, [EXPAND, EXPAND + 20], [0, 1], {
    ...CLAMP,
    easing: CAMERA,
  });
  const closeP = interpolate(frame, [EXPAND + 18, EXPAND + 30], [0, 1], {
    ...CLAMP,
    easing: CAMERA,
  });
  const openP = interpolate(frame, [EXPAND + 26, EXPAND + 52], [0, 1], {
    ...CLAMP,
    easing: OPEN,
  });
  const trackEm = TRACK1 * track * (1 - closeP * 0.35);
  const wordScale = wordScaleIn * (1 + 0.02 * track);
  const baseline = H / 2 + capH / 2;

  const totalW = (sumAdv + (n - 1) * trackEm) * fs;
  const xs: number[] = [];
  let cursor = W / 2 - totalW / 2;
  for (let i = 0; i < n; i++) {
    xs.push(cursor);
    cursor += (adv[i] + trackEm) * fs;
  }
  const mid = (n - 1) / 2;
  const cellTop = baseline - capH - fs * 0.014;
  const cellBottom = baseline + fs * 0.012;
  const cells = xs.map((x, i) => {
    const order = Math.floor(Math.abs(i - mid) + 0.01);
    const fill = interpolate(
      frame,
      [EXPAND + 3 + order * 3, EXPAND + 17 + order * 3],
      [0, 1],
      { ...CLAMP, easing: CAMERA },
    );
    const l0 = x + CELL_INSET * fs;
    const r0 = x + (adv[i] - CELL_INSET) * fs;
    // Closing: each window grows to meet its neighbours halfway.
    const l1 =
      i === 0 ? l0 : (xs[i - 1] + (adv[i - 1] - CELL_INSET) * fs + l0) / 2;
    const r1 = i === n - 1 ? r0 : (r0 + xs[i + 1] + CELL_INSET * fs) / 2;
    const left = l0 + (l1 - l0) * closeP;
    const right = r0 + (r1 - r0) * closeP;
    const top = cellBottom - (cellBottom - cellTop) * fill;
    return { left, right, top, fill };
  });

  const bandL = cells[0]?.left ?? W / 2;
  const bandR = cells[n - 1]?.right ?? W / 2;
  const bx = interpolate(openP, [0, 1], [bandL, -W * 0.1]);
  const bw = interpolate(openP, [0, 1], [bandR - bandL, W * 1.2]);
  const by = interpolate(openP, [0, 1], [cellTop, -H * 0.1]);
  const bh = interpolate(openP, [0, 1], [cellBottom - cellTop, H * 1.2]);

  // Camera truck inside the letters; eases out of a slight push as it opens.
  const pan = interpolate(frame, [0, Math.max(durationInFrames, 60)], [-1, 1]);
  const photoScale = interpolate(
    frame,
    [EXPAND + 22, EXPAND + 64],
    [1.1, 1.02],
    { ...CLAMP, easing: CAMERA },
  );

  // Caption.
  const cap = interpolate(frame, [CAPTION, CAPTION + 18], [0, 1], {
    ...CLAMP,
    easing: SETTLE,
  });

  const photo = src ? (
    <Img
      src={src}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: `translateX(${-pan * 2.5}%)`,
      }}
    />
  ) : (
    <DuskScene pan={pan} uid={uid} />
  );

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <rect x={0} y={0} width={W} height={H} fill="black" />
            <g
              transform={`translate(${W / 2} ${H / 2}) scale(${wordScale}) translate(${-W / 2} ${-H / 2})`}
              opacity={open}
            >
              {letters.map((ch, i) => (
                <text
                  key={i}
                  x={xs[i]}
                  y={baseline}
                  fill="white"
                  style={{
                    fontFamily: display,
                    fontWeight: 500,
                    fontSize: fs,
                  }}
                >
                  {ch}
                </text>
              ))}
              {openP <= 0 &&
                cells.map((cell, i) =>
                  cell.fill > 0 ? (
                    <rect
                      key={i}
                      x={cell.left}
                      y={cell.top}
                      width={Math.max(0, cell.right - cell.left)}
                      height={cellBottom - cell.top}
                      fill="white"
                    />
                  ) : null,
                )}
              {openP > 0 && (
                <rect x={bx} y={by} width={bw} height={bh} fill="white" />
              )}
            </g>
          </mask>
        </defs>
      </svg>

      <AbsoluteFill
        style={{
          maskImage: `url(#${maskId})`,
          WebkitMaskImage: `url(#${maskId})`,
        }}
      >
        <AbsoluteFill style={{ transform: `scale(${photoScale})` }}>
          {photo}
        </AbsoluteFill>
        {/* a low scrim so the caption sits on the image without a box */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 58%, rgba(0,0,0,0.45) 100%)",
            opacity: cap,
          }}
        />
      </AbsoluteFill>

      {caption && cap > 0 && (
        <div
          style={{
            position: "absolute",
            left: 56 * u,
            bottom: 50 * u,
            display: "flex",
            flexDirection: "column",
            gap: 14 * u,
            opacity: cap,
            transform: `translateY(${(1 - cap) * 12 * u}px)`,
          }}
        >
          <div
            style={{
              width: 36 * u * interpolate(cap, [0, 1], [0.4, 1]),
              height: 2 * u,
              background: accent,
            }}
          />
          <div
            style={{
              fontFamily: display,
              fontWeight: 400,
              fontSize: 38 * u,
              letterSpacing: "0.005em",
              lineHeight: 1.15,
              color: "rgba(255,255,255,0.94)",
              maxWidth: W * 0.62,
              textWrap: "balance",
            }}
          >
            {caption}
          </div>
        </div>
      )}

      <Grain opacity={c.grain + 0.03 * openP} uid={uid} />
    </AbsoluteFill>
  );
}
