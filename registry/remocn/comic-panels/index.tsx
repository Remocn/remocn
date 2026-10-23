"use client";

import { type ReactNode, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ComicPanelsColors = {
  ink: string;
  paper: string;
  accent: string;
};

export type ComicPanelsProps = {
  /** Hero content, framed in the top panel once the page cracks. Falls back to a placeholder "remocn" lockup. */
  children?: ReactNode;
  /** Optional word in the starburst, e.g. "POW". */
  word?: string;
  colors?: Partial<ComicPanelsColors>;
  /** Ink color. Overrides `colors.ink` when set. */
  ink?: string;
  /** Paper color. Overrides `colors.paper` when set. */
  paper?: string;
  /** Accent color. Overrides `colors.accent` when set. */
  accent?: string;
  /** Scale of `children` inside the top panel. */
  heroScale?: number;
  speed?: number;
};

export const comicPanelsDefaults = {
  colors: {
    ink: "#111111",
    paper: "#FFFFFF",
    accent: "#E5322D",
  } as ComicPanelsColors,
  heroScale: 0.62,
  speed: 1,
};

export const comicPanelsLength = 36;

const FONT =
  "'Arial Black', Impact, Inter, -apple-system, 'Segoe UI', sans-serif";
const SANS =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Helvetica, Arial, sans-serif";

// Placeholder hero shown when no children are passed.
function PlaceholderLockup({ ink, accent }: { ink: string; accent: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 32,
          backgroundColor: accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            backgroundColor: ink,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: SANS,
          fontSize: 104,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          color: ink,
        }}
      >
        remocn
      </span>
    </div>
  );
}
const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};
const ease = (
  t: number,
  from: number,
  to: number,
  easing: (n: number) => number = Easing.inOut(Easing.cubic),
) => interpolate(t, [from, to], [0, 1], { ...clamp, easing });

type Pt = [number, number];
const poly = (points: Pt[]) => points.map((p) => p.join(",")).join(" ");

