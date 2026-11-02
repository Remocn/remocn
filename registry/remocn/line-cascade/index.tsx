"use client";

import { loadFont } from "@remotion/google-fonts/HankenGrotesk";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", { weights: ["600"], subsets: ["latin"] });

// gradients.sh "fluted" palette: the landed lines are the flutes, and the
// pile fills from deep blue at the floor to warm cream at the top.
const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"] as const;

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** remocn.dev logo, inline in running text: R mark on the baseline + "emocn". */
function RemocnLogo({ color }: { color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        color,
        fontFamily: manrope.fontFamily,
        fontWeight: 600,
        letterSpacing: "-0.025em",
      }}
    >
      <svg
        viewBox="0 0 124.06 134.26"
        style={{ height: "0.76em", width: "auto", alignSelf: "baseline" }}
        aria-hidden
      >
        <path fill="currentColor" d={REMOCN_R_PATH} />
      </svg>
      <span style={{ marginLeft: "0.04em" }}>emocn</span>
    </span>
  );
}

export interface LineCascadeProps {
  value?: string;
  caption?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);

const FLOOR_AT = 2;
const FLOOR_END = 20;
const RAIN_AT = 10;
const RAIN_SPAN = 78;
const SNAP_AT = 102;
const SNAP_END = 111;
const CAPTION_AT = 108;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    rain: 0.5,
    pile: 0.88,
    floor: "rgba(255,255,255,0.16)",
    grain: 0.055,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    rain: 0.42,
    pile: 0.86,
    floor: "rgba(18,18,20,0.16)",
    grain: 0.04,
  },
} as const;

type Pt = [number, number];
type Glyph = { advance: number; strokes: Pt[][] };
type Seg = [number, number, number, number];

const STROKE = 0.165;
const R = STROKE / 2;
const DW = 0.64;
const TRACK = 0.1;
const CX = DW / 2;
const X0 = R;
const X1 = DW - R;
const Y0 = R;
const Y1 = 1 - R;

function arc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  n = 40,
): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}

const JUNCTION = 0.46;
const TOP_BOWL = { cy: (Y0 + JUNCTION) / 2, ry: (JUNCTION - Y0) / 2, rx: 0.2 };
const LOW_BOWL = {
  cy: (JUNCTION + Y1) / 2,
  ry: (Y1 - JUNCTION) / 2,
  rx: CX - R,
};
const BOWL = { cy: 0.655, ry: Y1 - 0.655, rx: CX - R };

const GLYPHS: Record<string, Glyph> = {
  "0": { advance: DW, strokes: [arc(CX, 0.5, CX - R, 0.5 - R, 0, 360, 64)] },
  "1": {
    advance: DW,
    strokes: [
      [
        [0.13, 0.25],
        [0.4, Y0],
        [0.4, Y1],
      ],
    ],
  },
  "2": {
    advance: DW,
    strokes: [
      [...arc(CX, 0.3, CX - R, 0.3 - R, 182, 395), [X0, Y1], [X1 + 0.01, Y1]],
    ],
  },
  "3": {
    advance: DW,
    strokes: [
      arc(CX - 0.01, TOP_BOWL.cy, TOP_BOWL.rx, TOP_BOWL.ry, 200, 450),
      arc(CX, LOW_BOWL.cy, LOW_BOWL.rx, LOW_BOWL.ry, 270, 520),
    ],
  },
  "4": {
    advance: DW,
    strokes: [
      [
        [0.49, Y1],
        [0.49, Y0],
        [X0, 0.71],
        [X1 + 0.03, 0.71],
      ],
    ],
  },
  "5": {
    advance: DW,
    strokes: [
      [
        [X1, Y0],
        [0.15, Y0],
        [0.12, 0.5],
      ],
      arc(CX, BOWL.cy, BOWL.rx, BOWL.ry, 208, 512),
    ],
  },
  "6": {
    advance: DW,
    strokes: [
      arc(CX, BOWL.cy, BOWL.rx, BOWL.ry, 0, 360, 56),
      [
        [0.48, Y0],
        [0.13, 0.6],
      ],
    ],
  },
  "7": {
    advance: DW,
    strokes: [
      [
        [X0, Y0],
        [X1, Y0],
        [0.23, Y1],
      ],
    ],
  },
  "8": {
    advance: DW,
    strokes: [
      arc(CX, TOP_BOWL.cy, TOP_BOWL.rx, TOP_BOWL.ry, 0, 360, 48),
      arc(CX, LOW_BOWL.cy, LOW_BOWL.rx, LOW_BOWL.ry, 0, 360, 48),
    ],
  },
  "9": {
    advance: DW,
    strokes: [
      arc(CX, 1 - BOWL.cy, BOWL.rx, BOWL.ry, 0, 360, 56),
      [
        [0.5, 0.4],
        [0.15, Y1],
      ],
    ],
  },
  ".": {
    advance: 0.27,
    strokes: [
      [
        [0.13, Y1],
        [0.13, Y1],
      ],
    ],
  },
  "+": {
    advance: DW,
    strokes: [
      [
        [0.07, 0.56],
        [0.57, 0.56],
      ],
      [
        [CX, 0.31],
        [CX, 0.81],
      ],
    ],
  },
  "%": {
    advance: 0.88,
    strokes: [
      arc(0.2, 0.24, 0.1, 0.13, 0, 360, 28),
      arc(0.68, 0.76, 0.1, 0.13, 0, 360, 28),
      [
        [0.7, Y0],
        [0.18, Y1],
      ],
    ],
  },
  k: {
    advance: 0.6,
    strokes: [
      [
        [X0, Y0],
        [X0, Y1],
      ],
      [
        [0.5, 0.4],
        [X0, 0.74],
      ],
      [
        [0.24, 0.6],
        [0.5, Y1],
      ],
    ],
  },
  " ": { advance: 0.3, strokes: [] },
};
GLYPHS.K = GLYPHS.k;

