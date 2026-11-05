"use client";

import { loadFont } from "@remotion/google-fonts/Sora";
import { type CSSProperties, type ReactNode, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sora } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

// gradients.sh "beam" palette
const BEAM = {
  bg: "#02030a",
  c: ["#f4f7ff", "#8fb4ff", "#3d5bff", "#1a1660"],
} as const;

export interface CellDivideProps {
  generations?: number;
  label?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const RAYS = 96;
const R_RATIO = 0.4;
const SQ2 = Math.SQRT2;
const START = 14;
const MOTION = [17, 15, 14, 13, 12, 12, 12];
const PAUSE = 4;
const SWITCH_AT = 0.74;
const ROLL = 9;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_DIV = Easing.bezier(0.42, 0, 0.45, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: BEAM.bg,
    fg: "#F3F2EF",
    muted: "#8E90A0",
    stops: [BEAM.c[0], BEAM.c[1], BEAM.c[2], "#2a35a8"],
    glow: 0.2,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    stops: [BEAM.c[1], "#6f8dff", BEAM.c[2], BEAM.c[3]],
    glow: 0,
    grain: 0.045,
  },
} as const;

function gridOf(g: number) {
  return { cols: 2 ** Math.ceil(g / 2), rows: 2 ** Math.floor(g / 2) };
}

function schedule(G: number) {
  let t = START;
  const divs: { start: number; dur: number }[] = [];
  for (let g = 0; g < G; g++) {
    const dur = MOTION[Math.min(g, MOTION.length - 1)];
    divs.push({ start: t, dur });
    t += dur + PAUSE;
  }
  return { divs, end: t - PAUSE };
}

function smin(a: number, b: number, k: number) {
  if (k <= 1e-6) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - (h * h * k) / 4;
}

