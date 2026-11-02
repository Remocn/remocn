"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import type React from "react";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: GEIST } = loadGeist("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

/** Geist 500 advance widths, ASCII 32–126, per 1000 units (measured from the font). */
const GEIST_ADV = [
  243, 228, 361, 515, 643, 810, 649, 186, 290, 290, 427, 562, 213, 418, 213,
  494, 673, 406, 630, 625, 629, 641, 604, 531, 624, 606, 302, 302, 546, 544,
  546, 570, 925, 689, 688, 713, 701, 609, 595, 713, 716, 280, 607, 656, 583,
  890, 745, 751, 657, 745, 680, 654, 568, 694, 688, 968, 633, 594, 561, 361,
  470, 361, 438, 558, 258, 565, 608, 563, 608, 576, 412, 607, 591, 256, 284,
  609, 282, 885, 591, 588, 608, 608, 394, 537, 410, 586, 560, 829, 607, 553,
  552, 395, 274, 395, 523,
];
const CHIP_TRACKING = -0.01;

function geistWidth(text: string, size: number): number {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += c >= 32 && c < 127 ? GEIST_ADV[c - 32] : 600;
  }
  return (w / 1000 + CHIP_TRACKING * text.length) * size;
}

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

/** Logo width in em (R 0.702 + gap 0.04 + "emocn" at -0.025em), measured from Manrope 600. */
const LOGO_EM = 3.86;

/**
 * Beat sheet (30fps, speed 1):
 * 0–58     seven rows of pills stream left like a river; near rows big, fast
 *          and soft, far rows small, slow and blurred.
 * 58–100   the headliners peel out of the stream (nearest first) and snap
 *          into a tight lozenge around an empty centre; the rest dissolve.
 * 96       the remocn.dev logo lands in the hole: a short, confident hit that
 *          nudges the cluster outward.
 * Graphics: Geist 500 chips; the gradients.sh "beam" palette fills the accent
 * chips and pools softly under the cluster.
 * 100–170  hold, slow push-in.
 */

export type ChipIcon =
  | "captions"
  | "export"
  | "transitions"
  | "palette"
  | "grid"
  | "spring"
  | "wave"
  | "type"
  | "sun"
  | "layers"
  | "cursor"
  | "phone"
  | "camera"
  | "code"
  | "moon"
  | "clock"
  | "terminal"
  | "play"
  | "image"
  | "chart";

export interface FeatureChip {
  label: string;
  icon?: ChipIcon;
  variant?: "neutral" | "accent" | "outline";
}

