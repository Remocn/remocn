"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const { fontFamily } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const { fontFamily: monoFamily } = loadMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export type BentoVisual =
  | "chart"
  | "toggle"
  | "code"
  | "chips"
  | "avatars"
  | "none";
export type BentoIconName =
  | "sparkles"
  | "bolt"
  | "code"
  | "palette"
  | "users"
  | "layers"
  | "sliders"
  | "chart";

export interface BentoTile {
  title: string;
  description: string;
  icon?: BentoIconName | React.ReactNode;
  /** [columns, rows] the tile spans on the grid. */
  span: [number, number];
  visual?: BentoVisual;
}

export interface BentoBuildProps {
  tiles?: BentoTile[];
  /** Tile indices that get the spotlight, in order, after the grid locks. */
  highlightOrder?: number[];
  eyebrow?: string;
  heading?: string;
  columns?: number;
  theme?: "light" | "dark";
  accent?: string;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const DEFAULT_TILES: BentoTile[] = [
  {
    title: "Renders you can measure.",
    description: "Every export is tracked, so you know which beat lands.",
    span: [2, 2],
    visual: "chart",
  },
  {
    title: "Motion presets.",
    description: "Springs tuned for 30fps.",
    span: [2, 1],
    visual: "toggle",
  },
  {
    title: "Own your code.",
    description: "It lands in your repo.",
    span: [1, 1],
    visual: "code",
  },
  {
    title: "Brand tokens.",
    description: "One accent, whole video.",
    span: [1, 1],
    visual: "chips",
  },
  {
    title: "124 components.",
    description: "Transitions, text, captions and full scenes.",
    span: [2, 1],
    visual: "chips",
  },
  {
    title: "Built for two.",
    description: "Review cuts together, ship on time.",
    span: [2, 1],
    visual: "avatars",
  },
];

const BUILD_STAGGER = 3;
const HIGHLIGHT_START = 46;
const HIGHLIGHT_LEN = 30;
const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const MORPH = { damping: 200 };
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

interface Placed {
  col: number;
  row: number;
  cols: number;
  rows: number;
}

function pack(tiles: BentoTile[], columns: number) {
  const taken: boolean[][] = [];
  const isFree = (r: number, c: number) => !taken[r]?.[c];
  const placed: Placed[] = [];
  for (const tile of tiles) {
    const cols = Math.max(1, Math.min(columns, tile.span[0]));
    const rows = Math.max(1, tile.span[1]);
    let done = false;
    for (let r = 0; !done; r++) {
      for (let c = 0; c + cols <= columns && !done; c++) {
        let fits = true;
        for (let dr = 0; dr < rows && fits; dr++)
          for (let dc = 0; dc < cols && fits; dc++)
            if (!isFree(r + dr, c + dc)) fits = false;
        if (!fits) continue;
        for (let dr = 0; dr < rows; dr++) {
          taken[r + dr] = taken[r + dr] ?? [];
          for (let dc = 0; dc < cols; dc++) taken[r + dr][c + dc] = true;
        }
        placed.push({ col: c, row: r, cols, rows });
        done = true;
      }
    }
  }
  return { placed, rowCount: taken.length };
}

interface Palette {
  tile: string;
  edge: string;
  lift: (f: number) => string;
  text: string;
  muted: string;
  faint: string;
  inset: string;
  hair: string;
  scrim: string;
  dark: boolean;
}

function palette(theme: "light" | "dark"): Palette {
  return theme === "dark"
    ? {
        tile: "rgba(14,15,18,0.74)",
        edge: "inset 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)",
        lift: () => "",
        text: "#F2F2F3",
        muted: "rgba(242,242,243,0.5)",
        faint: "rgba(242,242,243,0.34)",
        inset: "rgba(255,255,255,0.035)",
        hair: "rgba(255,255,255,0.08)",
        scrim: "rgba(3,4,8,0.38)",
        dark: true,
      }
    : {
        tile: "rgba(255,255,255,0.84)",
        edge: "inset 0 0 0 1px rgba(255,255,255,0.7)",
        lift: (f) =>
          `, 0 0 0 1px rgba(15,17,22,0.05), 0 1px 3px rgba(15,17,22,0.05), 0 ${6 + 14 * f}px ${16 + 26 * f}px -8px rgba(15,17,22,${0.1 + 0.08 * f})`,
        text: "#121317",
        muted: "rgba(18,19,23,0.52)",
        faint: "rgba(18,19,23,0.36)",
        inset: "rgba(18,19,23,0.03)",
        hair: "rgba(18,19,23,0.08)",
        scrim: "rgba(245,244,241,0.3)",
        dark: false,
      };
}

function Glyph({ name, color }: { name: BentoIconName; color: string }) {
  const paths: Record<BentoIconName, string> = {
    sparkles: "M12 4l1.6 4.4L18 10l-4.4 1.6L12 16l-1.6-4.4L6 10l4.4-1.6z",
    bolt: "M13 3L5 14h6l-1 7 8-11h-6z",
    code: "M8 7l-5 5 5 5M16 7l5 5-5 5",
    palette:
      "M12 4a8 8 0 1 0 0 16c1 0 1.5-.7 1.5-1.4 0-.9-.9-1.4-.9-2.3 0-.9.7-1.5 1.6-1.5H16a4 4 0 0 0 4-4c0-3.7-3.6-6.8-8-6.8z",
    users:
      "M15 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 4 17.5V19M9.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM20 19v-1.5a3.5 3.5 0 0 0-2.5-3.4",
    layers: "M12 4l8 4.5-8 4.5-8-4.5zM4 13l8 4.5 8-4.5",
    sliders: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
    chart: "M5 19V11M12 19V5M19 19v-7",
  };
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ verticalAlign: "-0.12em", marginRight: "0.4em" }}
    >
      <path d={paths[name]} />
    </svg>
  );
}