function lobe(
  mx: number,
  my: number,
  ex: number,
  ey: number,
  sep: number,
  rho: number,
  k: number,
) {
  const half = sep / 2;
  const fx = -ey;
  const fy = ex;
  const sdf = (u: number, v: number) =>
    smin(Math.hypot(u - half, v) - rho, Math.hypot(u + half, v) - rho, k);
  const reach = rho + k / 4;
  const pinched = half >= reach;
  const neckH = pinched ? 0 : Math.sqrt(reach * reach - half * half);
  const angles: { a: number; neck: number }[] = [];
  for (let i = 0; i < RAYS; i++)
    angles.push({ a: (i / RAYS) * Math.PI * 2, neck: 0 });
  if (!pinched) {
    const n1 = Math.atan2(neckH, -half);
    const n2 = Math.atan2(-neckH, -half) + Math.PI * 2;
    angles.push({ a: n1, neck: 1 }, { a: n2, neck: -1 });
    angles.sort((p, q) => p.a - q.a);
  }
  const rMax = 2 * rho + k + sep;
  const step = Math.max(rho / 14, 0.4);
  const pts: string[] = [];
  for (const { a, neck } of angles) {
    let u: number;
    let v: number;
    if (neck !== 0) {
      u = 0;
      v = neck * neckH;
    } else {
      const c = Math.cos(a);
      const s = Math.sin(a);
      const rEnd = c < -1e-9 ? Math.min(rMax, half / -c) : rMax;
      let lo = 0;
      let hi = -1;
      for (let r = step; r < rEnd; r += step) {
        if (sdf(half + r * c, r * s) > 0) {
          hi = r;
          break;
        }
        lo = r;
      }
      if (hi < 0 && sdf(half + rEnd * c, rEnd * s) > 0) hi = rEnd;
      let r = rEnd;
      if (hi >= 0) {
        for (let it = 0; it < 12; it++) {
          const mid = (lo + hi) / 2;
          if (sdf(half + mid * c, mid * s) > 0) hi = mid;
          else lo = mid;
        }
        r = (lo + hi) / 2;
      }
      u = half + r * c;
      v = r * s;
    }
    const x = mx + ex * u + fx * v;
    const y = my + ey * u + fy * v;
    pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
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
          seed={41}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function CellDivide({
  generations = 6,
  label = "×2 every week",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: CellDivideProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const G = Math.max(2, Math.min(7, Math.round(generations)));
  const { divs, end } = schedule(G);

  const heroSize = 176 * u;
  const labelSize = 24 * u;
  const finalCount = 2 ** G;
  const heroW = String(finalCount).length * 0.6 * heroSize;
  const labelW = label.length * 0.56 * labelSize + 24 * u;
  const textW = Math.max(heroW, labelW);
  const gap = 72 * u;
  const f = G % 2 === 0 ? 1 : SQ2;
  const E = Math.min(
    height * 0.6,
    (0.44 * width - (gap + textW) / 2) / (SQ2 - f / 2),
    (0.88 * width - gap - textW) / f,
  );
  const slotRight = width / 2 - (f * E + gap + textW) / 2 + f * E;
  const cy = height / 2;

  const pitchOf = (g: number) => E / 2 ** (g / 2);
  const posOf = (g: number, c: number, r: number) => {
    const { cols, rows } = gridOf(g);
    const pitch = pitchOf(g);
    const cx = slotRight - (cols * pitch) / 2;
    return {
      x: cx + (c - (cols - 1) / 2) * pitch,
      y: cy + (r - (rows - 1) / 2) * pitch,
    };
  };

  let gen = 0;
  let active = -1;
  let s = 0;
  for (let g = 0; g < divs.length; g++) {
    const d = divs[g];
    if (t >= d.start + d.dur) gen = g + 1;
    else if (t >= d.start) {
      active = g;
      s = (t - d.start) / d.dur;
      break;
    }
  }

  const intro = interpolate(t, [0, 16], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const push = interpolate(t, [0, end + 30], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camScale = 0.985 + 0.03 * push;

  const gradId = `cd${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const colW = f * E;
  const colCx = slotRight - colW / 2;
  const gradCx = colCx - colW * (0.34 - 0.1 * push);
  const gradCy = cy - E * (0.42 - 0.06 * push);
  const gradR = Math.hypot(colW, E) * 0.98;
  const cellFill = `url(#${gradId})`;

  const shapes: ReactNode[] = [];
  if (active >= 0) {
    const g = active;
    const { cols, rows } = gridOf(g);
    const horiz = g % 2 === 0;
    const pitchP = pitchOf(g);
    const pitchC = pitchOf(g + 1);
    const e = interpolate(EASE_DIV(s), [0, 0.3, 0.78, 1], [0, 0.44, 0.86, 1]);
    const k0 = 0.55 * R_RATIO * pitchP;
    const k = k0 * (1 - e);
    const rho0 = R_RATIO * pitchP - k0 / 4;
    const rho1 = R_RATIO * pitchC;
    const rho = rho0 + (rho1 - rho0) * Math.min(1, e / 0.7);
    const sep = pitchC * e;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const P = posOf(g, c, r);
        const d1 = horiz ? posOf(g + 1, 2 * c, r) : posOf(g + 1, c, 2 * r);
        const d2 = horiz
          ? posOf(g + 1, 2 * c + 1, r)
          : posOf(g + 1, c, 2 * r + 1);
        const mx = P.x + ((d1.x + d2.x) / 2 - P.x) * e;
        const my = P.y + ((d1.y + d2.y) / 2 - P.y) * e;
        const ex = horiz ? 1 : 0;
        const ey = horiz ? 0 : 1;
        const d =
          lobe(mx, my, ex, ey, sep, rho, k) +
          lobe(mx, my, -ex, -ey, sep, rho, k);
        shapes.push(<path key={`${c}-${r}`} d={d} fill={cellFill} />);
      }
    }
  } else {
    const { cols, rows } = gridOf(gen);
    const rad = R_RATIO * pitchOf(gen);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const P = posOf(gen, c, r);
        const wave =
          gen === G
            ? Math.sin(
                Math.PI *
                  interpolate(
                    t,
                    [end + 2 + (c + r) * 0.6, end + 11 + (c + r) * 0.6],
                    [0, 1],
                    CLAMP,
                  ),
              )
            : 0;
        const introScale = gen === 0 ? 0.86 + 0.14 * intro : 1;
        shapes.push(
          <circle
            key={`${c}-${r}`}
            cx={P.x}
            cy={P.y}
            r={rad * introScale * (1 + 0.07 * wave)}
            fill={cellFill}
          />,
        );
      }
    }
  }

  const switches = divs.map((d) => d.start + d.dur * SWITCH_AT);
  let shown = 0;
  for (let i = 0; i < switches.length; i++) if (t >= switches[i]) shown = i + 1;
  const rollK =
    shown > 0
      ? interpolate(
          t,
          [switches[shown - 1], switches[shown - 1] + ROLL],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_OUT,
          },
        )
      : 1;
  const cur = 2 ** shown;
  const prev = shown > 0 ? 2 ** (shown - 1) : cur;
  const rolling = rollK < 1;

  const textIn = interpolate(t, [6, 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelIn = interpolate(t, [12, 30], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lineH = heroSize * 0.98;
  const numStyle: CSSProperties = {
    fontFamily: sora,
    fontWeight: 300,
    fontSize: heroSize,
    lineHeight: `${lineH}px`,
    height: lineH,
    letterSpacing: "-0.05em",
    color: p.fg,
    fontVariantNumeric: "tabular-nums",
    whiteSpace: "nowrap",
  };

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(${colW * 0.95}px ${E * 0.95}px at ${colCx}px ${cy}px, color-mix(in oklab, ${BEAM.c[2]} ${p.glow * 100}%, transparent) 0%, transparent 100%)`,
          opacity: intro,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `scale(${camScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0, opacity: intro }}
          aria-hidden
        >
          <defs>
            <radialGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              cx={gradCx}
              cy={gradCy}
              r={gradR}
            >
              <stop offset="0" stopColor={p.stops[0]} />
              <stop offset="0.3" stopColor={p.stops[1]} />
              <stop offset="0.66" stopColor={p.stops[2]} />
              <stop offset="1" stopColor={p.stops[3]} />
            </radialGradient>
          </defs>
          {shapes}
        </svg>

        <div
          style={{
            position: "absolute",
            left: slotRight + gap,
            top: cy,
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 16 * u,
          }}
        >
          <div
            style={{
              position: "relative",
              height: lineH,
              overflow: "hidden",
              opacity: textIn,
              transform: `translateY(${(1 - textIn) * 14 * u}px)`,
            }}
          >
            <div
              style={{
                ...numStyle,
                transform: `translateY(${rolling ? (1 - rollK) * lineH : 0}px)`,
              }}
            >
              {cur}
            </div>
            {rolling ? (
              <div
                style={{
                  ...numStyle,
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translateY(${-rollK * lineH}px)`,
                }}
              >
                {prev}
              </div>
            ) : null}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12 * u,
              marginLeft: 6 * u,
              opacity: labelIn,
              transform: `translateY(${(1 - labelIn) * 8 * u}px)`,
            }}
          >
            <span
              style={{
                width: 10 * u,
                height: 10 * u,
                borderRadius: "50%",
                background: accent,
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontFamily: sora,
                fontWeight: 400,
                fontSize: labelSize,
                letterSpacing: "-0.015em",
                color: p.muted,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 64%, ${p.bg} 100%)`,
          opacity: 0.5,
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