function starburst(spikes: number, outer: number, inner: number, seed: string) {
  const points: Pt[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const a =
      (i / (spikes * 2)) * Math.PI * 2 +
      (random(`${seed}-a-${i}`) - 0.5) * 0.12;
    const r =
      i % 2 === 0
        ? outer * (0.82 + 0.18 * random(`${seed}-r-${i}`))
        : inner * (0.9 + 0.1 * random(`${seed}-r-${i}`));
    points.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return poly(points);
}

export function ComicPanels({
  children,
  word,
  colors,
  ink,
  paper,
  accent,
  heroScale = comicPanelsDefaults.heroScale,
  speed = comicPanelsDefaults.speed,
}: ComicPanelsProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const merged = { ...comicPanelsDefaults.colors, ...colors };
  const c: ComicPanelsColors = {
    ink: ink ?? merged.ink,
    paper: paper ?? merged.paper,
    accent: accent ?? merged.accent,
  };
  const t = (frame / fps) * 30 * speed;
  const u = Math.min(W, H) / 720;

  // Page geometry: one slanted horizontal gutter, one slanted vertical one.
  const a0 = 0.6 * H;
  const a1 = 0.5 * H;
  const yA = (x: number) => a0 + ((a1 - a0) * x) / W;
  const b0: Pt = [0.53 * W, yA(0.53 * W)];
  const b1: Pt = [0.46 * W, H];
  const gutter = 16 * u;
  const border = 5 * u;

  const margin = ease(t, 0, 8) * 22 * u;
  const crackA = ease(t, 2, 10, Easing.out(Easing.cubic));
  const crackB = ease(t, 8, 14, Easing.out(Easing.cubic));
  const slide2 = ease(t, 10, 18, Easing.out(Easing.exp));
  const slide3 = ease(t, 13, 21, Easing.out(Easing.exp));
  const burst = ease(t, 23, 34, Easing.in(Easing.cubic));
  const settle = ease(t, 30, 36, Easing.out(Easing.cubic));
  const shaking = t >= 22 && t < 31;
  const step = Math.floor(t / 2);
  const shake = shaking
    ? [
        (random(`comic-sx-${step}`) - 0.5) * 14 * u,
        (random(`comic-sy-${step}`) - 0.5) * 14 * u,
      ]
    : [0, 0];
  const jolt = `translate(${shake[0]} ${shake[1]})`;

  const left: Pt[] = [[0, a0], b0, b1, [0, H]];
  const right: Pt[] = [b0, [W, a1], [W, H], b1];
  const heroFocus: Pt = [W / 2, interpolate(crackA, [0, 1], [H / 2, 0.27 * H])];
  const heroS = interpolate(crackA, [0, 1], [1, heroScale]);

  // Speed lines: wedges from the hero focus, redrawn every 2 frames.
  const wedges = Array.from({ length: 56 }, (_, i) => {
    const a =
      (i / 56) * Math.PI * 2 + (random(`comic-w-${step}-${i}`) - 0.5) * 0.09;
    const spread = 0.008 + 0.014 * random(`comic-ws-${step}-${i}`);
    const r0 = (0.3 + 0.12 * random(`comic-wr-${step}-${i}`)) * W * heroS;
    const r1 = W * 1.2;
    const [fx, fy] = heroFocus;
    const at = (r: number, d: number): Pt => [
      fx + Math.cos(a + d) * r,
      fy + Math.sin(a + d) * r * 0.62,
    ];
    return poly([at(r0, 0), at(r1, -spread), at(r1, spread)]);
  });

  // Halftone: dots swell toward the panel's lower-left corner.
  const pitch = 20 * u;
  const dots: { x: number; y: number; r: number }[] = [];
  for (let y = a1 - pitch; y < H + pitch; y += pitch) {
    for (let x = 0; x < b0[0] + pitch; x += pitch) {
      const ox = (Math.round(y / pitch) % 2) * (pitch / 2);
      const d = Math.hypot(x + ox, H - y) / Math.hypot(b0[0], H - a0);
      const r = pitch * 0.5 * Math.max(0, Math.min(1, 1.15 - d));
      if (r > 0.6 * u) dots.push({ x: x + ox, y, r });
    }
  }

  const c3: Pt = [(b0[0] + W + W + b1[0]) / 4, (b0[1] + a1 + H + H) / 4];
  const outer = 0.4 * (H - a1);
  const pulse = 1 + 0.04 * Math.sin(t * 1.4);
  const center: Pt = [
    interpolate(burst, [0, 1], [c3[0], W / 2]),
    interpolate(burst, [0, 1], [c3[1], H / 2]),
  ];
  const redScale = interpolate(burst, [0, 1], [1, 9]) * pulse;
  const whiteScale =
    interpolate(burst, [0, 1], [1, (0.4 * H) / (outer * 0.62)]) *
    pulse *
    interpolate(settle, [0, 1], [1.08, 1]);
  const spin = interpolate(burst, [0, 1], [0, 14]);
  const burstLayer = (
    <g transform={`translate(${center[0]} ${center[1]}) rotate(${spin})`}>
      <polygon
        transform={`scale(${redScale})`}
        points={starburst(16, outer, outer * 0.68, "comic-red")}
        fill={c.accent}
        stroke={c.ink}
        strokeWidth={(border * 0.8) / redScale}
        strokeLinejoin="round"
      />
      <polygon
        transform={`scale(${whiteScale})`}
        points={starburst(13, outer * 0.62, outer * 0.42, "comic-white")}
        fill={c.paper}
        stroke={c.ink}
        strokeWidth={(border * 0.8) / whiteScale}
        strokeLinejoin="round"
      />
      {word ? (
        <g
          transform={`scale(${whiteScale}) rotate(-8)`}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONT}
          fontWeight={900}
          fontSize={outer * 0.4}
        >
          <text x={outer * 0.03} y={outer * 0.03} fill={c.accent}>
            {word}
          </text>
          <text fill={c.ink}>{word}</text>
        </g>
      ) : null}
    </g>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: c.paper, overflow: "hidden" }}>
      <AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute" }} aria-hidden>
          <defs>
            <clipPath id={`${id}-left`}>
              <polygon points={poly(left)} />
            </clipPath>
            <clipPath id={`${id}-right`}>
              <polygon points={poly(right)} />
            </clipPath>
          </defs>
          <g fill={c.ink} transform={jolt}>
            {wedges.map((points, i) => (
              <polygon key={i} points={points} />
            ))}
          </g>
        </svg>
        <AbsoluteFill
          style={{
            alignItems: "center",
            justifyContent: "center",
            transform: `translate(${heroFocus[0] - W / 2 + shake[0]}px, ${heroFocus[1] - H / 2 + shake[1]}px) scale(${heroS})`,
          }}
        >
          {children ?? <PlaceholderLockup ink={c.ink} accent={c.accent} />}
        </AbsoluteFill>
        <svg width={W} height={H} style={{ position: "absolute" }} aria-hidden>
          <g
            clipPath={`url(#${id}-left)`}
            transform={`translate(${(slide2 - 1) * b0[0]} 0)`}
            opacity={slide2 > 0 ? 1 : 0}
          >
            <polygon points={poly(left)} fill={c.paper} />
            <g fill={c.accent} transform={jolt}>
              {dots.map((d) => (
                <circle key={`${d.x}-${d.y}`} cx={d.x} cy={d.y} r={d.r} />
              ))}
            </g>
          </g>
          <g clipPath={`url(#${id}-right)`}>
            <g
              transform={`translate(${(1 - slide3) * (W - b1[0])} 0)`}
              opacity={slide3 > 0 ? 1 : 0}
            >
              <polygon points={poly(right)} fill={c.ink} />
              <g transform={jolt}>{burst === 0 ? burstLayer : null}</g>
            </g>
          </g>
          {/* Gutters: ink edges first, then the white channel on top. */}
          {[c.ink, c.paper].map((stroke, pass) => (
            <g
              key={stroke + pass}
              stroke={stroke}
              strokeWidth={pass === 0 ? gutter + border * 2 : gutter}
              strokeLinecap="butt"
            >
              <line
                x1={-gutter}
                y1={yA(-gutter)}
                x2={-gutter + (W + 2 * gutter) * crackA}
                y2={yA(-gutter + (W + 2 * gutter) * crackA)}
              />
              <line
                x1={b0[0]}
                y1={b0[1]}
                x2={b0[0] + (b1[0] + (b1[0] - b0[0]) * 0.05 - b0[0]) * crackB}
                y2={b0[1] + (H * 1.05 - b0[1]) * crackB}
              />
            </g>
          ))}
          <path
            d={`M ${-W} ${-H} H ${2 * W} V ${2 * H} H ${-W} Z M ${margin} ${margin} V ${H - margin} H ${W - margin} V ${margin} Z`}
            fill={c.paper}
          />
          {margin > 0 ? (
            <rect
              x={margin}
              y={margin}
              width={W - margin * 2}
              height={H - margin * 2}
              fill="none"
              stroke={c.ink}
              strokeWidth={border}
            />
          ) : null}
        </svg>
      </AbsoluteFill>
      {burst > 0 ? (
        <svg width={W} height={H} style={{ position: "absolute" }} aria-hidden>
          <g transform={jolt}>{burstLayer}</g>
        </svg>
      ) : null}
    </AbsoluteFill>
  );
}
