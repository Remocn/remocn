"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: mono } = loadMono("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600, tracking-tight. */
function RemocnLogo({ fontSize, color }: { fontSize: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        fontSize,
        letterSpacing: "-0.025em",
        lineHeight: 1,
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </div>
  );
}

const isBrandLabel = (label: string) => label.trim().toLowerCase() === "remocn";

export interface RankItem {
  label: string;
  value: number;
}

export interface RankClimbProps {
  items?: RankItem[];
  brand?: string;
  from?: number;
  to?: number;
  eyebrow?: string;
  caption?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_ITEMS: RankItem[] = [
  { label: "remocn", value: 2318 },
  { label: "Kitebase", value: 2140 },
  { label: "Lumen", value: 1986 },
  { label: "Fernway", value: 1712 },
  { label: "Quarry", value: 1544 },
  { label: "Orbitly", value: 1390 },
  { label: "Halcyon", value: 1208 },
  { label: "Tessel", value: 1062 },
];

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_SWAP = Easing.bezier(0.6, 0, 0.3, 1);
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
    faint: "#5A595F",
    hair: "rgba(255,255,255,0.09)",
    pill: "#1B1B1F",
    pillEdge: "rgba(255,255,255,0.14)",
    shadow: "rgba(0,0,0,0.55)",
    stage: "rgba(255,255,255,0.05)",
    // gradients.sh "fluted": cobalt into ember into peach, top to bottom.
    paint:
      "linear-gradient(172deg, #2F7BFF 8%, #8C7BFF 38%, #FF7A3D 70%, #FFE2C4 96%)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    faint: "#A3A099",
    hair: "rgba(18,18,20,0.09)",
    pill: "#FFFFFF",
    pillEdge: "rgba(18,18,20,0.12)",
    shadow: "rgba(40,36,28,0.16)",
    stage: "rgba(255,255,255,0.7)",
    paint: "linear-gradient(172deg, #1D2A8F 8%, #2F7BFF 40%, #FF7A3D 82%)",
    grain: 0.045,
  },
} as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

const T_CLIMB = 28;
const LAST_DUR = 22;

function groupThousands(n: number) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
          seed={13}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function RollNumber({
  value,
  min,
  max,
  size,
  lineHeight,
  color,
  font,
  weight,
  travel = 0.34,
  blur = 0,
  paint,
}: {
  value: number;
  min: number;
  max: number;
  size: number;
  lineHeight: number;
  color: string;
  font: string;
  weight: number;
  travel?: number;
  blur?: number;
  paint?: string;
}) {
  const nums: number[] = [];
  for (let n = min; n <= max; n++) nums.push(n);
  const lh = size * lineHeight;
  const text: React.CSSProperties = {
    height: lh,
    lineHeight: `${lh}px`,
    fontFamily: font,
    fontWeight: weight,
    fontSize: size,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
    ...(paint
      ? {
          backgroundImage: paint,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }
      : null),
  };
  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        height: lh,
        verticalAlign: "top",
      }}
    >
      <span style={{ ...text, visibility: "hidden" }}>{max}</span>
      {nums.map((n) => {
        const d = n - value;
        const a = interpolate(Math.abs(d), [0, 0.62], [1, 0], CLAMP);
        if (a <= 0) return null;
        const b = Math.abs(d) * blur;
        return (
          <span
            key={n}
            style={{
              ...text,
              position: "absolute",
              left: 0,
              top: 0,
              color,
              opacity: a,
              transform: `translateY(${d * travel * size}px)`,
              filter: b > 0.2 ? `blur(${b}px)` : undefined,
            }}
          >
            {n}
          </span>
        );
      })}
    </span>
  );
}

function Upvote({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" aria-hidden>
      <path d="M5 1.6 L9 8.2 H1 Z" fill={color} />
    </svg>
  );
}

