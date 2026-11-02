"use client";

import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: serifFamily } = loadNewsreader("italic", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: serifUpright } = loadNewsreader("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const manrope = loadManrope("normal", {
  weights: ["500", "600"],
  subsets: ["latin"],
});

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

/**
 * gradients.sh "radial-glow" palette: bg #020204, [#f3f1ff, #9db4ff, #5a46cb,
 * #1d1240]. A ring of light rising from below the frame: the hairline opens
 * onto its glow.
 */
const GLOW = {
  bg: "#020204",
  c0: "243,241,255",
  c1: "157,180,255",
  c2: "90,70,203",
  c3: "29,18,64",
};

export interface SlitRevealProps {
  /** Optional line of type that rides the hairline before it opens. */
  title?: string;
  /** Scene revealed inside the slit. Wins over `src`. */
  children?: React.ReactNode;
  /** Screenshot revealed inside the slit (object-fit: cover). */
  src?: string;
  /** "letterbox" opens top/bottom; "sideways" rolls the line upright and opens left/right. */
  opening?: "letterbox" | "sideways";
  accent?: string;
  speed?: number;
}

const STAGE = "#0A0A0B";
const CAMERA = Easing.bezier(0.65, 0, 0.35, 1);
const DRAW = Easing.bezier(0.22, 1, 0.36, 1);
const OPEN = Easing.bezier(0.72, 0, 0.12, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgba(hex: string, a: number) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Accent mixed toward white, for light that is only faintly tinted. */
function tint(hex: string, amount: number, a = 1) {
  const [r, g, b] = hexToRgb(hex);
  const m = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgba(${m(r)},${m(g)},${m(b)},${a})`;
}

function useSafeId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

// ── Light ─────────────────────────────────────────────────────────────────

/**
 * A hairline of light: a 1–2px core with tapered ends, a soft falloff around
 * it and a short specular hot spot in the middle. Horizontal, centered on its
 * own origin; the parent positions and rotates it.
 */
function LightLine({
  length,
  u,
  intensity,
  accent,
  core = 1,
  bloom = 1,
}: {
  length: number;
  u: number;
  intensity: number;
  accent: string;
  core?: number;
  bloom?: number;
}) {
  const base: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
  };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: intensity }}>
      {/* wide, low falloff: the air around the line lit up */}
      <div
        style={{
          ...base,
          width: length * 1.1,
          height: 120 * u * bloom,
          background: `radial-gradient(50% 50% at 50% 50%, ${tint(accent, 0.55, 0.12)} 0%, ${tint(accent, 0.4, 0.04)} 40%, rgba(0,0,0,0) 100%)`,
        }}
      />
      {/* tight falloff hugging the line */}
      <div
        style={{
          ...base,
          width: length,
          height: 16 * u * bloom,
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 55%, rgba(255,255,255,0) 100%)",
        }}
      />
      {/* the hairline */}
      <div
        style={{
          ...base,
          width: length,
          height: Math.max(1, 1.6 * u * core),
          background:
            "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.5) 14%, rgba(255,255,255,0.92) 38%, #fff 50%, rgba(255,255,255,0.92) 62%, rgba(255,255,255,0.5) 86%, rgba(255,255,255,0) 100%)",
        }}
      />
      {/* specular core */}
      <div
        style={{
          ...base,
          width: Math.min(length * 0.6, 260 * u),
          height: 5 * u * core,
          background:
            "radial-gradient(50% 50% at 50% 50%, #fff 0%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0) 100%)",
        }}
      />
    </div>
  );
}

function Grain({ opacity }: { opacity: number }) {
  const id = useSafeId("slit-grain");
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
          baseFrequency="0.85"
          numOctaves={2}
          seed={7}
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

// ── Default scene: an abstracted product pane ─────────────────────────────

function Bar({
  w,
  h,
  c,
  r,
  style,
}: {
  w: number | string;
  h: number;
  c: string;
  r?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r ?? h / 2,
        background: c,
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

function ProductScene({
  accent,
  tilt,
  rise,
}: {
  accent: string;
  tilt: number;
  /** 0 → 1 as the scene settles: the ring lifts a touch. */
  rise: number;
}) {
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const pw = Math.min(W * 0.7, H * 1.32);
  const ph = pw * 0.6;
  const line = "rgba(255,255,255,0.07)";
  const block = "rgba(255,255,255,0.075)";
  const blockHi = "rgba(255,255,255,0.16)";
  const gid = useSafeId("slit-area");
  const chartW = 400;
  const chartH = 120;
  const pts = [0.82, 0.74, 0.77, 0.6, 0.52, 0.56, 0.36, 0.2];
  const step = chartW / (pts.length - 1);
  let d = `M0 ${pts[0] * chartH}`;
  for (let i = 1; i < pts.length; i++) {
    const x0 = (i - 1) * step;
    const x1 = i * step;
    const cx = (x0 + x1) / 2;
    d += ` C${cx} ${pts[i - 1] * chartH} ${cx} ${pts[i] * chartH} ${x1} ${pts[i] * chartH}`;
  }
  const area = `${d} L${chartW} ${chartH} L0 ${chartH} Z`;

  return (
    <AbsoluteFill style={{ background: GLOW.bg, perspective: 1800 * u }}>
      {/* the glow: a haze pooled at the bottom and a thin ring rising through it */}
      <AbsoluteFill
        style={{
          background: [
            `radial-gradient(${74 + rise * 4}% ${104 + rise * 6}% at 50% ${112 - rise * 4}%, rgba(${GLOW.c0},0) 52%, rgba(${GLOW.c0},0.66) 56.5%, rgba(${GLOW.c1},0.5) 60%, rgba(${GLOW.c2},0.28) 67%, rgba(${GLOW.c2},0) 80%)`,
            `radial-gradient(95% 70% at 50% 112%, rgba(${GLOW.c2},0.55) 0%, rgba(${GLOW.c3},0.45) 45%, rgba(${GLOW.c3},0) 75%)`,
            `radial-gradient(60% 50% at 50% 0%, rgba(${GLOW.c1},0.08) 0%, rgba(0,0,0,0) 70%)`,
          ].join(", "),
        }}
      />
      {/* contact shadow */}
      <div
        style={{
          position: "absolute",
          left: (W - pw * 0.9) / 2,
          top: (H + ph) / 2 - 10 * u,
          width: pw * 0.9,
          height: 46 * u,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.85)",
          filter: `blur(${22 * u}px)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: (W - pw) / 2,
          top: (H - ph) / 2,
          width: pw,
          height: ph,
          borderRadius: 14 * u,
          background: "linear-gradient(180deg, #17171A 0%, #111113 100%)",
          boxShadow: `inset 0 0 0 1px ${line}, inset 0 1px 0 rgba(255,255,255,0.09), 0 ${30 * u}px ${80 * u}px rgba(0,0,0,0.55)`,
          display: "flex",
          overflow: "hidden",
          transform: `rotateX(${tilt * 14}deg) translateY(${tilt * 20 * u}px)`,
          transformOrigin: "50% 100%",
        }}
      >
        {/* rail */}
        <div
          style={{
            width: pw * 0.2,
            borderRight: `1px solid ${line}`,
            padding: `${22 * u}px ${18 * u}px`,
            display: "flex",
            flexDirection: "column",
            gap: 14 * u,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 * u }}>
            <RemocnLogo fontSize={17 * u} color="rgba(255,255,255,0.86)" />
          </div>
          <div style={{ height: 8 * u }} />
          {[0.78, 0.6, 0.7, 0.5, 0.64].map((w, i) => (
            <Bar
              key={w}
              w={`${w * 100}%`}
              h={6 * u}
              c={i === 1 ? blockHi : block}
            />
          ))}
        </div>
        {/* main */}
        <div
          style={{
            flex: 1,
            padding: `${26 * u}px ${28 * u}px`,
            display: "flex",
            flexDirection: "column",
            gap: 18 * u,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 9 * u }}>
            <Bar w={pw * 0.24} h={12 * u} c="rgba(255,255,255,0.32)" />
            <Bar w={pw * 0.36} h={6 * u} c={block} />
          </div>
          <div style={{ flex: 1, display: "flex", gap: 14 * u }}>
            <div
              style={{
                flex: 1.8,
                borderRadius: 10 * u,
                boxShadow: `inset 0 0 0 1px ${line}`,
                background: "rgba(255,255,255,0.015)",
                padding: 16 * u,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: 8 * u }}
              >
                <Bar w={70 * u} h={6 * u} c={block} />
                <Bar w={110 * u} h={14 * u} c="rgba(255,255,255,0.26)" />
              </div>
              <svg
                viewBox={`0 0 ${chartW} ${chartH}`}
                preserveAspectRatio="none"
                style={{ width: "100%", height: "66%" }}
                aria-hidden
              >
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0"
                      stopColor={`rgb(${GLOW.c1})`}
                      stopOpacity={0.34}
                    />
                    <stop
                      offset="0.6"
                      stopColor={`rgb(${GLOW.c2})`}
                      stopOpacity={0.16}
                    />
                    <stop
                      offset="1"
                      stopColor={`rgb(${GLOW.c2})`}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((g) => (
                  <line
                    key={g}
                    x1={0}
                    x2={chartW}
                    y1={g * chartH}
                    y2={g * chartH}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <path d={area} fill={`url(#${gid})`} />
                <path
                  d={d}
                  fill="none"
                  stroke={accent}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 14 * u,
              }}
            >
              {[0, 1].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    borderRadius: 10 * u,
                    boxShadow: `inset 0 0 0 1px ${line}`,
                    background: "rgba(255,255,255,0.015)",
                    padding: 14 * u,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8 * u,
                  }}
                >
                  <Bar w={54 * u} h={6 * u} c={block} />
                  <Bar
                    w={i === 0 ? 72 * u : 88 * u}
                    h={12 * u}
                    c={i === 0 ? rgba(accent, 0.75) : "rgba(255,255,255,0.22)"}
                  />
                  <div style={{ flex: 1 }} />
                  <Bar w="100%" h={4 * u} c={block} />
                  <Bar w="62%" h={4 * u} c={block} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