interface VisualProps {
  pal: Palette;
  accent: string;
  reveal: number;
  focus: number;
  frame: number;
  u: number;
}

function Panel({
  pal,
  u,
  style,
  children,
}: {
  pal: Palette;
  u: number;
  style: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "absolute",
        background: pal.inset,
        boxShadow: `inset 0 0 0 1px ${pal.hair}`,
        borderRadius: 10 * u,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function ChartVisual({ pal, accent, reveal, focus, u }: VisualProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const values = [31, 44, 37, 52, 46, 61, 57, 70, 64, 78, 73, 91];
  const w = 100;
  const h = 40;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * w,
    h - (v / 100) * h * (0.35 + 0.65 * reveal),
  ]);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  const count = Math.round(12_486 * Math.min(1, reveal * 1.04));
  return (
    <Panel
      pal={pal}
      u={u}
      style={{
        left: 16 * u,
        right: 16 * u,
        top: 16 * u,
        bottom: 104 * u,
        padding: `${16 * u}px ${18 * u}px ${12 * u}px`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10 * u,
          fontSize: 14 * u,
          color: pal.muted,
        }}
      >
        Renders this week
        <span
          style={{
            marginLeft: "auto",
            color: pal.dark ? "#6FD39A" : "#1F8A4C",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          +18.4%
        </span>
      </div>
      <div
        style={{
          fontSize: 40 * u,
          fontWeight: 300,
          letterSpacing: "-0.03em",
          color: pal.text,
          marginTop: 2 * u,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {count.toLocaleString("en-US")}
      </div>
      <div style={{ position: "relative", flex: 1, marginTop: 10 * u }}>
        {[0.33, 0.66].map((g) => (
          <div
            key={g}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${g * 100}%`,
              height: 1,
              background: pal.hair,
            }}
          />
        ))}
        <svg
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <defs>
            <linearGradient id={`${id}-a`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0"
                stopColor={accent}
                stopOpacity={0.2 + 0.1 * focus}
              />
              <stop offset="1" stopColor={accent} stopOpacity={0} />
            </linearGradient>
            <clipPath id={`${id}-c`}>
              <rect x={0} y={0} width={w * reveal} height={h} />
            </clipPath>
          </defs>
          <path d={area} fill={`url(#${id}-a)`} clipPath={`url(#${id}-c)`} />
          <path
            d={line}
            fill="none"
            stroke={accent}
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            clipPath={`url(#${id}-c)`}
          />
        </svg>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12 * u,
          color: pal.faint,
          marginTop: 8 * u,
          fontFamily: monoFamily,
        }}
      >
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
    </Panel>
  );
}

function Toggle({
  on,
  accent,
  pal,
  u,
}: {
  on: number;
  accent: string;
  pal: Palette;
  u: number;
}) {
  const off = pal.dark ? "rgba(255,255,255,0.14)" : "rgba(18,19,23,0.14)";
  return (
    <div
      style={{
        width: 30 * u,
        height: 18 * u,
        borderRadius: 99,
        background: on > 0.5 ? accent : off,
        position: "relative",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2 * u,
          left: (2 + 12 * Math.min(1, on)) * u,
          width: 14 * u,
          height: 14 * u,
          borderRadius: 99,
          background: "#fff",
          boxShadow: "0 1px 2px rgba(0,0,0,0.25)",
        }}
      />
    </div>
  );
}

function ToggleVisual({ pal, accent, reveal, focus, u }: VisualProps) {
  const rows = [
    { label: "Spring", value: "18 / 160", on: 1 },
    { label: "Motion blur", value: "0.4", on: focus },
    { label: "Reduce motion", value: "auto", on: 0 },
  ];
  return (
    <Panel
      pal={pal}
      u={u}
      style={{
        right: 16 * u,
        top: 16 * u,
        bottom: 16 * u,
        width: "50%",
        padding: `0 ${14 * u}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        opacity: reveal,
      }}
    >
      {rows.map((r, i) => (
        <div
          key={r.label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
            height: 34 * u,
            borderTop: i ? `1px solid ${pal.hair}` : "none",
          }}
        >
          <span style={{ fontSize: 14 * u, color: pal.text }}>{r.label}</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12 * u,
              color: pal.faint,
              fontFamily: monoFamily,
            }}
          >
            {r.value}
          </span>
          <Toggle on={r.on} accent={accent} pal={pal} u={u} />
        </div>
      ))}
    </Panel>
  );
}

function CodeVisual({ pal, reveal, frame, u }: VisualProps) {
  const cmd = "@remocn/bento";
  const shown = cmd.slice(0, Math.round(cmd.length * reveal));
  const blink = Math.floor(frame / 8) % 2 === 0;
  return (
    <Panel
      pal={pal}
      u={u}
      style={{
        left: 16 * u,
        right: 16 * u,
        top: 16 * u,
        padding: `${12 * u}px ${12 * u}px`,
        fontFamily: monoFamily,
        fontSize: 13 * u,
        lineHeight: 1.6,
        color: pal.text,
        whiteSpace: "pre",
        overflow: "hidden",
      }}
    >
      <div>
        <span style={{ color: pal.faint }}>$ </span>npx shadcn add
      </div>
      <div>
        <span style={{ color: pal.faint }}>{"  "}</span>
        {shown}
        <span
          style={{
            display: "inline-block",
            width: 7 * u,
            height: 14 * u,
            marginLeft: 1,
            verticalAlign: "middle",
            background: blink ? pal.text : "transparent",
          }}
        />
      </div>
    </Panel>
  );
}

function ChipsVisual({
  pal,
  accent,
  reveal,
  focus,
  u,
  wide,
}: VisualProps & { wide: boolean }) {
  const chips = wide
    ? [
        "zoom-blur",
        "typewriter",
        "glass-card",
        "ken-burns",
        "caption-pop",
        "+119",
      ]
    : [accent.toUpperCase(), "Geist", "r 12"];
  return (
    <div
      style={{
        position: "absolute",
        right: 16 * u,
        left: wide ? "auto" : 16 * u,
        top: wide ? "50%" : 16 * u,
        transform: wide ? "translateY(-50%)" : "none",
        width: wide ? "50%" : "auto",
        display: "flex",
        flexWrap: "wrap",
        gap: 6 * u,
        justifyContent: wide ? "flex-end" : "flex-start",
      }}
    >
      {chips.map((c, i) => {
        const a = interpolate(reveal * chips.length - i, [0, 1], [0, 1], CL);
        const lit = i === 0 && focus > 0.5;
        return (
          <span
            key={c}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6 * u,
              fontSize: 13 * u,
              fontFamily: monoFamily,
              color: lit ? pal.text : pal.muted,
              background: pal.inset,
              boxShadow: `inset 0 0 0 1px ${lit ? withAlpha(accent, 0.6) : pal.hair}`,
              padding: `${5 * u}px ${9 * u}px`,
              borderRadius: 6 * u,
              opacity: a,
              transform: `translateY(${(1 - a) * 6 * u}px)`,
            }}
          >
            {!wide && i === 0 ? (
              <span
                style={{
                  width: 9 * u,
                  height: 9 * u,
                  borderRadius: 2 * u,
                  background: accent,
                }}
              />
            ) : null}
            {c}
          </span>
        );
      })}
    </div>
  );
}

function AvatarsVisual({ pal, reveal, u }: VisualProps) {
  const people = ["MC", "LP"];
  return (
    <Panel
      pal={pal}
      u={u}
      style={{
        right: 16 * u,
        top: "50%",
        transform: "translateY(-50%)",
        width: "50%",
        padding: `${10 * u}px ${12 * u}px`,
        display: "flex",
        flexDirection: "column",
        gap: 6 * u,
        opacity: reveal,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 * u }}>
        <div style={{ display: "flex" }}>
          {people.map((p, i) => (
            <div
              key={p}
              style={{
                width: 24 * u,
                height: 24 * u,
                borderRadius: 99,
                background: pal.dark ? "#2A2B30" : "#E7E6E2",
                boxShadow: `0 0 0 ${2 * u}px ${pal.dark ? "#121317" : "#fff"}`,
                marginLeft: i ? -5 * u : 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10 * u,
                color: pal.text,
                transform: `translateX(${(1 - reveal) * -8 * i * u}px)`,
              }}
            >
              {p}
            </div>
          ))}
        </div>
        <span style={{ fontSize: 13 * u, color: pal.muted }}>Maya · cut 3</span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 12 * u,
            fontFamily: monoFamily,
            color: pal.faint,
          }}
        >
          0:04
        </span>
      </div>
      <div style={{ fontSize: 14 * u, color: pal.text }}>
        Hold the logo six more frames.
      </div>
    </Panel>
  );
}

export function BentoBuild({
  tiles = DEFAULT_TILES,
  highlightOrder = [0, 1, 4],
  eyebrow = "Features",
  heading = "Everything a launch video needs.",
  columns = 4,
  theme = "dark",
  accent = "#3B5BFD",
  speed = 1,
  ground,
  groundParams,
}: BentoBuildProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const tall = height > width;
  const u = tall ? width / 760 : Math.min(width / 1280, height / 720);
  const pal = palette(theme);
  const cols = tall ? Math.min(2, columns) : columns;
  const { placed, rowCount } = pack(tiles, cols);

  const padX = tall ? width * 0.07 : 150 * u;
  const headTop = tall ? height * 0.07 : 48 * u;
  const headerH = tall ? 150 * u : 92 * u;
  const top = headTop + headerH;
  const gap = 12 * u;
  const gridW = width - padX * 2;
  const gridH = height - top - (tall ? height * 0.07 : 44 * u);
  const cellW = (gridW - gap * (cols - 1)) / cols;
  const cellH = (gridH - gap * (rowCount - 1)) / Math.max(1, rowCount);

  const buildEnd = BUILD_STAGGER * tiles.length + 26;
  const focusOf = (i: number) => {
    let v = 0;
    highlightOrder.forEach((idx, k) => {
      if (idx !== i) return;
      const s = HIGHLIGHT_START + k * HIGHLIGHT_LEN;
      v += interpolate(
        frame,
        [s - 5, s + 5, s + HIGHLIGHT_LEN - 5, s + HIGHLIGHT_LEN + 5],
        [0, 1, 1, 0],
        { ...CL, easing: MOVE },
      );
    });
    return Math.min(1, v);
  };
  const focus = tiles.map((_, i) => focusOf(i));
  const anyFocus = Math.min(
    1,
    focus.reduce((a, b) => a + b, 0),
  );

  const camIn = interpolate(frame, [0, buildEnd + 6], [0.97, 1], {
    extrapolateRight: "clamp",
    easing: LIGHT,
  });
  let camX = 0;
  let camY = 0;
  placed.forEach((p, i) => {
    const cx =
      padX + p.col * (cellW + gap) + (p.cols * cellW + (p.cols - 1) * gap) / 2;
    const cy =
      top + p.row * (cellH + gap) + (p.rows * cellH + (p.rows - 1) * gap) / 2;
    camX += focus[i] * (width / 2 - cx) * 0.05;
    camY += focus[i] * (height / 2 - cy) * 0.05;
  });
  const camScale = camIn * (1 + 0.02 * anyFocus);

  const eyeIn = interpolate(frame, [0, 12], [0, 1], { ...CL, easing: LIGHT });
  const headIn = interpolate(frame, [2, 18], [0, 1], { ...CL, easing: ENTER });
  const headSize = tall ? 52 * u : 40 * u;

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={ground ?? (pal.dark ? "film-blue" : "glasswork")}
        params={groundParams}
        timeOffset={pal.dark ? 6 : 3}
        timeScale={0.3}
      />
      <AbsoluteFill style={{ background: pal.scrim }} />
      <AbsoluteFill
        style={{
          transform: `translate(${camX}px, ${camY}px) scale(${camScale})`,
          transformOrigin: "50% 55%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: padX,
            right: padX,
            top: headTop,
            opacity: 1 - 0.4 * anyFocus,
          }}
        >
          {eyebrow ? (
            <div
              style={{
                fontSize: (tall ? 22 : 17) * u,
                color: pal.muted,
                opacity: eyeIn,
                transform: `translateY(${(1 - eyeIn) * 8 * u}px)`,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div style={{ overflow: "hidden", paddingBottom: 6 * u }}>
            <div
              style={{
                fontSize: headSize,
                fontWeight: 300,
                letterSpacing: "-0.035em",
                lineHeight: 1.08,
                textWrap: "balance",
                color: pal.text,
                marginTop: 6 * u,
                transform: `translateY(${(1 - headIn) * 110}%)`,
              }}
            >
              {heading}
            </div>
          </div>
        </div>

        {tiles.map((tile, i) => {
          const p = placed[i];
          const x = padX + p.col * (cellW + gap);
          const y = top + p.row * (cellH + gap);
          const w = p.cols * cellW + (p.cols - 1) * gap;
          const h = p.rows * cellH + (p.rows - 1) * gap;
          const delay = 4 + i * BUILD_STAGGER;

          const cx = x + w / 2 - width / 2;
          const cy = y + h / 2 - height / 2;
          const edges = [
            [cx >= 0 ? 1 : -1, 0],
            [0, cy >= 0 ? 1 : -1],
          ];
          const [ex, ey] = edges[i % 2];
          const dist = 72 * u;
          const jitter = (hash(i) - 0.5) * 24 * u;
          const tilt = (hash(i + 7) > 0.5 ? 1 : -1) * (1.5 + hash(i + 3) * 1.5);

          const move = spring({ frame: frame - delay, fps, config: CARD });
          const lockAt = delay + 12;
          const click = interpolate(
            frame,
            [lockAt, lockAt + 2, lockAt + 7],
            [0, 1, 0],
            CL,
          );
          const tx = (1 - move) * (ex * dist + (ey ? jitter : 0));
          const ty = (1 - move) * (ey * dist + (ex ? jitter : 0));
          const rot = (1 - move) * tilt;
          const sc = interpolate(move, [0, 1], [0.94, 1]) * (1 - 0.012 * click);

          const f = focus[i];
          const lift = 1 + 0.02 * f;
          const dim = 1 - 0.45 * Math.max(0, anyFocus - f);

          const textIn = interpolate(frame, [delay + 4, delay + 16], [0, 1], {
            ...CL,
            easing: ENTER,
          });
          const reveal = spring({
            frame: frame - (delay + 8),
            fps,
            config: MORPH,
            durationInFrames: 30,
          });
          const big = p.rows > 1;
          const wide = p.cols > 1 && !big;
          const visual = tile.visual ?? "none";
          const vp: VisualProps = { pal, accent, reveal, focus: f, frame, u };
          const textW = wide && visual !== "none" ? "46%" : "100%";
          const titleSize = (big ? 24 : 18) * u;

          return (
            <div
              key={`${tile.title}-${i}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: w,
                height: h,
                zIndex: Math.round(f * 10),
                opacity: dim * interpolate(move, [0, 0.45], [0, 1], CL),
                filter:
                  move < 0.99
                    ? `blur(${Math.max(0, 1 - move) * 6}px)`
                    : undefined,
                transform: `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${sc * lift})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 18 * u,
                  overflow: "hidden",
                  background: pal.tile,
                  backdropFilter: "blur(24px) saturate(1.3)",
                  boxShadow: `${pal.edge}${
                    click > 0.01 || f > 0.01
                      ? `, inset 0 0 0 1px ${withAlpha(accent, Math.max(0.4 * click, 0.7 * f))}`
                      : ""
                  }${pal.lift(f)}`,
                }}
              >
                {visual === "chart" ? <ChartVisual {...vp} /> : null}
                {visual === "toggle" ? <ToggleVisual {...vp} /> : null}
                {visual === "code" ? <CodeVisual {...vp} /> : null}
                {visual === "chips" ? (
                  <ChipsVisual {...vp} wide={wide || big} />
                ) : null}
                {visual === "avatars" ? <AvatarsVisual {...vp} /> : null}

                <div
                  style={{
                    position: "absolute",
                    left: 20 * u,
                    bottom: 18 * u,
                    width: textW,
                    paddingRight: 20 * u,
                    boxSizing: "border-box",
                    fontSize: titleSize,
                    lineHeight: 1.3,
                    letterSpacing: "-0.012em",
                    textWrap: "pretty",
                    opacity: textIn,
                    transform: `translateY(${(1 - textIn) * 10 * u}px)`,
                  }}
                >
                  <span style={{ color: pal.text }}>
                    {typeof tile.icon === "string" ? (
                      <Glyph
                        name={tile.icon as BentoIconName}
                        color={pal.text}
                      />
                    ) : (
                      (tile.icon ?? null)
                    )}
                    {tile.title}
                  </span>{" "}
                  <span style={{ color: pal.muted }}>{tile.description}</span>
                </div>
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
