"use client";

import { loadFont } from "@remotion/google-fonts/Fraunces";
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

const { fontFamily: serif } = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

const REMOCN_R_PATH =
  "M 0.01 0.81 C 0.01 1.73, 0.36 2.79, 1.09 4.13 C 4.91 11.04, 13.45 17.16, 21.7 18.9 C 22.94 19.16, 23.18 19.16, 51.39 19.27 C 76.07 19.36, 80.02 19.4, 81.32 19.57 C 89.89 20.69, 96.2 24.68, 99.38 31.01 C 103.19 38.56, 102.53 50.1, 97.91 57.07 C 94.66 61.96, 89.68 64.99, 83.26 66 C 82.81 66.07, 70.18 66.83, 55.2 67.69 C 24.82 69.43, 27.03 69.23, 24.18 70.4 C 19.9 72.15, 14.84 75.7, 10.65 79.89 C 4.86 85.68, 1.3 91.91, 0.25 98.13 C 0.12 98.85, 0.08 103.13, 0.04 116.66 L 0 134.26 9.5 134.26 L 19 134.26 19.05 119.41 C 19.1 103.27, 19.08 103.82, 19.82 101.04 C 21.79 93.65, 27.86 88.75, 36.45 87.63 C 37.23 87.53, 39.41 87.5, 43.57 87.53 C 50.12 87.59, 50.75 87.65, 53.22 88.45 C 56.61 89.56, 59.67 91.86, 62.02 95.07 C 62.52 95.76, 69.35 103.85, 77.2 113.07 C 85.04 122.28, 91.63 130.04, 91.85 130.32 C 92.07 130.59, 92.5 131.34, 92.82 131.97 C 93.52 133.35, 94.11 133.93, 95.06 134.13 C 95.5 134.23, 98.97 134.26, 106.36 134.23 L 117.01 134.19 100.82 113.07 C 91.91 101.45, 84.52 91.78, 84.39 91.57 C 83.36 89.89, 83.66 87.53, 85.09 86 C 85.79 85.25, 86.36 84.94, 88.07 84.38 C 96.18 81.72, 104.15 76.62, 109.97 70.36 C 120.59 58.93, 124.06 44.32, 119.44 30.43 C 114.59 15.81, 101.93 4.02, 87.64 0.83 C 83.93 0.01, 88.09 0.08, 41.85 0.04 L 0.01 0 0.01 0.81 Z";

/** Full logo as on remocn.dev: R mark (0.76em tall, baseline-aligned) + "emocn" in Manrope 600. */
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