// ── Component ─────────────────────────────────────────────────────────────

export function SlitReveal({
  title = "Introducing remocn",
  children,
  src,
  opening = "letterbox",
  accent = "#3B5BFD",
  speed = 1,
}: SlitRevealProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const sideways = opening === "sideways";

  // Beat sheet (30fps):
  //  0–36   a point of light draws out from the center into a hairline
  //  20–44  title settles above the line; 36–60 hold
  //  sideways: 54–80 the line rolls upright
  //  62–106 (82–124) slit opens; rims carry the light out and fade
  //  scene settles from 1.16 → 1, holds to the end
  const tRot = sideways ? 54 : 0;
  const tOpen = sideways ? 82 : 62;
  const openLen = sideways ? 42 : 44;

  const draw = interpolate(frame, [2, 38], [0, 1], {
    ...clamp,
    easing: DRAW,
  });
  const ignite = interpolate(frame, [0, 10], [0.25, 1], clamp);
  const restLen = W * 0.8;
  let len = interpolate(draw, [0, 1], [10 * u, restLen]);

  const rot = sideways
    ? interpolate(frame, [tRot, tRot + 26], [0, 1], {
        ...clamp,
        easing: CAMERA,
      })
    : 0;
  if (sideways) {
    len = interpolate(rot, [0, 1], [len, H * 1.16]);
  } else {
    // the line runs out to the frame edges just before the slit opens
    len = interpolate(frame, [tOpen - 8, tOpen + 10], [len, W * 1.25], {
      ...clamp,
      easing: CAMERA,
    });
  }
  const angle = rot * 90;

  const open = interpolate(frame, [tOpen, tOpen + openLen], [0, 1], {
    ...clamp,
    easing: OPEN,
  });
  const span = sideways ? W : H;
  const gap = open * span;

  // a gentle breathing in the core while the line holds
  const breathe =
    1 + 0.06 * Math.sin(Math.max(0, frame - 36) * 0.18) * (1 - open);

  // rims carry the line's light outward and cool off as they travel
  const rimIntensity =
    interpolate(open, [0, 0.08, 0.75, 1], [1, 1, 0.25, 0], clamp) * breathe;
  const lineVisible = open < 0.02;

  // title
  const tIn = interpolate(frame, [18, 44], [0, 1], {
    ...clamp,
    easing: SETTLE,
  });
  const tOut = interpolate(frame, sideways ? [46, 56] : [52, 62], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.55, 0, 1, 0.45),
  });
  const titleOpacity = tIn * (1 - tOut);
  // "… remocn" sets the last word as the real logo.
  const words = title.trim().split(/\s+/);
  const titleLogo = words[words.length - 1]?.toLowerCase() === "remocn";
  const titleLead = titleLogo ? words.slice(0, -1).join(" ") : "";

  // scene
  const settle = interpolate(frame, [tOpen, tOpen + 70], [0, 1], {
    ...clamp,
    easing: SETTLE,
  });
  const sceneScale = interpolate(settle, [0, 1], [1.16, 1]);
  const sceneBlur = interpolate(open, [0, 0.55], [10 * u, 0], clamp);
  const sceneDim = interpolate(open, [0, 0.7], [0.45, 1], clamp);
  const sceneShift = interpolate(settle, [0, 1], [18 * u, 0]);

  const lineLenInFrame = sideways ? Math.min(len, H) : Math.min(len, W);
  const inset = sideways
    ? `${Math.max(0, (H - lineLenInFrame) / 2)}px ${(W - gap) / 2}px`
    : `${(H - gap) / 2}px ${Math.max(0, (W - lineLenInFrame) / 2)}px`;

  const scene =
    children ??
    (src ? (
      <Img
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      <ProductScene accent={accent} tilt={1 - settle} rise={settle} />
    ));

  const rimOffset = gap / 2;
  const rim = (sign: 1 | -1) => (
    <div
      style={{
        position: "absolute",
        left: W / 2 + (sideways ? sign * rimOffset : 0),
        top: H / 2 + (sideways ? 0 : sign * rimOffset),
        transform: `rotate(${angle}deg)`,
      }}
    >
      <LightLine
        length={len}
        u={u}
        intensity={rimIntensity * 0.9}
        accent={accent}
        core={interpolate(open, [0, 1], [1, 0.6])}
        bloom={interpolate(open, [0, 1], [0.9, 0.5])}
      />
    </div>
  );

  // light spilling into the scene from each rim
  const spill = interpolate(open, [0, 0.15, 0.8], [0, 0.22, 0], clamp);
  const spillDir = sideways ? "90deg" : "180deg";

  return (
    <AbsoluteFill style={{ background: STAGE, overflow: "hidden" }}>
      {open > 0 && (
        <AbsoluteFill style={{ clipPath: `inset(${inset})` }}>
          <AbsoluteFill
            style={{
              transform: `translate${sideways ? "X" : "Y"}(${sceneShift}px) scale(${sceneScale})`,
              filter: `blur(${sceneBlur}px) brightness(${sceneDim})`,
            }}
          >
            {scene}
          </AbsoluteFill>
          <AbsoluteFill
            style={{
              background: `linear-gradient(${spillDir}, rgba(255,255,255,${spill}) 0%, rgba(255,255,255,0) ${18 * u}px, rgba(255,255,255,0) calc(100% - ${18 * u}px), rgba(255,255,255,${spill}) 100%)`,
              clipPath: `inset(${inset})`,
            }}
          />
        </AbsoluteFill>
      )}

      {lineVisible ? (
        <div
          style={{
            position: "absolute",
            left: W / 2,
            top: H / 2,
            transform: `rotate(${angle}deg)`,
          }}
        >
          <LightLine
            length={len}
            u={u}
            intensity={ignite * breathe}
            accent={accent}
            core={interpolate(draw, [0, 1], [2.2, 1])}
          />
        </div>
      ) : (
        <>
          {rim(-1)}
          {rim(1)}
        </>
      )}

      {title && titleOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: H / 2 - 92 * u,
            height: 60 * u,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
            gap: 14 * u,
            color: "#EDEDEF",
            opacity: titleOpacity,
            transform: `translateY(${interpolate(tIn, [0, 1], [10 * u, 0]) - tOut * 8 * u}px)`,
            filter: `blur(${(1 - tIn) * 8 * u + tOut * 4 * u}px)`,
          }}
        >
          {titleLogo ? (
            <>
              {titleLead ? (
                <span
                  style={{
                    fontFamily: serifFamily,
                    fontStyle: "italic",
                    fontWeight: 400,
                    fontSize: 46 * u,
                    letterSpacing: "-0.01em",
                    lineHeight: 1,
                    color: "rgba(237,237,239,0.78)",
                  }}
                >
                  {titleLead}
                </span>
              ) : null}
              <RemocnLogo fontSize={46 * u} color="#F3F2EF" />
            </>
          ) : (
            <div
              style={{
                fontFamily: serifUpright,
                fontWeight: 400,
                fontSize: 46 * u,
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
                textWrap: "balance",
                textAlign: "center",
                maxWidth: W * 0.7,
              }}
            >
              {title}
            </div>
          )}
        </div>
      )}

      <Grain opacity={0.032} />
    </AbsoluteFill>
  );
}