function layoutGlyphs(value: string) {
  const strokes: Pt[][] = [];
  const segs: Seg[] = [];
  let x = 0;
  const chars = Array.from(value);
  chars.forEach((ch, i) => {
    const g = GLYPHS[ch] ?? { advance: 0.4, strokes: [] };
    for (const s of g.strokes) {
      const moved = s.map(([px, py]) => [px + x, py] as Pt);
      strokes.push(moved);
      for (let k = 0; k < Math.max(1, moved.length - 1); k++) {
        const a = moved[k];
        const b = moved[Math.min(k + 1, moved.length - 1)];
        segs.push([a[0], a[1], b[0], b[1]]);
      }
    }
    x += g.advance + (i < chars.length - 1 ? TRACK : 0);
  });
  return { strokes, segs, width: x };
}

function segDist(px: number, py: number, s: Seg) {
  const [ax, ay, bx, by] = s;
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  const t =
    l2 === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / l2));
  const qx = ax + dx * t - px;
  const qy = ay + dy * t - py;
  return Math.sqrt(qx * qx + qy * qy);
}

function hash(n: number) {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

type Slot = {
  x: number;
  top: number;
  bottom: number;
  land: number;
  fall: number;
};

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
          seed={11}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function LineCascade({
  value = "240",
  caption = "launch films rendered with remocn today",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: LineCascadeProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const stage = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const maskId = `m${uid}`;
  const fluteId = `f${uid}`;
  const fluteGlyphId = `fg${uid}`;
  const isDark = theme === "dark";
  const flute: Array<[number, string]> = isDark
    ? [
        [0, FLUTED[3]],
        [0.3, FLUTED[2]],
        [0.66, accent],
        [1, FLUTED[0]],
      ]
    : [
        [0, FLUTED[2]],
        [0.6, accent],
        [1, FLUTED[0]],
      ];

  const layout = useMemo(() => layoutGlyphs(value), [value]);
  const capSize = 24 * u;
  const gapBelow = 34 * u;
  const glyphH = Math.min(0.5 * H, (0.74 * W) / Math.max(layout.width, 0.5));
  const glyphW = layout.width * glyphH;
  const blockH = glyphH + (caption ? gapBelow + capSize * 1.3 : 0);
  const gx = (W - glyphW) / 2;
  const gy = (H - blockH) / 2 + 4 * u;
  const floorY = gy + glyphH;

  const pitch = 6.5 * u;
  const slotH = 13 * u;
  const hair = Math.max(1.5, 1.6 * u);
  const gapY = 3 * u;
  const lineLen = slotH - gapY;
  const fallSpeed = 0.072 * H;

  const slots = useMemo(() => {
    const out: Slot[] = [];
    const cols = Math.floor(glyphW / pitch);
    const offset = (glyphW - cols * pitch) / 2;
    const step = 1.5 * u;
    for (let c = 0; c < cols; c++) {
      const x = gx + offset + (c + 0.5) * pitch;
      const ux = (x - gx) / glyphH;
      const intervals: Array<[number, number]> = [];
      let start = -1;
      for (let y = gy - R * glyphH; y <= floorY + R * glyphH; y += step) {
        const uy = (y - gy) / glyphH;
        let inside = false;
        for (const s of layout.segs) {
          if (segDist(ux, uy, s) <= R) {
            inside = true;
            break;
          }
        }
        if (inside && start < 0) start = y;
        if (!inside && start >= 0) {
          intervals.push([start, y - step]);
          start = -1;
        }
      }
      if (start >= 0) intervals.push([start, floorY]);
      const colRate = 0.88 + 0.24 * hash(c * 3.1 + 7);
      const colLag = 5 * hash(c * 1.7 + 2);
      intervals.forEach(([a, b], iv) => {
        let bottom = b;
        let j = 0;
        while (bottom - a > 0.45 * slotH) {
          const top = Math.max(a, bottom - slotH);
          const level = (floorY - bottom) / glyphH;
          const jitter = 4 * hash(c * 91.7 + iv * 13.1 + j * 5.3);
          const land = Math.min(
            SNAP_AT - 5,
            RAIN_AT + 12 + level * RAIN_SPAN * colRate + colLag + jitter,
          );
          const target = bottom - gapY / 2;
          const fall = (target + lineLen * 3) / fallSpeed;
          out.push({ x, top: top + gapY / 2, bottom: target, land, fall });
          bottom = top;
          j++;
        }
      });
    }
    return out;
  }, [
    layout,
    gx,
    gy,
    glyphW,
    glyphH,
    floorY,
    pitch,
    slotH,
    gapY,
    lineLen,
    u,
    fallSpeed,
  ]);

  const floorDraw = EASE_IO(
    interpolate(t, [FLOOR_AT, FLOOR_END], [0, 1], CLAMP),
  );
  const floorFade = interpolate(t, [SNAP_AT, SNAP_END + 6], [1, 0], CLAMP);
  const snap = EASE_OUT(interpolate(t, [SNAP_AT, SNAP_END], [0, 1], CLAMP));
  const solid = EASE_IO(
    interpolate(t, [SNAP_AT + 2, SNAP_END - 1], [0, 1], CLAMP),
  );
  const pileOut = interpolate(t, [SNAP_END - 3, SNAP_END + 1], [1, 0], CLAMP);
  const pileOpacity = stage.pile + (1 - stage.pile) * snap;
  const lineW = hair + (pitch + 0.6 * u - hair) * snap;
  const growY = gapY * snap;
  const capIn = EASE_OUT(
    interpolate(t, [CAPTION_AT, CAPTION_AT + 16], [0, 1], CLAMP),
  );

  const falling: React.ReactNode[] = [];
  const landed: React.ReactNode[] = [];
  slots.forEach((s, i) => {
    if (t >= s.land) {
      landed.push(
        <rect
          key={i}
          x={s.x - lineW / 2}
          y={s.top - growY / 2}
          width={lineW}
          height={s.bottom - s.top + growY}
        />,
      );
      return;
    }
    const startT = s.land - s.fall;
    if (t < startT) return;
    const p = (t - startT) / s.fall;
    const head = -lineLen * 3 + p * (s.bottom + lineLen * 3);
    const streak = lineLen * (1 + 1.6 * Math.min(1, (1 - p) * 4));
    falling.push(
      <rect
        key={i}
        x={s.x - hair / 2}
        y={head - streak}
        width={hair}
        height={streak}
      />,
    );
  });

  return (
    <AbsoluteFill style={{ background: stage.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={fluteId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            x2={0}
            y1={gy - R * glyphH}
            y2={floorY + R * glyphH}
          >
            {flute.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
          <linearGradient
            id={fluteGlyphId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            x2={0}
            y1={-R}
            y2={1 + R}
          >
            {flute.map(([o, c]) => (
              <stop key={o} offset={o} stopColor={c} />
            ))}
          </linearGradient>
          <mask
            id={maskId}
            maskUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={W}
            height={H}
          >
            <g
              transform={`translate(${gx} ${gy}) scale(${glyphH})`}
              fill="none"
              stroke="#fff"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {layout.strokes.map((s, i) => (
                <path
                  key={i}
                  d={`M${s.map((p) => `${p[0]} ${p[1]}`).join("L")}`}
                />
              ))}
            </g>
          </mask>
        </defs>
        <rect
          x={gx - 0.04 * W}
          y={floorY + 8 * u}
          width={(glyphW + 0.08 * W) * floorDraw}
          height={Math.max(1, u)}
          fill={stage.floor}
          opacity={floorFade}
        />
        <g fill={stage.fg} opacity={stage.rain * (1 - snap)}>
          {falling}
        </g>
        <g
          transform={`translate(${gx} ${gy}) scale(${glyphH})`}
          fill="none"
          stroke={`url(#${fluteGlyphId})`}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={solid}
        >
          {layout.strokes.map((s, i) => (
            <path key={i} d={`M${s.map((p) => `${p[0]} ${p[1]}`).join("L")}`} />
          ))}
        </g>
        <g
          mask={`url(#${maskId})`}
          fill={`url(#${fluteId})`}
          opacity={pileOpacity * pileOut}
        >
          {landed}
        </g>
      </svg>
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: floorY + gapBelow + (1 - capIn) * 10 * u,
            textAlign: "center",
            fontFamily: sans,
            fontWeight: 400,
            fontSize: capSize,
            letterSpacing: "-0.005em",
            lineHeight: 1.3,
            color: stage.muted,
            opacity: capIn,
          }}
        >
          {caption
            .split(/(remocn)/i)
            .map((part, i) =>
              /^remocn$/i.test(part) ? (
                <RemocnLogo key={i} color={stage.fg} />
              ) : (
                part
              ),
            )}
        </div>
      ) : null}
      <Grain opacity={stage.grain} />
    </AbsoluteFill>
  );
}
