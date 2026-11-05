"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: brico } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

// gradients.sh "aurora" palette
const AURORA = {
  bg: "#03050b",
  c: ["#a0f0c8", "#3fb5a3", "#5147b6", "#b25c9c"],
} as const;

export interface HexFillProps {
  value?: number;
  label?: string;
  rings?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const FILL0 = 14;
const FILL_LEN = 70;
const RING_LAG = 1.2;
const CELL = 0.88;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: AURORA.bg,
    fg: "#F1F3F2",
    muted: "#8A8F99",
    hair: "rgba(255,255,255,0.26)",
    stops: [AURORA.c[0], AURORA.c[1], AURORA.c[2], AURORA.c[3]],
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.24)",
    stops: ["#52c7a4", AURORA.c[1], AURORA.c[2], AURORA.c[3]],
    grain: 0.045,
  },
} as const;

interface Cell {
  q: number;
  r: number;
  x: number;
  y: number;
  ring: number;
  ang: number;
}

function buildCells(rings: number): Cell[] {
  const out: Cell[] = [];
  for (let q = -rings; q <= rings; q++) {
    for (let r = -rings; r <= rings; r++) {
      const s = -q - r;
      const ring = Math.max(Math.abs(q), Math.abs(r), Math.abs(s));
      if (ring > rings) continue;
      const x = Math.sqrt(3) * (q + r / 2);
      const y = 1.5 * r;
      let ang = ring === 0 ? -1 : Math.atan2(x, -y);
      if (ring > 0 && ang < -1e-6) ang += Math.PI * 2;
      out.push({ q, r, x, y, ring, ang: ring === 0 ? 0 : ang / (Math.PI * 2) });
    }
  }
  out.sort((a, b) => a.ang - b.ang || a.ring - b.ring);
  return out;
}

const NB = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, -1],
  [-1, 1],
];

function pickFill(cells: Cell[], F: number) {
  const index = new Map<string, number>();
  cells.forEach((c, i) => {
    index.set(`${c.q},${c.r}`, i);
  });
  const nbs = cells.map((c) =>
    NB.map(([dq, dr]) => index.get(`${c.q + dq},${c.r + dr}`)).filter(
      (v): v is number => v !== undefined,
    ),
  );
  const on = cells.map((_, i) => i < F);
  const score = (i: number) =>
    nbs[i].reduce((sum, j) => sum + (on[j] ? 1 : 0), 0) / nbs[i].length;
  for (let it = 0; it < 40; it++) {
    let worst = -1;
    let best = -1;
    for (let i = 1; i < cells.length; i++) {
      if (on[i] && (worst < 0 || score(i) < score(worst))) worst = i;
      if (!on[i] && (best < 0 || score(i) > score(best))) best = i;
    }
    if (worst < 0 || best < 0 || score(best) - score(worst) < 0.34) break;
    on[worst] = false;
    on[best] = true;
  }
  const chosen = cells.filter((_, i) => on[i]);
  const rest = cells.filter((_, i) => !on[i]);
  return [...chosen, ...rest];
}

