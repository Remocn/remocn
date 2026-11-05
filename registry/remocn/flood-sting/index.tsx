"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const manrope = loadManrope("normal", {
  weights: ["600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

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

export type GlyphName =
  | "cluster"
  | "download"
  | "globe"
  | "gear"
  | "brackets"
  | "spark"
  | "grid"
  | "diamonds";

const gearPath = (() => {
  const pts: string[] = [];
  const teeth = 8;
  for (let i = 0; i < teeth * 4; i++) {
    const a = (i / (teeth * 4)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 4 === 0 || i % 4 === 1 ? 10.4 : 7.6;
    const off = (Math.PI * 2) / (teeth * 8);
    const aa = a + (i % 4 === 1 || i % 4 === 2 ? off : -off) * 0.4;
    pts.push(
      `${(12 + Math.cos(aa) * r).toFixed(2)} ${(12 + Math.sin(aa) * r).toFixed(2)}`,
    );
  }
  return `M${pts.join(" L")} Z M12 8.6 A3.4 3.4 0 1 0 12 15.4 A3.4 3.4 0 1 0 12 8.6 Z`;
})();

function Glyph({ name, color }: { name: GlyphName; color: string }) {
  const body: Record<GlyphName, ReactNode> = {
    cluster: (
      <g fill={color}>
        <circle cx="12" cy="6" r="3.9" />
        <circle cx="6" cy="12" r="3.9" />
        <circle cx="18" cy="12" r="3.9" />
        <circle cx="12" cy="18" r="3.9" />
        <rect x="9.4" y="9.4" width="5.2" height="5.2" />
      </g>
    ),
    download: (
      <path
        fill={color}
        d="M10.4 2.5h3.2v8.1h3.9L12 16.2l-5.5-5.6h3.9z M3 14.6h3.2v3.6h11.6v-3.6H21v6.8H3z"
      />
    ),
    globe: (
      <g fill="none" stroke={color} strokeWidth="2.6">
        <circle cx="12" cy="12" r="8.7" />
        <ellipse cx="12" cy="12" rx="3.8" ry="8.7" />
        <path d="M3.3 12h17.4" />
      </g>
    ),
    gear: <path fill={color} fillRule="evenodd" d={gearPath} />,
    brackets: (
      <path
        fill={color}
        d="M3.5 2.5h6.5v3.2H6.8v12.6H10v3.2H3.5z M20.5 2.5H14v3.2h3.2v12.6H14v3.2h6.5z M10.6 8.4h2.8v7.2h-2.8z"
      />
    ),
    spark: (
      <path
        fill={color}
        d="M12 1.8C12.9 8.3 15.7 11.1 22.2 12 15.7 12.9 12.9 15.7 12 22.2 11.1 15.7 8.3 12.9 1.8 12 8.3 11.1 11.1 8.3 12 1.8Z"
      />
    ),
    grid: (
      <g fill={color}>
        {[0, 1, 2].flatMap((r) =>
          [0, 1, 2].map((c) =>
            (r + c) % 2 === 0 ? (
              <rect
                key={`${r}-${c}`}
                x={2.6 + c * 6.6}
                y={2.6 + r * 6.6}
                width="5.6"
                height="5.6"
                rx="1"
              />
            ) : (
              <circle
                key={`${r}-${c}`}
                cx={5.4 + c * 6.6}
                cy={5.4 + r * 6.6}
                r="1.6"
              />
            ),
          ),
        )}
      </g>
    ),
    diamonds: (
      <g fill={color}>
        <path d="M12 1.6l4.2 4.2L12 10 7.8 5.8z" />
        <path d="M12 14l4.2 4.2-4.2 4.2-4.2-4.2z" />
        <path d="M5.8 7.8L10 12l-4.2 4.2L1.6 12z" />
        <path d="M18.2 7.8l4.2 4.2-4.2 4.2L14 12z" />
      </g>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      width="100%"
      height="100%"
      style={{ display: "block" }}
      aria-hidden
    >
      {body[name]}
    </svg>
  );
}

export interface FloodStingProps {
  icons?: GlyphName[];
  rolls?: GlyphName[][];
  pick?: number;
  theme?: "dark" | "light";
  paper?: string;
  ink?: string;
  flood?: string;
  logoColor?: string;
  hops?: string[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    paper: "#0d0d10",
    paperGlow: "rgba(120,130,255,0.07)",
    ink: "#ececf0",
    flood: "#3046f5",
    logo: "#ffffff",
    hairline: "rgba(236,236,240,0.16)",
    hops: ["#ececf0", "#d7f25c", "#ff9ad1", "#7d8bff"],
    hopInk: ["#0d0d10", "#0d0d10", "#0d0d10", "#ffffff"],
    groundParams: {
      kind: "mist",
      background: "#2f4cf5",
      colors: ["#8fa6ff", "#4a66ff", "#1f33c9", "#b9c6ff"],
      seed: 4,
      grain: 0.25,
    } as Partial<GradientParams>,
  },
  light: {
    paper: "#ebe8e3",
    paperGlow: "rgba(255,255,255,0.7)",
    ink: "#17171a",
    flood: "#f0560f",
    logo: "#170d06",
    hairline: "rgba(23,23,26,0.14)",
    hops: ["#17171a", "#7d8bff", "#ff9ad1", "#cdea4f"],
    hopInk: ["#ebe8e3", "#ffffff", "#17171a", "#17171a"],
    groundParams: {
      kind: "mist",
      background: "#f0560f",
      colors: ["#ff9a4d", "#ff6a1f", "#d63d0a", "#ffb37a"],
      seed: 4,
      grain: 0.25,
    } as Partial<GradientParams>,
  },
};

const DEFAULT_ICONS: GlyphName[] = [
  "cluster",
  "download",
  "globe",
  "gear",
  "brackets",
];
const DEFAULT_ROLLS: GlyphName[][] = [
  ["grid", "spark", "globe", "diamonds", "cluster"],
  ["diamonds", "grid", "spark", "cluster", "download"],
];

const BEATS = [
  { name: "row", at: -12 },
  { name: "select", at: 0 },
  { name: "hop1", at: 6 },
  { name: "hop2", at: 18 },
  { name: "roll1", at: 22 },
  { name: "hop3", at: 28 },
  { name: "hop4", at: 36 },
  { name: "roll2", at: 38 },
  { name: "hop5", at: 42 },
  { name: "press", at: 48 },
  { name: "flood", at: 54 },
  { name: "logo", at: 62 },
  { name: "flank", at: 62 },
  { name: "tuck", at: 96 },
  { name: "end", at: 120 },
] as const;
type BeatName = (typeof BEATS)[number]["name"];
const beat = (n: BeatName) => BEATS.find((b) => b.name === n)?.at ?? 0;
const HOPS: BeatName[] = ["hop1", "hop2", "hop3", "hop4", "hop5"];
const ROLLS: BeatName[] = ["roll1", "roll2"];

const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const BURST = Easing.bezier(0.83, 0, 0.17, 1);
const ROLL = Easing.bezier(0.65, 0, 0.35, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

export function FloodSting({
  icons = DEFAULT_ICONS,
  rolls = DEFAULT_ROLLS,
  pick = 2,
  theme = "dark",
  paper,
  ink,
  flood,
  logoColor,
  hops,
  ground,
  groundParams,
}: FloodStingProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const t = THEMES[theme];
  const portrait = H > W;
  const paperC = paper ?? t.paper;
  const inkC = ink ?? t.ink;
  const floodC = flood ?? t.flood;
  const logoC = logoColor ?? t.logo;
  const hopColors = hops ?? t.hops;
  const n = icons.length;
  const target = Math.max(0, Math.min(n - 1, pick));
  const sp = (at: number, config: Partial<typeof CARD>) =>
    spring({ frame: frame - at, fps, config });

  const S = portrait ? W * 0.108 : H * 0.112;
  const gap = S * (portrait ? 0.44 : 0.62);
  const cell = S + gap;
  const rowW = n * S + (n - 1) * gap;
  const cx = W / 2;
  const cy = H / 2;
  const slotX = (k: number) => cx - rowW / 2 + S / 2 + k * cell;

  const hopSlots = [Math.min(n - 1, 1), Math.min(n - 1, 3), 0, n - 1, target];
  let hx = slotX(hopSlots[0] as number);
  for (let i = 1; i < HOPS.length; i++) {
    const p = sp(beat(HOPS[i] as BeatName), CHIP);
    hx += (slotX(hopSlots[i] as number) - slotX(hopSlots[i - 1] as number)) * p;
  }
  const hopIdx = HOPS.reduce((acc, h, i) => (frame >= beat(h) ? i : acc), 0);
  const hlIn = sp(beat("hop1"), CHIP);
  const hlColor =
    hopIdx === HOPS.length - 1
      ? interpolateColors(
          frame,
          [beat("hop5"), beat("hop5") + 4],
          [hopColors[(hopIdx - 1) % hopColors.length] as string, floodC],
        )
      : (hopColors[hopIdx % hopColors.length] as string);
  const press = sp(beat("press"), CHIP);
  const pressScale = frame < beat("press") ? 1 : 0.86 + 0.14 * press;

  const floodP = interpolate(
    frame,
    [beat("flood"), beat("flood") + 15],
    [0, 1],
    { ...CLAMP, easing: BURST },
  );
  const fx = slotX(target);
  const r0 = S * 0.7;
  const rMax = Math.hypot(Math.max(fx, W - fx), H / 2) * 1.04;
  const floodR = r0 + (rMax - r0) * floodP;
  const pickedOut = interpolate(
    frame,
    [beat("flood") + 4, beat("flood") + 11],
    [0, 1],
    { ...CLAMP, easing: EXIT },
  );
  const logoIn = sp(beat("logo"), CARD);
  const logoSize = portrait ? W * 0.15 : H * 0.15;
  const logoW = logoSize * 3.95;
  const flank = sp(beat("flank"), CHIP);
  const tuck = interpolate(frame, [beat("tuck"), beat("tuck") + 8], [0, 1], {
    ...CLAMP,
    easing: EXIT,
  });
  const push = interpolate(frame, [0, beat("end")], [1, 1.04]);
  const selIn = sp(beat("select"), CARD);
  const boxPad = S * 0.55;
  const box = {
    x: cx - rowW / 2 - boxPad,
    y: cy - S / 2 - boxPad,
    w: rowW + boxPad * 2,
    h: S + boxPad * 2,
  };
  const dot = S * 0.13;
  const corners = [
    [box.x, box.y, -1],
    [box.x + box.w, box.y, 1],
    [box.x, box.y + box.h, -1],
    [box.x + box.w, box.y + box.h, 1],
  ] as const;
  const flankGap = logoW / 2 + logoSize * 0.42;
  const preset = ground;
  const gParams =
    groundParams ??
    (ground
      ? undefined
      : flood
        ? { ...t.groundParams, background: flood }
        : t.groundParams);

  const glyphAt = (k: number) => {
    const seq = [icons[k], ...rolls.map((r) => r[k])].filter(
      Boolean,
    ) as GlyphName[];
    const layers: { name: GlyphName; y: number }[] = [];
    let current = 0;
    ROLLS.forEach((rb, ri) => {
      if (ri + 1 >= seq.length) return;
      const st = beat(rb) + Math.abs(k - target);
      if (frame >= st) current = ri + 1;
    });
    const rbName = ROLLS[current - 1];
    if (current > 0 && rbName) {
      const st = beat(rbName) + Math.abs(k - target);
      const p = interpolate(frame, [st, st + 8], [0, 1], {
        ...CLAMP,
        easing: ROLL,
      });
      if (p < 1) {
        layers.push({ name: seq[current - 1] as GlyphName, y: -p });
      }
      layers.push({ name: seq[current] as GlyphName, y: 1 - p });
    } else {
      layers.push({ name: seq[0] as GlyphName, y: 0 });
    }
    return layers;
  };

  return (
    <AbsoluteFill style={{ backgroundColor: paperC, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(60% 55% at 50% 50%, ${t.paperGlow} 0%, transparent 70%), radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(0,0,0,${theme === "light" ? 0.06 : 0.35}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <div
          style={{
            position: "absolute",
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            boxShadow: `inset 0 0 0 1px ${t.hairline}`,
            opacity: selIn * (1 - floodP),
            transform: `scale(${1.06 - 0.06 * selIn})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: hx - (S * 1.36) / 2,
            top: cy - (S * 1.36) / 2,
            width: S * 1.36,
            height: S * 1.36,
            borderRadius: S * 0.24,
            backgroundColor: hlColor,
            transform: `scale(${hlIn * pressScale})`,
            boxShadow: `0 ${S * 0.08}px ${S * 0.24}px rgba(0,0,0,${theme === "light" ? 0.12 : 0.4})`,
          }}
        />
        {icons.map((_, k) => {
          const pop = sp(beat("row") + k * 2, CHIP);
          const isPick = k === target && frame >= beat("hop5");
          const overlap =
            hlIn *
            Math.max(0, Math.min(1, 1.6 - Math.abs(hx - slotX(k)) / (S * 0.5)));
          const color = interpolateColors(
            overlap,
            [0, 1],
            [
              inkC,
              isPick
                ? "#ffffff"
                : (t.hopInk[hopIdx % t.hopInk.length] as string),
            ],
          );
          return (
            <div
              key={`slot-${k}`}
              style={{
                position: "absolute",
                left: slotX(k) - S / 2,
                top: cy - S / 2,
                width: S,
                height: S,
                overflow: "hidden",
                transform: `scale(${pop * (isPick ? pressScale : 1)})`,
                opacity: Math.min(1, pop * 1.5),
              }}
            >
              {glyphAt(k).map((l, li) => (
                <div
                  key={`${l.name}-${li}`}
                  style={{
                    position: "absolute",
                    inset: S * 0.06,
                    transform: `translateY(${l.y * S * 1.1}px)`,
                  }}
                >
                  <Glyph name={l.name} color={color} />
                </div>
              ))}
            </div>
          );
        })}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          clipPath: `circle(${floodR}px at ${cx + (fx - cx) * push}px ${cy}px)`,
          opacity: frame >= beat("flood") ? 1 : 0,
        }}
      >
        <GshGround
          preset={preset}
          params={gParams}
          timeOffset={2}
          timeScale={0.6}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {frame >= beat("flood") && pickedOut < 1 ? (
          <div
            style={{
              position: "absolute",
              left: fx - S / 2,
              top: cy - S / 2,
              width: S,
              height: S,
              padding: S * 0.06,
              boxSizing: "border-box",
              transform: `scale(${1 - 0.5 * pickedOut})`,
              opacity: 1 - pickedOut,
              filter: `blur(${pickedOut * 6}px)`,
            }}
          >
            <Glyph
              name={
                glyphAt(target)[glyphAt(target).length - 1]?.name ?? "globe"
              }
              color="#ffffff"
            />
          </div>
        ) : null}
        {corners.map(([x0, y0, side], i) => {
          const before = interpolate(
            frame,
            [beat("select") + i, beat("select") + i + 8],
            [0, 1],
            CLAMP,
          );
          const popIn = sp(beat("select") + i * 2, CHIP);
          const tx = cx + side * flankGap;
          const x = x0 + (tx - x0) * flank;
          const y = y0 + (cy - y0) * flank;
          const col = interpolateColors(
            floodP,
            [0, 0.6, 1],
            [floodC, floodC, logoC],
          );
          const merge = i >= 2 ? 1 - flank : 1;
          const s = popIn * (1 - tuck) * merge;
          return (
            <div
              key={`dot-${i}`}
              style={{
                position: "absolute",
                left: x - dot / 2,
                top: y - dot / 2,
                width: dot,
                height: dot,
                borderRadius: "50%",
                backgroundColor: col,
                opacity: before,
                transform: `scale(${Math.max(0, s)})`,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: cy - logoSize * 0.5,
            display: "flex",
            justifyContent: "center",
            opacity: Math.min(1, logoIn * 1.6),
            transform: `translateY(${(1 - logoIn) * logoSize * 0.3}px) scale(${0.86 + 0.14 * logoIn})`,
            filter: logoIn < 0.98 ? `blur(${(1 - logoIn) * 8}px)` : undefined,
          }}
        >
          <RemocnLogo fontSize={logoSize} color={logoC} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export default FloodSting;
