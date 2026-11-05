"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface ChevronRunProps {
  /** The figure that lands under the giant chevron. */
  value?: string;
  /** Serif italic line under the figure. */
  caption?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// Beat sheet (30fps, speed 1):
//   0–50   a full-frame wall of up-chevrons races upward in staggered
//          columns, speeding up until it smears
//  48–74   column by column, from the centre out, three chevrons per column
//          brake and lock into the giant chevron's band (taking its gradient)
//          while the rest of the wall flies off
//  72–86   the locked pieces fuse into one solid gradient chevron
//  86–104  the figure drops into the cut-out under it, the caption follows
// 104–     poster holds
const LOCK_AT = 48;
const LOCK_LEN = 14;
const FUSE_AT = 74;
const LAND_AT = 84;

const COLS = 13;
const ROWS = 15;
const BAND_ROWS = 3;

// Every chevron (small and giant) shares this slope (dy/dx of an arm).
const SLOPE = 0.4;

// gradients.sh "fluted" (bg #050507): #1d2a8f #2f7bff #ff7a3d #ffe2c4,
// warm at the apex, deep blue down the arms.
const FLUTED = ["#FFE2C4", "#FF7A3D", "#2F7BFF", "#1D2A8F"];
const FLUTED_STOPS = [0, 0.3, 0.68, 1];

const THEMES = {
  dark: {
    bg: "#08080A",
    fg: "#F4F3F0",
    muted: "#9A99A0",
    wall: 0.42,
    fluted: FLUTED,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C68",
    wall: 0.5,
    // the cream apex would melt into the paper; start a step warmer
    fluted: ["#FFA05E", "#FF7A3D", "#2F7BFF", "#1D2A8F"],
  },
} as const;

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** Chevron "^" band: apex at (x, y), half-width a, vertical thickness th. */
const chevronPath = (x: number, y: number, a: number, th: number) => {
  const h = a * SLOPE;
  return `M ${x} ${y} L ${x + a} ${y + h} L ${x + a} ${y + h + th} L ${x} ${y + th} L ${x - a} ${y + h + th} L ${x - a} ${y + h} Z`;
};

