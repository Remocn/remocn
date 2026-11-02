"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadSans("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: display } = loadSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: displayItalic } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

// The remocn.dev logo: the R mark (0.76em, on the baseline) + "emocn" in
// Manrope 600 at -0.025em, outlined at 100 units per em. Glyph contours
// overlap (m, n, e's bar), so they fill nonzero.
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
const LOGO_W = 383.2;
const LOGO_CAP = 75.54;

/** The outlined remocn.dev logo, centred on (0, 0), `size` = font size in px. */
function LogoGlyphs({ size, fill }: { size: number; fill: string }) {
  const s = size / 100;
  return (
    <g
      transform={`translate(${(-LOGO_W / 2) * s} ${(LOGO_CAP / 2) * s}) scale(${s})`}
    >
      <path d={LOGO_R} fill={fill} />
      {LOGO_EMOCN.map((d) => (
        <path key={d.slice(0, 12)} d={d} fill={fill} fillRule="nonzero" />
      ))}
    </g>
  );
}

export interface BalanceBeamProps {
  items?: string[];
  accentLabel?: string;
  title?: string;
  subtitle?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    beam: "#D9D7D2",
    fulcrum: "#3A3940",
    block: "#26262A",
    blockEdge: "rgba(255,255,255,0.16)",
    blockText: "#C9C8CC",
    axis: "rgba(255,255,255,0.2)",
    level: "rgba(255,255,255,0.22)",
    ground: 1,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    beam: "#2A2A2D",
    fulcrum: "#C9C7C1",
    block: "#E4E2DC",
    blockEdge: "rgba(18,18,20,0.16)",
    blockText: "#3A3936",
    axis: "rgba(18,18,20,0.22)",
    level: "rgba(18,18,20,0.24)",
    ground: 0,
    grain: 0.045,
  },
} as const;

const START = 12;
const STEP = 9;
const FALL = 14;
const ACCENT_GAP = 16;
const ACCENT_FALL = 18;
const MAX_TILT = 9;
const FINAL_TILT = 7;
const K = 0.045;
const C = 0.1;
const SUB = 4;

interface Block {
  label: string;
  w: number;
  lx: number;
  ly: number;
  spawn: number;
  land: number;
}

function Grain({ opacity }: { opacity: number }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, opacity }}
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function rowSizes(n: number) {
  const caps = [2, 2, 1, 1, 1, 1, 1, 1];
  const out: number[] = [];
  let left = n;
  for (const c of caps) {
    if (left <= 0) break;
    const take = Math.min(c, left);
    out.push(take);
    left -= take;
  }
  return out;
}

function simulate(
  t: number,
  leftLands: number[],
  accentLand: number,
): { angle: number } {
  const steps = Math.max(0, Math.floor(t * SUB));
  const dt = 1 / SUB;
  let a = 0;
  let v = 0;
  const kicked = new Set<number>();
  for (let s = 0; s <= steps; s++) {
    const time = s * dt;
    let landed = 0;
    leftLands.forEach((l, i) => {
      if (time >= l) {
        landed++;
        if (!kicked.has(i)) {
          kicked.add(i);
          v -= 0.32 * 0.82 ** i;
        }
      }
    });
    let target = -MAX_TILT * (1 - 0.6 ** landed);
    if (time >= accentLand) {
      target = FINAL_TILT;
      if (!kicked.has(-1)) {
        kicked.add(-1);
        v += 0.9;
      }
    }
    const acc = K * (target - a) - C * v;
    v += acc * dt;
    a += v * dt;
  }
  return { angle: a };
}