function Row({
  item,
  pos,
  isBrand,
  n,
  rowH,
  rowW,
  u,
  enter,
  lift,
  dim,
  win,
  value,
  accent,
  th,
}: {
  item: RankItem;
  pos: number;
  isBrand: boolean;
  n: number;
  rowH: number;
  rowW: number;
  u: number;
  enter: number;
  lift: number;
  dim: number;
  win: number;
  value: number;
  accent: string;
  th: Theme;
}) {
  const pad = 22 * u;
  const pillBg = interpolateColors(win, [0, 1], [th.pill, accent]);
  const nameColor = isBrand
    ? interpolateColors(win, [0, 1], [th.fg, "#FFFFFF"])
    : th.fg;
  const subColor = isBrand
    ? interpolateColors(win, [0, 1], [th.muted, "rgba(255,255,255,0.78)"])
    : th.muted;
  const inset = 4 * u;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: pos * rowH,
        width: rowW,
        height: rowH,
        zIndex: isBrand ? 2 : 1,
        opacity: enter * (isBrand ? 1 : 1 - 0.62 * dim),
        transform: `translateY(${(1 - enter) * 14 * u}px) scale(${1 + 0.018 * lift})`,
      }}
    >
      {isBrand ? (
        <div
          style={{
            position: "absolute",
            left: -pad * 0.55,
            right: -pad * 0.55,
            top: inset,
            bottom: inset,
            borderRadius: 14 * u,
            background: pillBg,
            boxShadow: `0 0 0 ${Math.max(1, u)}px ${interpolateColors(win, [0, 1], [th.pillEdge, accent])}, 0 ${(4 + 14 * lift) * u}px ${(10 + 30 * lift) * u}px ${th.shadow}`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 18 * u,
          paddingLeft: pad * 0.25,
          paddingRight: pad * 0.25,
        }}
      >
        <div style={{ width: 34 * u, display: "flex" }}>
          <RollNumber
            value={pos + 1}
            min={1}
            max={n}
            size={20 * u}
            lineHeight={1.3}
            color={subColor}
            font={mono}
            weight={400}
            travel={0.6}
            blur={2 * u}
          />
        </div>
        <span
          style={{
            flex: 1,
            display: "flex",
            fontFamily: sans,
            fontSize: 25 * u,
            fontWeight: isBrand ? 500 : 400,
            letterSpacing: "-0.02em",
            color: nameColor,
            whiteSpace: "nowrap",
          }}
        >
          {isBrandLabel(item.label) ? (
            <RemocnLogo fontSize={25 * u} color={nameColor} />
          ) : (
            item.label
          )}
        </span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8 * u,
            fontFamily: mono,
            fontSize: 18 * u,
            fontWeight: 400,
            fontVariantNumeric: "tabular-nums",
            color: subColor,
          }}
        >
          <Upvote size={11 * u} color={subColor} />
          {groupThousands(value)}
        </span>
      </div>
    </div>
  );
}