function hexPath(cx: number, cy: number, r: number) {
  let d = "";
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  }
  return `${d}Z`;
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
          seed={53}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function HexFill({
  value = 86,
  label = "of renders served from cache",
  rings = 7,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: HexFillProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, fps } = useVideoConfig();
  const u = Math.min(width / 1280, height / 720);
  const p = THEMES[theme];
  const N = Math.max(3, Math.min(10, Math.round(rings)));
  const pct = Math.max(0, Math.min(100, value));
  const all = useMemo(() => buildCells(N), [N]);
  const F = Math.round((pct / 100) * all.length);
  const cells = useMemo(() => pickFill(all, F), [all, F]);

  const heroSize = 168 * u;
  const pctSize = heroSize * 0.55;
  const labelSize = 24 * u;
  const digits = String(Math.round(pct)).length;
  const heroW = digits * 0.6 * heroSize + 0.62 * pctSize;
  const labelMax = 300 * u;
  const labelW = Math.min(labelMax, label.length * 0.5 * labelSize) + 22 * u;
  const textW = Math.max(heroW, labelW);
  const gap = 80 * u;

  const gridH = 3 * N + 2;
  const gridWUnits = (2 * N + 1) * Math.sqrt(3);
  const s = Math.min(
    (height * 0.74) / gridH,
    (width * 0.86 - gap - textW) / gridWUnits,
  );
  const gridW = gridWUnits * s;
  const left = (width - (gridW + gap + textW)) / 2;
  const gcx = left + gridW / 2;
  const gcy = height / 2;
  const textX = left + gridW + gap;

  const angMax = F > 0 ? cells[F - 1].ang : 1;
  const fillAt = (i: number) => {
    const k = Math.min(1, cells[i].ang / Math.max(1e-3, angMax));
    return (
      FILL0 +
      (FILL_LEN * Math.acos(1 - 2 * k)) / Math.PI +
      cells[i].ring * RING_LAG
    );
  };
  let fillEnd = FILL0;
  let filled = 0;
  for (let i = 0; i < F; i++) {
    const at = fillAt(i);
    fillEnd = Math.max(fillEnd, at);
    if (t >= at) filled++;
  }
  const shown = F > 0 ? Math.round((pct * filled) / F) : 0;

  const push = interpolate(t, [0, fillEnd + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const camScale = 0.985 + 0.025 * push;
  const textIn = interpolate(t, [4, 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const labelIn = interpolate(t, [10, 28], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const done = interpolate(t, [fillEnd + 2, fillEnd + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const hexR = s * CELL;
  const gradId = `hf${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const gR = (gridH * s) / 2;
  const drift = interpolate(t, [0, fillEnd + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const sw = Math.max(1, 1.1 * u);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `scale(${camScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        <svg
          width={width}
          height={height}
          style={{ position: "absolute", inset: 0 }}
          aria-hidden
        >
          <defs>
            <linearGradient
              id={gradId}
              gradientUnits="userSpaceOnUse"
              x1={gcx - gR * (0.9 - 0.15 * drift)}
              y1={gcy - gR}
              x2={gcx + gR * (0.9 + 0.15 * drift)}
              y2={gcy + gR}
            >
              <stop offset="0" stopColor={p.stops[0]} />
              <stop offset="0.36" stopColor={p.stops[1]} />
              <stop offset="0.74" stopColor={p.stops[2]} />
              <stop offset="1" stopColor={p.stops[3]} />
            </linearGradient>
          </defs>
          {cells.map((c, i) => {
            const x = gcx + c.x * s;
            const y = gcy + c.y * s;
            const ringIn = interpolate(
              t,
              [c.ring * 1.4, c.ring * 1.4 + 10],
              [0, 1],
              {
                ...CLAMP,
                easing: EASE_OUT,
              },
            );
            const isFill = i < F;
            const local = isFill ? t - fillAt(i) : -1;
            const pop =
              local >= 0
                ? spring({
                    frame: local,
                    fps,
                    config: { damping: 13, stiffness: 240, mass: 0.6 },
                  })
                : 0;
            const outlineA = isFill ? ringIn : ringIn * (1 - 0.2 * done);
            return (
              <g key={`${c.x.toFixed(2)}_${c.y.toFixed(2)}`}>
                <path
                  d={hexPath(x, y, hexR * (0.94 + 0.06 * ringIn))}
                  fill="none"
                  stroke={p.hair}
                  strokeWidth={sw}
                  opacity={
                    local >= 0
                      ? outlineA * (1 - Math.min(1, local / 4))
                      : outlineA
                  }
                />
                {local >= 0 ? (
                  <path
                    d={hexPath(x, y, hexR * (0.55 + 0.45 * pop))}
                    fill={`url(#${gradId})`}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>

        <div
          style={{
            position: "absolute",
            left: textX,
            top: gcy,
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 18 * u,
          }}
        >
          <div
            style={{
              fontFamily: brico,
              fontWeight: 300,
              fontSize: heroSize,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              color: p.fg,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              opacity: textIn,
              transform: `translateY(${(1 - textIn) * 14 * u}px)`,
            }}
          >
            {shown}
            <span
              style={{
                fontSize: pctSize,
                letterSpacing: "-0.02em",
                marginLeft: 6 * u,
                color: p.muted,
              }}
            >
              %
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12 * u,
              marginLeft: 6 * u,
              maxWidth: labelMax + 22 * u,
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
                marginTop: labelSize * 0.42,
              }}
            />
            <span
              style={{
                fontFamily: brico,
                fontWeight: 400,
                fontSize: labelSize,
                lineHeight: 1.3,
                letterSpacing: "-0.01em",
                color: p.muted,
                textWrap: "balance",
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