export interface FeatureChipsFlowProps {
  /** The first ~22 land in the cluster; the rest stream by and dissolve. */
  features?: (string | FeatureChip)[];
  /** "remocn" (default) renders the real remocn.dev logo; anything else is set as type. */
  name?: string;
  /** Shown before a custom `name` (ignored for the built-in logo). */
  logo?: React.ReactNode;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_FEATURES: FeatureChip[] = [
  { label: "Captions", icon: "captions", variant: "accent" },
  { label: "Transitions", icon: "transitions" },
  { label: "4K export", icon: "export", variant: "outline" },
  { label: "Brand kit", icon: "palette" },
  { label: "Templates", icon: "grid" },
  { label: "Springs", icon: "spring", variant: "outline" },
  { label: "Audio sync", icon: "wave" },
  { label: "Kinetic type", icon: "type" },
  { label: "Light leaks", icon: "sun", variant: "outline" },
  { label: "Backgrounds", icon: "layers" },
  { label: "Cursor moves", icon: "cursor" },
  { label: "Vertical video", icon: "phone", variant: "outline" },
  { label: "Camera moves", icon: "camera" },
  { label: "Own your code", icon: "code", variant: "accent" },
  { label: "Dark mode", icon: "moon", variant: "outline" },
  { label: "60 fps", icon: "clock" },
  { label: "shadcn CLI", icon: "terminal" },
  { label: "Remotion Studio", icon: "play", variant: "outline" },
  { label: "Screenshots", icon: "image" },
  { label: "Charts", icon: "chart" },
  { label: "Lower thirds", icon: "captions", variant: "outline" },
  { label: "Logo reveals", icon: "sun" },
  { label: "Transcripts", icon: "type" },
  { label: "Device frames", icon: "phone", variant: "outline" },
  { label: "Countdowns", icon: "clock" },
  { label: "Code blocks", icon: "code" },
  { label: "Grain", icon: "layers", variant: "outline" },
  { label: "Alpha channel", icon: "layers" },
  { label: "Easing curves", icon: "spring" },
  { label: "Social cuts", icon: "phone", variant: "outline" },
  { label: "Chapters", icon: "grid" },
  { label: "MP4 + WebM", icon: "export" },
  { label: "Subtitles", icon: "captions", variant: "outline" },
  { label: "Zoom blur", icon: "camera" },
  { label: "Color themes", icon: "palette" },
  { label: "Typewriter", icon: "type", variant: "outline" },
  { label: "Waveforms", icon: "wave" },
  { label: "Data stories", icon: "chart", variant: "outline" },
  { label: "Previews", icon: "play" },
  { label: "Paper textures", icon: "image" },
  { label: "Loops", icon: "spring", variant: "outline" },
  { label: "Stills", icon: "image" },
];

const ICON_CYCLE: ChipIcon[] = [
  "grid",
  "layers",
  "spring",
  "type",
  "wave",
  "play",
  "code",
];

/** Cluster rows: chips per row, top to bottom; the middle row wraps the name. */
const CLUSTER_ROWS = [4, 5, 4, 5, 4];
const NAME_ROW = 2;

/** Rows of the river: screen position (0–1) and depth (0 far, 1 near). */
const RIVER_DEPTHS = [0.4, 0.78, 0.12, 1, 0.55, 0.22, 0.86];

const CONVERGE = 58;
const HIT = 96;

const OUT = Easing.bezier(0.22, 1, 0.36, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const ICONS: Record<ChipIcon, string> = {
  captions: "M4 6h16v10H4z M7 10h6 M7 13h10",
  export: "M12 4v11 M7.5 8.5L12 4l4.5 4.5 M5 15v4h14v-4",
  transitions: "M4 5h10v10H4z M10 9h10v10H10z",
  palette:
    "M12 4a8 8 0 1 0 0 16c1.5 0 2-1 1.4-2.2-.6-1.2.2-2.3 1.6-2.3H17a3 3 0 0 0 3-3 8 8 0 0 0-8-8.5z M8 11h.01 M11 8h.01 M15 9h.01",
  grid: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  spring: "M3 17c4 0 4-10 9-10s5 10 9 10",
  wave: "M4 10v4 M8 7v10 M12 4v16 M16 8v8 M20 10v4",
  type: "M5 6h14 M12 6v13 M9 19h6",
  sun: "M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z M12 2.5v2 M12 19.5v2 M2.5 12h2 M19.5 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4",
  layers: "M12 4l8 4-8 4-8-4z M4 12l8 4 8-4 M4 16l8 4 8-4",
  cursor: "M5 4l12 6-5.5 1.5L10 17z",
  phone:
    "M8 3h8a1.5 1.5 0 0 1 1.5 1.5v15A1.5 1.5 0 0 1 16 21H8a1.5 1.5 0 0 1-1.5-1.5v-15A1.5 1.5 0 0 1 8 3z M11 18h2",
  camera: "M4 8h3l2-2.5h6L17 8h3v11H4z M12 10.5a3 3 0 1 0 0 6a3 3 0 1 0 0-6z",
  code: "M9 7l-5 5 5 5 M15 7l5 5-5 5",
  moon: "M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z",
  clock: "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16z M12 8v4l3 2",
  terminal: "M4 5h16v14H4z M7.5 9.5l3 2.5-3 2.5 M12.5 15h4",
  play: "M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16z M10.5 9v6l4.5-3z",
  image: "M4 5h16v14H4z M4 16l5-5 4 4 2-2 5 5 M15 9h.01",
  chart: "M4 20h16 M7 16v-4 M11 16V8 M15 16v-6 M19 16V5",
};

const ChipGlyph: React.FC<{ icon: ChipIcon; size: number; color: string }> = ({
  icon,
  size,
  color,
}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path
      d={ICONS[icon]}
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface Placed {
  chip: FeatureChip;
  w: number;
  row: number;
  depth: number;
  rowY: number;
  x0: number;
  period: number;
  v: number;
  target?: { x: number; y: number };
}

export function FeatureChipsFlow({
  features = DEFAULT_FEATURES,
  name = "remocn",
  logo,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: FeatureChipsFlowProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const isLight = theme === "light";
  const isLogo = name.trim().toLowerCase() === "remocn";

  const p = isLight
    ? {
        stage: "#F5F4F0",
        top: "#FCFBF8",
        chip: "#FFFFFF",
        hair: "rgba(20,20,22,0.10)",
        outline: "rgba(20,20,22,0.22)",
        ink: "#141416",
        muted: "rgba(20,20,22,0.62)",
        shadow: "0 1px 2px rgba(40,36,28,0.08), 0 6px 18px rgba(40,36,28,0.06)",
      }
    : {
        stage: "#0A0A0B",
        top: "#141417",
        chip: "#18181B",
        hair: "rgba(255,255,255,0.08)",
        outline: "rgba(255,255,255,0.2)",
        ink: "#EDEDEF",
        muted: "rgba(237,237,239,0.62)",
        shadow: "0 6px 18px rgba(0,0,0,0.35)",
      };

  const chipH = H * 0.06;
  const font = chipH * 0.36;
  const iconSize = chipH * 0.4;
  const padX = chipH * 0.38;
  const gap = chipH * 0.22;

  const chips: FeatureChip[] = useMemo(
    () =>
      features.map((f, i) =>
        typeof f === "string"
          ? {
              label: f,
              icon: ICON_CYCLE[i % ICON_CYCLE.length],
              variant: i % 4 === 2 ? "outline" : "neutral",
            }
          : f,
      ),
    [features],
  );

  const placed = useMemo(() => {
    const rows = RIVER_DEPTHS.length;
    const widthOf = (c: FeatureChip) =>
      padX * 2 + iconSize + gap + geistWidth(c.label, font);
    const list: Placed[] = chips.map((chip, i) => {
      const row = i % rows;
      const depth = RIVER_DEPTHS[row];
      return {
        chip,
        w: widthOf(chip),
        row,
        depth,
        rowY: H * (0.09 + (row / (rows - 1)) * 0.82),
        x0: 0,
        period: 0,
        v: 1.1 + depth * 4.2,
      };
    });
    // Spread each row evenly across a loop a little wider than the frame.
    for (let r = 0; r < rows; r++) {
      const inRow = list.filter((c) => c.row === r);
      const s = 0.62 + RIVER_DEPTHS[r] * 0.55;
      const total = inRow.reduce((sum, c) => sum + c.w * s, 0);
      const period = Math.max(W * 1.3, total + inRow.length * chipH * 0.6);
      let x = hash(r * 3.7) * period;
      for (const c of inRow) {
        c.period = period;
        c.x0 = x + (c.w * s) / 2;
        x += (period / inRow.length) * (0.85 + hash(c.x0) * 0.3);
      }
    }

    // Headliners: the first chips land in the cluster. Order them by where
    // they will be in the river when the converge starts, so rows map to rows.
    const capacity = CLUSTER_ROWS.reduce((a, b) => a + b, 0);
    const heads = list.slice(0, Math.min(capacity, list.length));
    const flowX = (c: Placed, t: number) => {
      const s = 0.62 + c.depth * 0.55;
      const raw = c.x0 - c.v * t;
      const span = c.period;
      return (((raw % span) + span) % span) - (c.w * s) / 2 - span * 0.12;
    };
    const ordered = [...heads].sort(
      (a, b) => a.rowY - b.rowY || flowX(a, CONVERGE) - flowX(b, CONVERGE),
    );
    const nameW = isLogo
      ? H * 0.13 * LOGO_EM
      : geistWidth(name, H * 0.13) * 0.97 + (logo ? H * 0.13 * 0.8 : 0);
    const rowGap = chipH * 1.32;
    let k = 0;
    CLUSTER_ROWS.forEach((count, r) => {
      const members = ordered
        .slice(k, k + count)
        .sort((a, b) => flowX(a, CONVERGE) - flowX(b, CONVERGE));
      k += count;
      const dy =
        (r - NAME_ROW) * rowGap +
        Math.sign(r - NAME_ROW) * chipH * (r === NAME_ROW ? 0 : 0.38);
      const y = H * 0.5 + dy;
      if (r === NAME_ROW) {
        const half = Math.ceil(members.length / 2);
        const left = members.slice(0, half);
        const right = members.slice(half);
        let x = W / 2 - nameW / 2 - gap * 3;
        for (const c of [...left].reverse()) {
          c.target = { x: x - c.w / 2, y };
          x -= c.w + gap * 1.6;
        }
        x = W / 2 + nameW / 2 + gap * 3;
        for (const c of right) {
          c.target = { x: x + c.w / 2, y };
          x += c.w + gap * 1.6;
        }
      } else {
        const total =
          members.reduce((sum, c) => sum + c.w, 0) +
          (members.length - 1) * gap * 1.6;
        let x = W / 2 - total / 2 + (r % 2 ? -chipH * 0.4 : chipH * 0.4);
        for (const c of members) {
          c.target = { x: x + c.w / 2, y };
          x += c.w + gap * 1.6;
        }
      }
    });
    return { list, flowX };
  }, [chips, W, H, chipH, font, iconSize, padX, gap, name, isLogo, logo]);

  // The hit: name lands, the cluster takes a small outward nudge and settles.
  const hitT = frame - HIT;
  const nameIn = interpolate(hitT, [-2, 8], [0, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nameScale = interpolate(hitT, [-2, 10], [1.1, 1], {
    easing: OUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nudge =
    hitT > 0
      ? Math.sin(hitT * 0.42) * Math.exp(-hitT * 0.19) * chipH * 0.16
      : 0;

  // gradients.sh "beam" palette: bg #02030a, [#f4f7ff, #8fb4ff, #3d5bff, #1a1660].
  // It fills the accent chips and pools under the cluster; both drift gently.
  const drift = interpolate(frame, [0, 170], [0, 1], {
    extrapolateRight: "clamp",
  });
  const beamChip = `radial-gradient(90% 160% at ${18 + drift * 10}% -10%, rgba(143,180,255,0.75) 0%, rgba(143,180,255,0) 60%), linear-gradient(${100 + drift * 12}deg, ${accent} 0%, #3d5bff 45%, #1a1660 135%)`;
  const pool = interpolate(frame, [CONVERGE, HIT + 20], [0.55, 1], {
    easing: INOUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ground = isLight
    ? `radial-gradient(62% 52% at ${48 + drift * 4}% 56%, rgba(143,180,255,${(0.34 * pool).toFixed(3)}) 0%, rgba(143,180,255,0) 72%), radial-gradient(110% 85% at 50% 45%, ${p.top} 0%, ${p.stage} 70%)`
    : `radial-gradient(58% 50% at ${48 + drift * 4}% 56%, rgba(61,91,255,${(0.2 * pool).toFixed(3)}) 0%, rgba(26,22,96,${(0.16 * pool).toFixed(3)}) 50%, rgba(2,3,10,0) 78%), radial-gradient(110% 85% at 50% 45%, ${p.top} 0%, ${p.stage} 70%)`;

  const push = interpolate(frame, [CONVERGE, 170], [1, 1.045], {
    easing: INOUT,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stateAt = (c: Placed, i: number, f: number) => {
    const s0 = 0.62 + c.depth * 0.55;
    const fx = placed.flowX(c, f);
    const fy = c.rowY;
    const farBlur = (1 - c.depth) ** 1.6 * 3.2 + (c.depth > 0.95 ? 1.1 : 0);
    const farOp = 0.4 + c.depth * 0.6;
    if (c.target) {
      // Nearest headliners peel off first (distance measured at the cue).
      const cx0 = placed.flowX(c, CONVERGE);
      const d =
        Math.hypot(cx0 - c.target.x, fy - c.target.y) / Math.hypot(W, H);
      const delay = d * 22 + hash(i * 2.1) * 4;
      const pr = spring({
        frame: f - CONVERGE - delay,
        fps,
        config: { damping: 17, stiffness: 120, mass: 0.8 },
      });
      const lin = Math.min(1, Math.max(0, pr));
      const dx = c.target.x - W / 2;
      const dy = c.target.y - H / 2;
      const len = Math.hypot(dx, dy) || 1;
      return {
        x: fx + (c.target.x - fx) * pr + (dx / len) * nudge,
        y: fy + (c.target.y - fy) * pr + (dy / len) * nudge * 0.6,
        scale: s0 + (1 - s0) * lin,
        blur: farBlur * (1 - lin),
        op: farOp + (1 - farOp) * lin,
        z: 200 + Math.round(lin * 100),
      };
    }
    const out = interpolate(
      f,
      [CONVERGE + 4 + hash(i) * 10, CONVERGE + 30 + hash(i) * 10],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: INOUT },
    );
    return {
      x: fx,
      y: fy,
      scale: s0 * (1 + out * 0.08 * (c.depth > 0.5 ? 1 : -1)),
      blur: farBlur + out * 8,
      op: farOp * (1 - out),
      z: Math.round(c.depth * 100),
    };
  };

  const renderChip = (
    c: Placed,
    key: string,
    st: ReturnType<typeof stateAt>,
  ) => {
    const v = c.chip.variant ?? "neutral";
    const isAccent = v === "accent";
    const isOutline = v === "outline";
    const fg = isAccent ? "#FFFFFF" : isOutline ? p.muted : p.ink;
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: c.w,
          height: chipH,
          transform: `translate(${st.x - c.w / 2}px, ${st.y - chipH / 2}px) scale(${st.scale})`,
          zIndex: st.z,
          opacity: st.op,
          filter: st.blur > 0.2 ? `blur(${st.blur.toFixed(2)}px)` : undefined,
          borderRadius: chipH / 2,
          background: isAccent ? beamChip : isOutline ? "transparent" : p.chip,
          boxShadow: isAccent
            ? `inset 0 1px 0 rgba(244,247,255,0.35), inset 0 0 0 1px rgba(244,247,255,0.12), 0 8px 24px rgba(61,91,255,${isLight ? 0.22 : 0.3})`
            : isOutline
              ? `inset 0 0 0 1px ${p.outline}`
              : `inset 0 0 0 1px ${p.hair}, ${p.shadow}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap,
          fontFamily: GEIST,
          fontWeight: 500,
          fontSize: font,
          letterSpacing: `${CHIP_TRACKING}em`,
          color: fg,
          whiteSpace: "nowrap",
        }}
      >
        <ChipGlyph icon={c.chip.icon ?? "grid"} size={iconSize} color={fg} />
        {c.chip.label}
      </div>
    );
  };

  const nodes: React.ReactNode[] = [];
  placed.list.forEach((c, i) => {
    const st = stateAt(c, i, frame);
    if (st.op <= 0.01) return;
    // Fake motion blur: two faint trailing copies while a chip snaps fast.
    if (c.target) {
      const prev = stateAt(c, i, frame - 1);
      const v = Math.hypot(st.x - prev.x, st.y - prev.y);
      if (v > chipH * 0.25) {
        const k = Math.min(1, (v - chipH * 0.25) / (chipH * 0.5));
        [0.45, 0.9].forEach((back, g) => {
          const gs = stateAt(c, i, frame - back);
          nodes.push(
            renderChip(c, `${i}-g${g}`, {
              ...gs,
              op: gs.op * k * (g ? 0.12 : 0.22),
              blur: gs.blur + 1.5,
              z: st.z - 1,
            }),
          );
        });
      }
    }
    nodes.push(renderChip(c, `${i}`, st));
  });

  const nameSize = H * 0.13;

  return (
    <AbsoluteFill
      style={{
        background: ground,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{ transform: `scale(${push})`, transformOrigin: "50% 50%" }}
      >
        {nodes}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: H * 0.5 - nameSize * 0.62,
            height: nameSize * 1.24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: nameSize * 0.2,
            opacity: nameIn,
            transform: `scale(${nameScale})`,
            filter: nameIn < 1 ? `blur(${(1 - nameIn) * 10}px)` : undefined,
            zIndex: 400,
          }}
        >
          {isLogo ? (
            <RemocnLogo fontSize={nameSize} color={p.ink} />
          ) : (
            <>
              {logo}
              <span
                style={{
                  fontFamily: GEIST,
                  fontWeight: 500,
                  fontSize: nameSize,
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                  color: p.ink,
                  paddingBottom: nameSize * 0.06,
                }}
              >
                {name}
              </span>
            </>
          )}
        </div>
      </AbsoluteFill>
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        aria-hidden
      >
        <filter id={`${uid}-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency={0.85}
            numOctaves={2}
            seed={11}
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0"
          />
        </filter>
        <rect
          width={W}
          height={H}
          filter={`url(#${uid}-grain)`}
          opacity={isLight ? 0.05 : 0.06}
          style={{ mixBlendMode: isLight ? "multiply" : "screen" }}
        />
      </svg>
    </AbsoluteFill>
  );
}

/** Frames until the name has landed and the cluster settled. */
export const featureChipsFlowLength = HIT + 24;