export function BalanceBeam({
  items = ["$4,800", "62 hours", "3 tools", "9 revisions", "2 freelancers"],
  accentLabel = "remocn",
  title = "One block.",
  subtitle = "Outweighs the whole stack.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: BalanceBeamProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];

  const halfL = 400 * u;
  const beamT = 10 * u;
  const blockH = 46 * u;
  const gap = 6 * u;
  const fs = 18 * u;
  const cx = width / 2;
  const groundY = height * 0.86;
  const fulH = 108 * u;
  const pivotY = groundY - fulH;
  const fulW = 92 * u;

  const isLogo = accentLabel === "remocn";
  const logoSize = 21 * u;
  const widthOf = (s: string) =>
    Math.max(76 * u, s.length * 0.52 * fs + 36 * u);

  const { blocks, accentBlock } = (() => {
    const sized = items
      .slice(0, 8)
      .map((label) => ({ label, w: widthOf(label) }))
      .sort((a, b) => b.w - a.w);
    const rows = rowSizes(sized.length);
    const stackX = -0.6 * halfL;
    const out: Block[] = [];
    let k = 0;
    rows.forEach((n, r) => {
      const row = sized.slice(k, k + n);
      const total = row.reduce((s, b) => s + b.w, 0) + gap * (n - 1);
      let x = stackX - total / 2;
      row.forEach((b) => {
        const spawn = START + out.length * STEP;
        out.push({
          label: b.label,
          w: b.w,
          lx: x + b.w / 2,
          ly: -beamT - blockH / 2 - r * blockH,
          spawn,
          land: spawn + FALL,
        });
        x += b.w + gap;
      });
      k += n;
    });
    const last = out.length ? out[out.length - 1].land : START;
    const aw = isLogo
      ? (LOGO_W / 100) * logoSize + 40 * u
      : widthOf(accentLabel);
    const aSpawn = last + ACCENT_GAP;
    const acc: Block = {
      label: accentLabel,
      w: aw,
      lx: 0.62 * halfL,
      ly: -beamT - blockH / 2,
      spawn: aSpawn,
      land: aSpawn + ACCENT_FALL,
    };
    return { blocks: out, accentBlock: acc };
  })();

  const { angle } = simulate(
    t,
    blocks.map((b) => b.land),
    accentBlock.land,
  );
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const toWorld = (lx: number, ly: number) => ({
    x: cx + lx * cos - ly * sin,
    y: pivotY + lx * sin + ly * cos,
  });

  const heroAt = accentBlock.land + 22;
  const cam = interpolate(t, [heroAt - 8, heroAt + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const titleIn = interpolate(t, [heroAt + 2, heroAt + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const subIn = interpolate(t, [heroAt + 10, heroAt + 28], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const titleSize = 124 * u;
  const subSize = 24 * u;
  const titleTop = height * 0.1;
  const split = title.lastIndexOf(" ");
  const titleHead = split > 0 ? title.slice(0, split + 1) : title;
  const titleTail = split > 0 ? title.slice(split + 1) : "";
  const stackRows = rowSizes(blocks.length).length;
  const actionTop = pivotY - beamT - stackRows * blockH - 40 * u;
  const actionCenter = (actionTop + groundY) / 2;
  const startShift = height / 2 - actionCenter;
  const shift = startShift * (1 - cam);

  const enter = interpolate(t, [0, 14], [0, 1], { ...CLAMP, easing: EASE_IO });
  const groundHalf = (halfL + 70 * u) * enter;
  const sw = Math.max(1, u);

  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const silkId = `silk${uid}`;
  const sheenId = `sheen${uid}`;

  const renderBlock = (b: Block, isAccent: boolean, key: string) => {
    const lt = t - b.spawn;
    if (lt < 0) return null;
    const dur = b.land - b.spawn;
    const k = Math.min(1, lt / dur);
    const rest = toWorld(b.lx, b.ly);
    const drop = rest.y + shift + blockH + 30 * u;
    const y = rest.y - drop * (1 - k * k);
    const align = interpolate(k, [0.72, 1], [0, 1], CLAMP);
    const rot = angle * align;
    return (
      <g key={key} transform={`translate(${rest.x} ${y}) rotate(${rot})`}>
        <rect
          x={-b.w / 2}
          y={-blockH / 2}
          width={b.w}
          height={blockH}
          rx={5 * u}
          fill={isAccent ? `url(#${silkId})` : p.block}
          stroke={isAccent ? "none" : p.blockEdge}
          strokeWidth={sw}
        />
        {isAccent ? (
          <rect
            x={-b.w / 2}
            y={-blockH / 2}
            width={b.w}
            height={blockH}
            rx={5 * u}
            fill={`url(#${sheenId})`}
          />
        ) : null}
        {isAccent && isLogo ? (
          <LogoGlyphs size={logoSize} fill="#FFFFFF" />
        ) : (
          <text
            x={0}
            y={fs * 0.36}
            textAnchor="middle"
            fontFamily={sans}
            fontWeight={500}
            fontSize={fs}
            letterSpacing="-0.005em"
            fill={isAccent ? "#FFFFFF" : p.blockText}
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            {b.label}
          </text>
        )}
      </g>
    );
  };

  const levelY = pivotY - beamT / 2;
  const tip = interpolate(angle, [0, FINAL_TILT], [0, 1], CLAMP);
  const drift = interpolate(t, [0, 175], [0, 1], CLAMP);
  // gradients.sh "silk": #3b3fd8, #f3d6c0, #8a7bff on #030308
  const silkGround = p.ground
    ? [
        `linear-gradient(${148 + 4 * drift}deg, transparent ${50 + 3 * drift}%, rgba(243,214,192,${0.06 * tip}) ${60 + 3 * drift}%, transparent ${70 + 3 * drift}%)`,
        `radial-gradient(42% 46% at ${76 - 3 * drift}% ${72 + 4 * tip}%, rgba(138,123,255,${0.06 + 0.12 * tip}) 0%, transparent 70%)`,
        `radial-gradient(70% 70% at ${70 - 4 * drift}% 80%, rgba(59,63,216,${0.1 + 0.18 * tip}) 0%, transparent 72%)`,
      ].join(", ")
    : `radial-gradient(46% 52% at ${74 - 3 * drift}% 76%, rgba(138,123,255,${0.03 + 0.1 * tip}) 0%, transparent 72%)`;

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ backgroundImage: silkGround, opacity: enter }} />
      <AbsoluteFill style={{ transform: `translateY(${shift}px)` }}>
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
          aria-hidden
        >
          <defs>
            <linearGradient id={silkId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#8A7BFF" />
              <stop offset="0.55" stopColor="#3B3FD8" />
              <stop offset="1" stopColor="#23268F" />
            </linearGradient>
            <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0.35">
              <stop
                offset={0.18 + 0.1 * drift}
                stopColor="#F3D6C0"
                stopOpacity="0"
              />
              <stop
                offset={0.3 + 0.1 * drift}
                stopColor="#F3D6C0"
                stopOpacity="0.4"
              />
              <stop
                offset={0.44 + 0.1 * drift}
                stopColor="#F3D6C0"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <line
            x1={cx - groundHalf}
            x2={cx + groundHalf}
            y1={groundY + sw / 2}
            y2={groundY + sw / 2}
            stroke={p.axis}
            strokeWidth={sw}
          />
          <line
            x1={cx - (halfL + 36 * u) * enter}
            x2={cx + (halfL + 36 * u) * enter}
            y1={levelY}
            y2={levelY}
            stroke={p.level}
            strokeWidth={sw}
            strokeDasharray={`${4 * u} ${6 * u}`}
          />
          <g opacity={enter} transform={`translate(0 ${(1 - enter) * 12 * u})`}>
            <path
              d={`M ${cx} ${pivotY} L ${cx + fulW / 2} ${groundY} L ${cx - fulW / 2} ${groundY} Z`}
              fill={p.fulcrum}
            />
          </g>
          <g
            opacity={enter}
            transform={`translate(${cx} ${pivotY + (1 - enter) * 12 * u}) rotate(${angle})`}
          >
            <rect
              x={-halfL}
              y={-beamT}
              width={halfL * 2}
              height={beamT}
              rx={2 * u}
              fill={p.beam}
            />
          </g>
          {blocks.map((b, i) => renderBlock(b, false, `b${i}`))}
          {renderBlock(accentBlock, true, "acc")}
          <circle
            cx={cx}
            cy={pivotY - beamT / 2}
            r={3.2 * u}
            fill={p.bg}
            opacity={enter}
          />
        </svg>
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: titleTop,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14 * u,
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            fontFamily: display,
            fontWeight: 400,
            fontSize: titleSize,
            lineHeight: 0.95,
            letterSpacing: "-0.025em",
            color: p.fg,
            opacity: titleIn,
            filter:
              titleIn < 0.99 ? `blur(${(1 - titleIn) * 8 * u}px)` : undefined,
            transform: `translateY(${(1 - titleIn) * 18 * u}px)`,
          }}
        >
          {titleHead}
          {titleTail ? (
            <span style={{ fontFamily: displayItalic, fontStyle: "italic" }}>
              {titleTail}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: subSize,
              lineHeight: 1.2,
              letterSpacing: "-0.005em",
              color: p.muted,
              opacity: subIn,
              transform: `translateY(${(1 - subIn) * 8 * u}px)`,
            }}
          >
            <span
              style={{
                width: 10 * u,
                height: 10 * u,
                borderRadius: "50%",
                background: accent,
              }}
            />
            {subtitle}
          </div>
        ) : null}
      </div>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