export interface InkBloomProps {
  /** Replaces the remocn logo in the lockup the ink settles into; `name` is set beside it. */
  logo?: React.ReactNode;
  name?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  /** Light = off-white paper with near-black ink (default); dark = light ink on black. */
  theme?: "light" | "dark";
  /** Changes the shape of the bloom. */
  seed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "mist" palette: bg #040407, [#f4d9ff, #a77bff, #3b2a9e, #120d33].
// It is a gradient map on the ink's density: thin veils one end, dense cores the other.
const THEMES = {
  light: {
    bg: "#F5F4F0",
    ink: "#14161B",
    map: ["#c9b0ff", "#a77bff", "#5a44c4", "#3b2a9e", "#120d33", "#120d33"],
    mapThin: ["#d9c6ff", "#b994ff", "#8a66f0", "#6a4fd6", "#4b37b0", "#3b2a9e"],
    fg: "#121214",
    blend: "multiply" as const,
    vignette: "rgba(110,100,85,0.12)",
    grain: 0.05,
  },
  dark: {
    bg: "#040407",
    ink: "#E9E7E1",
    map: ["#2a1f78", "#3b2a9e", "#7a5ae6", "#a77bff", "#f4d9ff", "#fbf2ff"],
    mapThin: ["#2a1f78", "#3b2a9e", "#6a4fd6", "#8a66f0", "#a77bff", "#c9a8ff"],
    fg: "#F3F2EF",
    blend: "screen" as const,
    vignette: "rgba(0,0,0,0.6)",
    grain: 0.06,
  },
} as const;

/** Frame the drop meets the water. */
const IMPACT = 13;
/** How far the vortex ring sinks, as a share of the frame height. */
const SINK = 0.33;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const sat = (age: number, tau: number) => 1 - Math.exp(-Math.max(0, age) / tau);

interface Puff {
  x: number;
  y: number;
  r: number;
  o: number;
  /** Second ink: a thread of accent carried in the vortex cores. */
  accent?: boolean;
  /** Billow edge: darker at the rim, so overlapping puffs read as rolled sheets. */
  rim?: boolean;
}

/**
 * The bloom as soft puffs: a sinking vortex ring (two curling lobes joined by
 * a thin band), the wake it leaves, smaller plumes that peel off the lobes,
 * and a faint veil. Every motion decays exponentially, so the ink slows and
 * settles on its own; the filter supplies all the fine structure.
 */
function bloom(age: number, ox: number, oy: number, h: number, seed: number) {
  const u = h / 720;
  const puffs: Puff[] = [];
  if (age < 0) return puffs;
  const H = (n: number) => hash(n + seed * 97.13);

  const sinkAt = (a: number) => oy + SINK * h * sat(a, 24);
  const ringAt = (a: number) => (8 + 290 * sat(a, 34)) * u;
  const cy = sinkAt(age);
  const cx = ox + 16 * u * sat(age, 40);
  const R = ringAt(age);
  const lobeR = (6 + 118 * sat(age, 30)) * u;
  const dilute = Math.min(1, 0.55 + 16 / (8 + age));
  const turn = 2.8 * sat(age, 26) + 0.005 * age;

  for (const side of [-1, 1]) {
    // a slightly tilted, uneven ring reads as fluid rather than a mirror image
    const lx = cx + side * R * (1 + side * 0.06);
    const ly = cy - side * 14 * u * sat(age, 30);
    const lr = lobeR * (1 - side * 0.1);
    for (let j = 0; j < 36; j++) {
      const k = side * 1000 + j;
      const edge = j >= 12;
      const rho = lr * (edge ? 0.62 + 0.38 * H(k) : 0.5 * Math.sqrt(H(k)));
      const phi = H(k + 0.5) * Math.PI * 2 - side * turn * (1.35 - rho / lr);
      out(puffs, {
        x: lx + Math.cos(phi) * rho,
        y: ly + Math.sin(phi) * rho * 0.8,
        r: lr * (edge ? 0.22 + 0.22 * H(k + 0.25) : 0.45 + 0.2 * H(k + 0.25)),
        o: (edge ? 0.34 : 0.3) * dilute,
        rim: false,
        accent: j % 5 === 1 && rho < lr * 0.7,
      });
    }
  }
  // the thin band joining the lobes: front and back of the ring
  for (let j = 0; j < 14; j++) {
    const th = (j / 14) * Math.PI * 2 + H(300 + j) * 0.3;
    out(puffs, {
      x: cx + Math.cos(th) * R * 0.9,
      y: cy + Math.sin(th) * R * 0.13 + lobeR * 0.12,
      r: lobeR * (0.22 + 0.12 * H(320 + j)),
      o: 0.2 * dilute,
      accent: j % 7 === 2,
    });
  }
  // the wake: a thin swaying column from the entry point down to the ring
  for (let j = 0; j < 20; j++) {
    const f = j / 19;
    const sway = Math.sin(f * 4.5 + H(400) * 6 + age * 0.018) * 12 * u * f;
    out(puffs, {
      x: ox + sway + (H(410 + j) - 0.5) * 5 * u,
      y: oy + (cy - oy) * (0.02 + 0.88 * f),
      r: (4 + 9 * f + 7 * sat(age, 60)) * u,
      o: 0.32 * (1 - f * 0.3) * Math.min(1, age / 4),
    });
  }
  // secondary plumes peel off the underside of each lobe and sink
  for (const side of [-1, 1]) {
    for (let m = 0; m < 4; m++) {
      const k = 5000 + side * 500 + m * 37;
      const a0 = 16 + m * 7 + H(k) * 6;
      const la = age - a0;
      if (la <= 0) continue;
      const sx = cx + side * (ringAt(a0) + (m - 1.2) * 26 * u);
      const sy = sinkAt(a0) + lobeR * 0.4;
      const ang = ((90 - side * (8 + m * 22 + H(k + 1) * 12)) * Math.PI) / 180;
      const reach = (130 + 120 * H(k + 2)) * u * (m === 3 ? 0.6 : 1);
      const d = reach * sat(la, 24);
      const grow = Math.min(1, la / 24);
      const curve = (H(k + 3) - 0.5) * 0.6;
      let hx = sx;
      let hy = sy;
      for (let q = 1; q <= 8; q++) {
        const f = q / 8;
        const a = ang + curve * f;
        hx = sx + Math.cos(a) * d * f;
        hy = sy + Math.sin(a) * d * f;
        out(puffs, {
          x: hx,
          y: hy,
          r: (4 + 10 * f * grow) * u,
          o: 0.24 * Math.min(1, la / 6),
        });
      }
      // a small mushroom head
      const headR = (8 + 22 * grow) * u;
      for (let q = 0; q < 6; q++) {
        const th = (q / 6) * Math.PI * 2 + H(k + 10 + q) + la * 0.02 * side;
        out(puffs, {
          x: hx + Math.cos(th) * headR * 0.75,
          y: hy + Math.sin(th) * headR * 0.45,
          r: headR * (0.4 + 0.3 * H(k + 20 + q)),
          o: 0.28 * Math.min(1, la / 8),
          accent: m === 1 && q < 2,
        });
      }
    }
  }
  // veil: big, faint, slowly spreading
  for (let j = 0; j < 12; j++) {
    const th = H(700 + j) * Math.PI * 2;
    const spread = (60 + 260 * H(710 + j)) * u * sat(age, 50);
    out(puffs, {
      x: cx + Math.cos(th) * spread * 1.4,
      y: cy + Math.sin(th) * spread * 0.55 - 10 * u,
      r: (30 + 90 * sat(age, 45) + 40 * H(720 + j)) * u,
      o: 0.08 * Math.min(1, age / 10),
    });
  }
  return puffs;
}

function out(list: Puff[], p: Puff) {
  list.push(p);
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
          baseFrequency="0.85"
          numOctaves={2}
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function InkBloom({
  logo,
  name = "remocn",
  accent = "#3B5BFD",
  speed = 1,
  theme = "light",
  seed = 3,
}: InkBloomProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const pal = THEMES[theme];
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const ox = width / 2;
  const oy = height * 0.17;
  const age = t - IMPACT;
  const puffs = bloom(age, ox, oy, height, seed);

  // The noise field evolves: seeds cross-fade, features grow as the ink diffuses.
  // Shapes move through a fixed field, which is what makes the plumes billow.
  const mixA = 0.5 + 0.5 * Math.sin(t / 26);
  const mixB = 0.5 + 0.5 * Math.cos(t / 33);
  const bfLow = (0.0058 - 0.0016 * sat(age, 70)) / u;
  const bfTex = (0.009 - 0.002 * sat(age, 70)) / u;
  const warp = (60 + 40 * sat(age, 40)) * u;

  // resolve: the cloud thins while the lockup condenses from the same turbulence
  const thin = interpolate(t, [92, 150], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const cloudO = 1 - thin * 0.6;
  const envBlur = (3 + 3 * sat(age, 60) + thin * 5) * u;
  const veinK = 0.85;
  const fray = (26 + 14 * sat(age, 40)) * u;
  const resolve = interpolate(t, [100, 150], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lockWarp = (1 - resolve) * 110 * u;
  const lockBlur = (1 - resolve) ** 1.5 * 10 * u;

  // the drop: accelerates in from above with a short trail of ghosts
  const fall = interpolate(t, [0, IMPACT], [0, 1], CLAMP);
  const dropY = interpolate(fall ** 1.7, [0, 1], [10 * u, oy]);
  const stretch = fall * 2;
  const dropShow = t < IMPACT + 1;

  const soft = `ink${id}`;
  const softA = `inkA${id}`;
  const rim = `rim${id}`;
  const body = `body${id}`;
  const cond = `cond${id}`;

  const markSize = 96 * u;
  const lockY = oy + SINK * height * 0.98;

  // as the cloud thins, the map slides toward the saturated middle of the palette
  const inkMap = pal.map.map((c, i) =>
    interpolateColors(thin, [0, 1], [c, pal.mapThin[i]]),
  );
  const ramp = (stops: string[], ch: number) =>
    stops
      .map((c) => {
        const m = c.match(/[\d.]+/g) ?? ["0", "0", "0"];
        return (Number(m[ch]) / 255).toFixed(3);
      })
      .join(" ");
  const inkFilter = (fid: string, mapped: boolean) => (
    <filter
      id={fid}
      filterUnits="userSpaceOnUse"
      x={0}
      y={0}
      width={width}
      height={height}
      colorInterpolationFilters="sRGB"
    >
      <feTurbulence
        type="fractalNoise"
        baseFrequency={bfLow}
        numOctaves={2}
        seed={seed}
        result="l1"
      />
      <feTurbulence
        type="fractalNoise"
        baseFrequency={bfLow * 1.21}
        numOctaves={2}
        seed={seed + 17}
        result="l2"
      />
      <feComposite
        in="l1"
        in2="l2"
        operator="arithmetic"
        k2={mixA}
        k3={1 - mixA}
        result="low"
      />
      {/* the puffs, rolled by a big smooth swirl, become a soft volume */}
      <feDisplacementMap
        in="SourceGraphic"
        in2="low"
        scale={warp}
        xChannelSelector="R"
        yChannelSelector="G"
        result="swirl"
      />
      <feGaussianBlur in="swirl" stdDeviation={envBlur} result="envSoft" />
      {/* creases of turbulence noise are the filaments inside the volume */}
      <feTurbulence
        type="turbulence"
        baseFrequency={bfTex}
        numOctaves={4}
        seed={seed + 41}
        result="t1"
      />
      <feTurbulence
        type="turbulence"
        baseFrequency={bfTex * 0.9}
        numOctaves={4}
        seed={seed + 59}
        result="t2"
      />
      <feComposite
        in="t1"
        in2="t2"
        operator="arithmetic"
        k2={mixB}
        k3={1 - mixB}
        result="tex"
      />
      <feDisplacementMap
        in="tex"
        in2="low"
        scale={warp}
        xChannelSelector="R"
        yChannelSelector="G"
        result="texw"
      />
      {/* fray the volume's edges along the same creases */}
      <feDisplacementMap
        in="envSoft"
        in2="texw"
        scale={fray}
        xChannelSelector="R"
        yChannelSelector="R"
        result="env"
      />
      <feColorMatrix
        in="texw"
        values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -3 0 0 0 1.3"
        result="veins"
      />
      <feComposite
        in="env"
        in2="veins"
        operator="arithmetic"
        k1={veinK}
        k2={1 - veinK * 0.62}
        result="ink"
      />
      {mapped ? (
        <>
          {/* gradient map: density (alpha) picks the colour from the palette */}
          <feColorMatrix
            in="ink"
            values="0 0 0 1 0  0 0 0 1 0  0 0 0 1 0  0 0 0 0 1"
            result="dens"
          />
          <feComponentTransfer in="dens" result="mapped">
            <feFuncR type="table" tableValues={ramp(inkMap, 0)} />
            <feFuncG type="table" tableValues={ramp(inkMap, 1)} />
            <feFuncB type="table" tableValues={ramp(inkMap, 2)} />
          </feComponentTransfer>
          <feComposite in="mapped" in2="ink" operator="in" />
        </>
      ) : null}
    </filter>
  );

  return (
    <AbsoluteFill style={{ background: pal.bg, overflow: "hidden" }}>
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <radialGradient id={soft}>
            <stop offset="0%" stopColor={pal.ink} stopOpacity={1} />
            <stop offset="50%" stopColor={pal.ink} stopOpacity={0.6} />
            <stop offset="100%" stopColor={pal.ink} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={rim}>
            <stop offset="0%" stopColor={pal.ink} stopOpacity={0.1} />
            <stop offset="60%" stopColor={pal.ink} stopOpacity={0.28} />
            <stop offset="86%" stopColor={pal.ink} stopOpacity={0.75} />
            <stop offset="100%" stopColor={pal.ink} stopOpacity={0} />
          </radialGradient>
          <radialGradient id={softA}>
            <stop offset="0%" stopColor={accent} stopOpacity={1} />
            <stop offset="50%" stopColor={accent} stopOpacity={0.55} />
            <stop offset="100%" stopColor={accent} stopOpacity={0} />
          </radialGradient>
          {/*
            ink = soft envelope (the puffs, blurred, swirled by low noise)
                  x billowing density texture (fractal noise as alpha)
          */}
          {inkFilter(body, true)}
          {inkFilter(`${body}a`, false)}
          <filter
            id={cond}
            x="-30%"
            y="-80%"
            width="160%"
            height="260%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.014 / u}
              numOctaves={3}
              seed={seed + 5}
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale={lockWarp}
              xChannelSelector="R"
              yChannelSelector="G"
              result="d"
            />
            <feGaussianBlur in="d" stdDeviation={lockBlur} />
          </filter>
        </defs>

        <g filter={`url(#${body}a)`} opacity={cloudO * 0.9}>
          {puffs
            .filter((p) => p.accent)
            .map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={p.r * 0.9}
                fill={`url(#${softA})`}
                opacity={Math.min(1, p.o * 1.25)}
              />
            ))}
        </g>
        <g filter={`url(#${body})`} opacity={cloudO}>
          {puffs.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={`url(#${p.rim ? rim : soft})`}
              opacity={Math.min(1, p.o * 1.7)}
            />
          ))}
        </g>

        {/* the falling drop */}
        {dropShow && (
          <g transform={`translate(${ox} ${dropY}) scale(${1.45 * u})`}>
            {[3, 2, 1].map((g) => (
              <ellipse
                key={g}
                cx={0}
                cy={-g * stretch * 8}
                rx={5}
                ry={6 + stretch * 3}
                fill={pal.map[4]}
                opacity={0.07 * (4 - g) * fall}
              />
            ))}
            <path
              d={`M0 ${-(13 + stretch * 6)} C2 -6 6.5 -2 6.5 2.5 A6.5 6.5 0 0 1 -6.5 2.5 C-6.5 -2 -2 -6 0 ${-(13 + stretch * 6)}Z`}
              fill={pal.map[4]}
            />
          </g>
        )}
      </svg>

      {/* the lockup condenses out of the turbulence */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: lockY - markSize / 2,
          height: markSize,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 14 * u,
          opacity: interpolate(resolve, [0, 0.3, 1], [0, 0.75, 1]),
          filter: resolve < 1 ? `url(#${cond})` : undefined,
          transform: `scale(${0.985 + resolve * 0.015})`,
        }}
      >
        {logo ? (
          <>
            {logo}
            <div
              style={{
                fontFamily: serif,
                fontWeight: 400,
                fontSize: 92 * u,
                lineHeight: 1,
                letterSpacing: "-0.03em",
                color: pal.fg,
              }}
            >
              {name}
            </div>
          </>
        ) : (
          <RemocnLogo fontSize={112 * u} color={pal.fg} />
        )}
      </div>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 75% at 50% 50%, transparent 50%, ${pal.vignette} 100%)`,
        }}
      />
      <Grain opacity={pal.grain} />
    </AbsoluteFill>
  );
}