export function ChevronRun({
  value = "+312%",
  caption = "growth since launch",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: ChevronRunProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const p = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  // ---- the giant chevron ---------------------------------------------------
  const cx = W / 2;
  const apexY = H * 0.07;
  const T = H * 0.24;
  const outerY = (x: number) => apexY + Math.abs(x - cx) * SLOPE;
  const innerApexY = apexY + T;
  const giantA = W * 0.75;
  const gradY0 = apexY;
  const gradY1 = apexY + (W / 2) * SLOPE + T;
  const gradAt = (y: number) =>
    interpolateColors(
      Math.max(0, Math.min(1, (y - gradY0) / (gradY1 - gradY0))),
      FLUTED_STOPS,
      p.fluted,
    );

  // ---- the wall --------------------------------------------------------------
  const colStep = W / (COLS - 1);
  const rowStep = H * 0.078;
  const L = ROWS * rowStep;
  const a = colStep * 0.41;
  const th = H * 0.025;
  // distance travelled by the wall: a speed ramp, capped once the lock is done
  const travel = (tt: number) => {
    const x = Math.max(0, tt);
    return (3.2 * x + 0.3 * x * x) * u;
  };
  const vel = (tt: number) => (travel(tt + 0.5) - travel(tt - 0.5)) / u;
  const lockStart = (c: number) => LOCK_AT + Math.abs(c - (COLS - 1) / 2) * 1.3;
  const fuse = interpolate(t, [FUSE_AT, FUSE_AT + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const blurBase = Math.min(9 * u, vel(Math.min(t, LOCK_AT + 10)) * 0.28 * u);

  const streamY = (c: number, k: number, tt: number) => {
    const mult = 0.86 + 0.28 * hash(c * 7.3);
    const phase = hash(c * 3.1 + 1) * rowStep + (c % 2) * rowStep * 0.5;
    const y0 = k * rowStep + phase;
    const y = (((y0 - travel(tt) * mult) % L) + L) % L;
    return y - rowStep * 1.2;
  };

  const runners: React.ReactNode[] = [];
  const lockers: React.ReactNode[] = [];
  for (let c = 0; c < COLS; c++) {
    const x = c * colStep;
    const tL = lockStart(c);
    const band = outerY(x);
    // per target row, the wall chevron just below it at the lock moment
    const taken = new Set<number>();
    const picks: Array<{ k: number; y0: number; ty: number }> = [];
    for (let r = 0; r < BAND_ROWS; r++) {
      const ty = band + (T * (r + 0.18)) / BAND_ROWS;
      let best = -1;
      let bestD = Number.POSITIVE_INFINITY;
      for (let k = 0; k < ROWS; k++) {
        if (taken.has(k)) continue;
        const d = streamY(c, k, tL) - ty;
        if (d >= -rowStep * 0.25 && d < bestD) {
          bestD = d;
          best = k;
        }
      }
      if (best >= 0) {
        taken.add(best);
        picks.push({ k: best, y0: streamY(c, best, tL), ty });
      }
    }
    for (let k = 0; k < ROWS; k++) {
      const pick = picks.find((q) => q.k === k);
      const tone = 0.35 + 0.65 * hash(c * 13.7 + k * 3.3);
      const isAccent = hash(c * 5.1 + k * 9.7) > 0.9;
      if (pick && t >= tL) {
        const e = EASE_OUT(Math.max(0, Math.min(1, (t - tL) / LOCK_LEN)));
        const y = pick.y0 + (pick.ty - pick.y0) * e;
        const tint = interpolate(t, [tL, tL + LOCK_LEN], [0, 1], CLAMP);
        const grow = 1 + 0.42 * fuse;
        lockers.push(
          <path
            key={`l${c}-${k}`}
            d={chevronPath(x, y, a * grow, th * (1 + 1.6 * fuse))}
            fill={interpolateColors(
              tint,
              [0, 1],
              [isAccent ? accent : p.fg, gradAt(y + th)],
            )}
            opacity={
              (isAccent ? 1 : p.wall * tone) +
              (1 - (isAccent ? 1 : p.wall * tone)) * tint
            }
          />,
        );
        continue;
      }
      const y = streamY(c, k, t);
      // the rest of the wall clears out once its column has locked
      const leave = interpolate(t, [tL - 2, tL + 10], [1, 0], CLAMP);
      if (leave <= 0 || y < -rowStep * 1.2 || y > H + rowStep) continue;
      runners.push(
        <path
          key={`r${c}-${k}`}
          d={chevronPath(x, y, a, th)}
          fill={isAccent ? accent : p.fg}
          opacity={leave * (isAccent ? 0.95 : p.wall * tone)}
        />,
      );
    }
  }

  // ---- the figure -----------------------------------------------------------
  const yBase = H * 0.8;
  const capH = 0.66;
  const textEm = 2.86;
  const F = Math.min(
    ((yBase - innerApexY) / SLOPE - 0.12 * W) / (textEm / 2 + capH / SLOPE),
    (W * 0.7) / textEm,
  );
  const land = interpolate(t, [LAND_AT, LAND_AT + 14], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const capIn = interpolate(t, [LAND_AT + 8, LAND_AT + 24], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const solid = interpolate(t, [FUSE_AT + 2, FUSE_AT + 12], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const settle = interpolate(t, [FUSE_AT, FUSE_AT + 20], [0.985, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const drift = interpolate(t, [FUSE_AT, 150], [0, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        role="img"
        aria-label={`${value} ${caption}`}
      >
        <defs>
          <filter
            id={`${uid}smear`}
            filterUnits="userSpaceOnUse"
            x={0}
            y={-H * 0.2}
            width={W}
            height={H * 1.4}
          >
            <feGaussianBlur stdDeviation={`0 ${blurBase.toFixed(2)}`} />
          </filter>
          <linearGradient
            id={`${uid}fluted`}
            gradientUnits="userSpaceOnUse"
            x1={cx + W * 0.025 * drift}
            y1={gradY0}
            x2={cx - W * 0.025 * drift}
            y2={gradY1}
          >
            {p.fluted.map((c, i) => (
              <stop key={c} offset={FLUTED_STOPS[i]} stopColor={c} />
            ))}
          </linearGradient>
          <clipPath id={`${uid}giant`}>
            <path d={chevronPath(cx, apexY, giantA, T)} />
          </clipPath>
        </defs>

        <g filter={blurBase > 0.3 ? `url(#${uid}smear)` : undefined}>
          {runners}
        </g>
        {/* once fusing, the pieces are held inside the giant's outline */}
        <g
          opacity={1 - solid}
          clipPath={fuse > 0 ? `url(#${uid}giant)` : undefined}
        >
          {lockers}
        </g>
        <path
          d={chevronPath(cx, apexY, giantA, T)}
          fill={`url(#${uid}fluted)`}
          opacity={solid}
          transform={`translate(${cx} ${apexY + T}) scale(${settle}) translate(${-cx} ${-(apexY + T)})`}
        />
      </svg>

      {/* the figure drops into the cut-out */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: yBase - F * 0.86,
          textAlign: "center",
          fontFamily: display,
          fontWeight: 500,
          fontSize: F,
          lineHeight: 1,
          letterSpacing: "-0.035em",
          color: p.fg,
          opacity: Math.min(1, land * 1.8),
          transform: `translateY(${(1 - land) * -0.28 * F}px)`,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: yBase + 0.16 * F,
          textAlign: "center",
          fontFamily: serif,
          fontStyle: "italic",
          fontWeight: 400,
          fontSize: 46 * u,
          lineHeight: 1,
          letterSpacing: "-0.01em",
          color: p.fg,
          opacity: capIn * 0.78,
          transform: `translateY(${(1 - capIn) * 12 * u}px)`,
        }}
      >
        {caption}
      </div>
    </AbsoluteFill>
  );
}
