"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Geist";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface RingAlignProps {
  /** Word revealed in the channel once every slot lines up. */
  word?: string;
  /** Number of concentric rings. */
  rings?: number;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const FIRST_LOCK = 30;
const LOCK_STEP = 8;
const BEAM_GAP = 4;
const BEAM = 14;
const TAIL_DELAY = 8;
const TAIL = 16;
const HOLD = 32;

export const ringAlignLength = (rings = 6) =>
  FIRST_LOCK + (rings - 1) * LOCK_STEP + BEAM_GAP + TAIL_DELAY + TAIL + HOLD;

const LOCK = Easing.bezier(0.3, 0.55, 0.32, 1.05);
const WIPE = Easing.bezier(0.22, 1, 0.36, 1);
const TAIL_EASE = Easing.bezier(0.55, 0, 0.25, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

function hash(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function circle(x: number, y: number, r: number) {
  const rs = r.toFixed(2);
  const d = (2 * r).toFixed(2);
  return `M${(x - r).toFixed(1)} ${y.toFixed(1)}a${rs} ${rs} 0 1 0 ${d} 0a${rs} ${rs} 0 1 0 -${d} 0`;
}

function wrap(a: number) {
  let v = a % (Math.PI * 2);
  if (v > Math.PI) v -= Math.PI * 2;
  if (v < -Math.PI) v += Math.PI * 2;
  return v;
}

/* gradients.sh "radial-glow" palette: the beam that runs the channel, and
   the fill the word keeps once the beam has passed. */
const GLOW = ["#f3f1ff", "#9db4ff", "#5a46cb", "#1d1240"] as const;

function Grain({ opacity, light }: { opacity: number; light: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      width="100%"
      height="100%"
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden
    >
      <filter id={`${uid}-grain`}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency={0.85}
          numOctaves={2}
          seed={3}
        />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0"
        />
      </filter>
      <rect
        width="100%"
        height="100%"
        filter={`url(#${uid}-grain)`}
        opacity={opacity}
        style={{ mixBlendMode: light ? "multiply" : "screen" }}
      />
    </svg>
  );
}

export function RingAlign({
  word = "Aligned.",
  rings = 6,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: RingAlignProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const isLight = theme === "light";
  const bg = isLight ? "#F5F4F0" : "#0A0A0B";
  const ink = isLight ? "#141416" : "#EEEEF0";
  const u = Math.min(W, H) / 720;
  const n = Math.max(3, Math.min(9, Math.round(rings)));
  const cx = W / 2;
  const cy = H / 2;

  const band = H * 0.175;
  const pad = 9 * u;
  const rIn = H * 0.165;
  const rOut = H * 0.44;
  const dotR = 3.1 * u;
  const pitch = 17 * u;

  const lastLock = FIRST_LOCK + (n - 1) * LOCK_STEP;
  const beamStart = lastLock + BEAM_GAP;

  const ringPaths: { d: string; opacity: number }[] = [];
  for (let k = 0; k < n; k++) {
    // Outer ring locks first, the innermost last.
    const r = rOut - ((rOut - rIn) * k) / (n - 1);
    const count = Math.round((Math.PI * 2 * r) / pitch);
    const gap = 2 * Math.asin(Math.min(0.98, (band / 2 + pad) / r));
    const lockAt = FIRST_LOCK + k * LOCK_STEP;
    const dir = k % 2 === 0 ? 1 : -1;
    const offset = dir * Math.PI * (1.35 + hash(k * 4.1) * 0.5);
    const x = Math.min(1, Math.max(0, t / lockAt));
    let rot = offset * (1 - LOCK(x));
    const since = t - lockAt;
    if (since > 0) {
      rot +=
        -dir * 0.012 * Math.sin((since / 7) * Math.PI) * Math.exp(-since / 4);
    }
    const lit = interpolate(since, [-2, 6], [0.42, 1], CLAMP);
    const segs: string[] = [];
    for (let j = 0; j < count; j++) {
      const a = (j / count) * Math.PI * 2 + rot;
      const local = wrap((j / count) * Math.PI * 2);
      const toSlot = Math.min(Math.abs(local), Math.abs(wrap(local - Math.PI)));
      if (toSlot < gap / 2) continue;
      segs.push(circle(cx + Math.cos(a) * r, cy + Math.sin(a) * r, dotR));
    }
    ringPaths.push({ d: segs.join(""), opacity: lit });
  }

  const head =
    W * WIPE(interpolate(t, [beamStart, beamStart + BEAM], [0, 1], CLAMP));
  const tail =
    W *
    TAIL_EASE(
      interpolate(
        t,
        [beamStart + TAIL_DELAY, beamStart + TAIL_DELAY + TAIL],
        [0, 1],
        CLAMP,
      ),
    );
  const fontSize = band * 0.72;
  const dot = word.endsWith(".");
  const body = dot ? word.slice(0, -1) : word;
  const [g0, g1, g2, g3] = GLOW;
  const drift = interpolate(t, [beamStart, ringAlignLength(n)], [0, 1], CLAMP);
  const wordFill = isLight
    ? `linear-gradient(90deg, ${g2} ${(-10 + 20 * drift).toFixed(1)}%, ${g3} ${(45 + 10 * drift).toFixed(1)}%, ${g2} ${(110 + 10 * drift).toFixed(1)}%)`
    : `linear-gradient(90deg, ${g1} ${(-10 + 20 * drift).toFixed(1)}%, ${g0} ${(45 + 10 * drift).toFixed(1)}%, ${g1} ${(110 + 10 * drift).toFixed(1)}%)`;
  const beamFill = `linear-gradient(90deg, ${g3} 0%, ${g2} 45%, color-mix(in oklab, ${g2} 55%, ${g1}) 88%, ${g1} 98%, ${g0} 100%)`;
  const wordLayer = (fill: string, l: number, r: number) => (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: cy - band / 2,
        width: W,
        height: band,
        clipPath: `inset(0 ${(W - r).toFixed(1)}px 0 ${l.toFixed(1)}px)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: display,
          fontWeight: 500,
          fontSize,
          letterSpacing: "-0.035em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          paddingBottom: fontSize * 0.04,
          paddingRight: fontSize * 0.04,
          backgroundImage: fill,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {body}
        {dot ? (
          <span
            style={{
              WebkitTextFillColor: fill.includes("#FFFFFF")
                ? "#FFFFFF"
                : accent,
            }}
          >
            .
          </span>
        ) : null}
      </div>
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: bg,
        backgroundImage: isLight
          ? `radial-gradient(34% 58% at 50% 50%, color-mix(in oklab, ${GLOW[1]} 16%, transparent) 0%, transparent 100%), radial-gradient(70% 70% at 50% 50%, #FBFAF7 0%, ${bg} 72%)`
          : `radial-gradient(34% 58% at 50% 50%, color-mix(in oklab, ${GLOW[2]} 22%, transparent) 0%, transparent 100%), radial-gradient(70% 70% at 50% 50%, #121215 0%, ${bg} 72%)`,
        overflow: "hidden",
      }}
    >
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        {ringPaths.map((p, k) => (
          <path
            key={`ring-${k.toString()}`}
            d={p.d}
            fill={ink}
            opacity={p.opacity}
          />
        ))}
      </svg>
      {tail > 0 ? wordLayer(wordFill, 0, tail) : null}
      {head > tail + 0.5 ? (
        <div
          style={{
            position: "absolute",
            left: tail,
            top: cy - band / 2,
            width: head - tail,
            height: band,
            backgroundImage: beamFill,
          }}
        />
      ) : null}
      {head > tail + 0.5
        ? wordLayer("linear-gradient(#FFFFFF, #FFFFFF)", tail, head)
        : null}
      <Grain opacity={isLight ? 0.045 : 0.06} light={isLight} />
    </AbsoluteFill>
  );
}