export function RankClimb({
  items = DEFAULT_ITEMS,
  brand = "remocn",
  from = 8,
  to = 1,
  eyebrow = "Product of the day",
  caption = "on Product Hunt",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: RankClimbProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const th: Theme = THEMES[theme];

  const found = items.find((i) => i.label === brand);
  const others = items
    .filter((i) => i.label !== brand)
    .slice()
    .sort((a, b) => b.value - a.value);
  const brandItem: RankItem = found ?? {
    label: brand,
    value: Math.round((others[0]?.value ?? 1000) * 1.08),
  };
  const n = others.length + 1;
  const start = Math.min(Math.max(1, Math.round(from)), n) - 1;
  const end = Math.min(Math.max(1, Math.round(to)), start + 1) - 1;
  const K = start - end;

  const swaps: { s: number; d: number; passed: number }[] = [];
  let clock = T_CLIMB;
  for (let k = 0; k < K; k++) {
    const last = k === K - 1;
    const gap = K > 1 ? 13 - (5 * k) / Math.max(1, K - 2) : 13;
    const s = clock + (last && K > 1 ? 3 : 0);
    const d = last ? LAST_DUR : gap * 1.35;
    swaps.push({ s, d, passed: start - 1 - k });
    clock += gap;
  }
  const climbEnd = swaps.length
    ? swaps[swaps.length - 1].s + swaps[swaps.length - 1].d
    : T_CLIMB;
  const prog = swaps.map((w) =>
    interpolate(t, [w.s, w.s + w.d], [0, 1], { ...CLAMP, easing: EASE_SWAP }),
  );

  const initialSlot = (i: number) => (i < start ? i : i + 1);
  const brandPos = start - prog.reduce((a, b) => a + b, 0);

  const checkpoints: number[] = [];
  if (K > 0) {
    const firstPassed = others[swaps[0].passed]?.value ?? brandItem.value;
    checkpoints.push(Math.min(firstPassed * 0.9, brandItem.value * 0.9));
    swaps.forEach((w, k) => {
      const pv = others[w.passed]?.value ?? 0;
      checkpoints.push(
        k === K - 1
          ? brandItem.value
          : Math.min(pv + 14, brandItem.value - (K - k) * 10),
      );
    });
  }
  const brandValue =
    K > 0
      ? prog.reduce(
          (v, e, k) => v + (checkpoints[k + 1] - checkpoints[k]) * e,
          checkpoints[0],
        )
      : brandItem.value;

  const lift = swaps.length
    ? interpolate(
        t,
        [T_CLIMB - 4, T_CLIMB + 6, climbEnd - 6, climbEnd + 6],
        [0, 1, 1, 0],
        { ...CLAMP, easing: EASE_IO },
      )
    : 0;
  const T_WIN = climbEnd - 2;
  const win = interpolate(t, [T_WIN, T_WIN + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const dim = interpolate(t, [T_WIN + 2, T_WIN + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const capIn = interpolate(t, [T_WIN + 4, T_WIN + 26], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const margin = width * 0.085;
  const listX = width * 0.5;
  const rowW = width - margin - listX;
  const rowH = Math.min(62 * u, (height * 0.7) / n);
  const listH = rowH * n;
  const listTop = (height - listH) / 2;

  const leftIn = interpolate(t, [-6, 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const bigSize = Math.min(232 * u, width * 0.18);
  const bigColor = interpolateColors(win, [0, 1], [th.muted, th.fg]);
  const push = interpolate(t, [0, climbEnd + 60], [1.03, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  return (
    <AbsoluteFill style={{ background: th.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 70% at 30% 40%, ${th.stage}, transparent 75%)`,
        }}
      />
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        <div
          style={{
            position: "absolute",
            left: margin,
            top: height / 2,
            transform: `translateY(-50%) translateY(${(1 - leftIn) * 12 * u}px)`,
            opacity: leftIn,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
          }}
        >
          <span
            style={{
              fontFamily: mono,
              fontSize: 15 * u,
              fontWeight: 400,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: th.muted,
              whiteSpace: "nowrap",
              marginBottom: 14 * u,
            }}
          >
            {eyebrow}
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              marginLeft: -bigSize * 0.04,
              letterSpacing: "-0.045em",
            }}
          >
            <span
              style={{
                position: "relative",
                fontFamily: sans,
                fontWeight: 400,
                fontSize: bigSize,
                lineHeight: `${bigSize * 1.04}px`,
                color: th.faint,
                marginRight: bigSize * 0.03,
              }}
            >
              <span style={{ opacity: 1 - win }}>#</span>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  opacity: win,
                  backgroundImage: th.paint,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                #
              </span>
            </span>
            <span style={{ position: "relative", display: "inline-block" }}>
              <span style={{ display: "inline-block", opacity: 1 - win }}>
                <RollNumber
                  value={brandPos + 1}
                  min={end + 1}
                  max={start + 1}
                  size={bigSize}
                  lineHeight={1.04}
                  color={bigColor}
                  font={sans}
                  weight={500}
                  blur={14 * u}
                />
              </span>
              <span
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  opacity: win,
                }}
              >
                <RollNumber
                  value={brandPos + 1}
                  min={end + 1}
                  max={start + 1}
                  size={bigSize}
                  lineHeight={1.04}
                  color={bigColor}
                  font={sans}
                  weight={500}
                  blur={14 * u}
                  paint={th.paint}
                />
              </span>
            </span>
          </div>
          <span
            style={{
              marginTop: 4 * u,
              fontFamily: sans,
              fontWeight: 400,
              fontSize: 50 * u,
              letterSpacing: "-0.03em",
              color: th.fg,
              whiteSpace: "nowrap",
              opacity: capIn,
              transform: `translateY(${(1 - capIn) * 14 * u}px)`,
              filter:
                capIn < 0.98 ? `blur(${(1 - capIn) * 6 * u}px)` : undefined,
            }}
          >
            {caption}
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            left: listX,
            top: listTop,
            width: rowW,
            height: listH,
          }}
        >
          {Array.from({ length: n - 1 }).map((_, i) => {
            const a = interpolate(t, [i * 2 + 4, i * 2 + 22], [0, 1], {
              ...CLAMP,
              easing: EASE_IO,
            });
            return (
              <div
                key={`h${i}`}
                style={{
                  position: "absolute",
                  left: 0,
                  top: (i + 1) * rowH,
                  height: Math.max(1, u),
                  width: rowW * a,
                  background: th.hair,
                  opacity: 1 - 0.5 * dim,
                }}
              />
            );
          })}
          {others.map((item, i) => {
            const slot = initialSlot(i);
            const k = swaps.findIndex((w) => w.passed === i);
            const pos = slot + (k >= 0 ? prog[k] : 0);
            const enter = interpolate(
              t,
              [slot * 2 - 6, slot * 2 + 14],
              [0, 1],
              {
                ...CLAMP,
                easing: EASE_OUT,
              },
            );
            return (
              <Row
                key={item.label}
                item={item}
                pos={pos}
                isBrand={false}
                n={n}
                rowH={rowH}
                rowW={rowW}
                u={u}
                enter={enter}
                lift={0}
                dim={dim}
                win={0}
                value={item.value}
                accent={accent}
                th={th}
              />
            );
          })}
          <Row
            item={brandItem}
            pos={brandPos}
            isBrand
            n={n}
            rowH={rowH}
            rowW={rowW}
            u={u}
            enter={interpolate(t, [start * 2 - 6, start * 2 + 14], [0, 1], {
              ...CLAMP,
              easing: EASE_OUT,
            })}
            lift={lift}
            dim={dim}
            win={win}
            value={brandValue}
            accent={accent}
            th={th}
          />
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 60%, ${th.bg} 100%)`,
          opacity: 0.55,
        }}
      />
      <Grain opacity={th.grain} />
    </AbsoluteFill>
  );
}
