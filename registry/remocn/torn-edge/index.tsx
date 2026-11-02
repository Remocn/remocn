"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
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

export interface TornEdgeProps {
  /** Headline printed on the stage underneath the sheet. */
  title?: string;
  /** Mid colour of the sheet's gradient (gradients.sh "fluted"). */
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EASE_TEAR = Easing.bezier(0.42, 0, 0.7, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

// gradients.sh "fluted" palette: #1d2a8f, #2f7bff, #ff7a3d, #ffe2c4. The sheet
// is printed with it; `accent` takes the blue middle stop.
const FLUTED = ["#1D2A8F", "#FF7A3D", "#FFE2C4"] as const;

const TEAR_START = 2;
const TEAR_END = 36;
const PART_START = 32;
const PART_END = 70;

const THEMES = {
  dark: {
    stage: "#0E0E10",
    fg: "#F3F2EF",
    fiber: "#ECE9E1",
    shadow: "rgba(0,0,0,0.85)",
    light: "rgba(255,255,255,0.08)",
    vignette: "rgba(0,0,0,0.45)",
    grain: 0.06,
  },
  light: {
    stage: "#F2F0EA",
    fg: "#141413",
    fiber: "#FBFAF6",
    shadow: "rgba(40,38,60,0.42)",
    light: "rgba(255,252,245,0.14)",
    vignette: "rgba(60,50,35,0.16)",
    grain: 0.05,
  },
} as const;

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** Smooth 1D value noise in [0, 1]. */
function noise(x: number, seed: number) {
  const i = Math.floor(x);
  const f = x - i;
  const s = f * f * (3 - 2 * f);
  const a = hash(i + seed * 101.3);
  const b = hash(i + 1 + seed * 101.3);
  return a + (b - a) * s;
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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

type Pt = [number, number];

/** Closed polygon: the torn edge plus two far corners on one side. */
function piece(edge: Pt[], farY: number) {
  const first = edge[0];
  const last = edge[edge.length - 1];
  const pts = edge.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`);
  return `M${first[0].toFixed(2)} ${farY}L${pts.join("L")}L${last[0].toFixed(2)} ${farY}Z`;
}

export function TornEdge({
  title = "Make it yours.",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: TornEdgeProps) {
  const f = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const p = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const paperId = `pa${uid}`;
  const frayId = `fr${uid}`;
  const shTopId = `st${uid}`;
  const shBotId = `sb${uid}`;
  const inkId = `ink${uid}`;

  const M = 60 * u;
  const tilt = -0.045;
  const step = 2.5 * u;
  const count = Math.ceil((W + 2 * M) / step) + 1;

  const tip = interpolate(f, [TEAR_START, TEAR_END], [-M * 0.5, W + M], {
    ...CLAMP,
    easing: EASE_TEAR,
  });
  const part = interpolate(f, [PART_START, PART_END], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });

  const D = 0.205 * H;
  const OPEN_MAX = 10 * u;

  const topFiber: Pt[] = [];
  const topBody: Pt[] = [];
  const topShadow: Pt[] = [];
  const botFiber: Pt[] = [];
  const botBody: Pt[] = [];
  const botShadow: Pt[] = [];

  for (let i = 0; i < count; i++) {
    const x = -M + i * step;
    const y =
      H / 2 +
      tilt * (x - W / 2) +
      u *
        (34 * (noise(x / (300 * u), 1) - 0.5) +
          12 * (noise(x / (84 * u), 2) - 0.5) +
          5 * (noise(x / (22 * u), 3) - 0.5) +
          2.2 * (noise(x / (6 * u), 4) - 0.5));
    const behind = tip - x;
    const r = interpolate(behind, [0, 26 * u], [0, 1], CLAMP);
    const open =
      Math.min(OPEN_MAX, Math.max(0, behind) * 0.03) * r * (1 - part);
    const fwTop =
      u *
      (2.4 + 7 * noise(x / (58 * u), 7) ** 1.4 + 1.6 * noise(x / (7 * u), 8)) *
      r;
    const fwBot = u * (0.7 + 1.3 * noise(x / (34 * u), 9)) * r;

    const yt = y - open;
    const yb = y + open;
    topFiber.push([x, yt - 3 * u * (1 - r)]);
    topBody.push([x, yt - fwTop]);
    topShadow.push([x, yt]);
    botFiber.push([x, yb + 3 * u * (1 - r)]);
    botBody.push([x, yb + fwBot - 2.5 * u * (1 - r)]);
    botShadow.push([x, yb]);
  }

  const rot = -tilt * 0.45 * (180 / Math.PI) * part;
  const topT = `translate(${-10 * u * part} ${-D * part}) rotate(${rot} ${W / 2} ${H / 2})`;
  const botT = `translate(${8 * u * part} ${D * part}) rotate(${rot * 0.8} ${W / 2} ${H / 2})`;
  const farTop = -H * 1.5;
  const farBot = H * 2.5;

  const sOff = u * (1.5 + 6 * part);
  const sBlur = u * (2.2 + 5 * part);

  const push = interpolate(f, [0, PART_END + 40], [1, 1.035], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const drift = interpolate(f, [0, PART_END + 40], [0, 1], CLAMP);
  const cam = `translate(${W / 2} ${H / 2}) scale(${push}) translate(${-W / 2} ${-H / 2})`;

  const fs = Math.min(150 * u, (W * 0.78) / (Math.max(title.length, 1) * 0.47));
  const settle = interpolate(f, [PART_START, PART_END + 6], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const headScale = 1.045 - 0.045 * settle;
  const headY = H / 2 + 0.34 * fs + (1 - settle) * 6 * u;

  const userRegion = {
    filterUnits: "userSpaceOnUse" as const,
    x: -W,
    y: -H * 2,
    width: W * 3,
    height: H * 5,
  };

  return (
    <AbsoluteFill style={{ background: p.stage, overflow: "hidden" }}>
      <svg width={W} height={H} aria-hidden>
        <defs>
          <filter
            id={paperId}
            x="0"
            y="0"
            width="1"
            height="1"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.7"
              numOctaves={3}
              seed={21}
              result="tooth"
            />
            <feDiffuseLighting
              in="tooth"
              surfaceScale={1.2}
              lightingColor="#FFFFFF"
              result="lit"
            >
              <feDistantLight azimuth={235} elevation={58} />
            </feDiffuseLighting>
            <feComposite
              in="SourceGraphic"
              in2="lit"
              operator="arithmetic"
              k1={0.16}
              k2={0.88}
              result="paper"
            />
            <feComposite in="paper" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id={frayId} {...userRegion} colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.45 / u}
              numOctaves={2}
              seed={3}
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale={3.6 * u}
              xChannelSelector="R"
              yChannelSelector="G"
              result="frayed"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency={`${0.7 / u} ${0.06 / u}`}
              numOctaves={2}
              seed={5}
              result="strands"
            />
            <feColorMatrix
              in="strands"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.55 0 0 0 0.62"
              result="strandA"
            />
            <feComposite in="frayed" in2="strandA" operator="in" />
          </filter>
          <linearGradient
            id={inkId}
            gradientUnits="userSpaceOnUse"
            colorInterpolation="linearRGB"
            x1={W * (0.08 + 0.04 * drift)}
            y1={-H * 0.1}
            x2={W * (0.92 - 0.04 * drift)}
            y2={H * 1.1}
          >
            <stop offset="0" stopColor={FLUTED[0]} />
            <stop offset="0.4" stopColor={accent} />
            <stop offset="0.68" stopColor={FLUTED[1]} />
            <stop offset="1" stopColor={FLUTED[2]} />
          </linearGradient>
          <filter id={shTopId} {...userRegion}>
            <feGaussianBlur stdDeviation={sBlur} />
          </filter>
          <filter id={shBotId} {...userRegion}>
            <feGaussianBlur stdDeviation={sBlur * 0.6} />
          </filter>
        </defs>

        <g transform={cam}>
          <rect
            x={-W}
            y={-H}
            width={W * 3}
            height={H * 3}
            fill={p.stage}
            filter={`url(#${paperId})`}
          />
          <text
            x={W / 2}
            y={headY}
            fontFamily={display}
            fontWeight={500}
            fontSize={fs}
            letterSpacing={`${-0.035 * fs}px`}
            textAnchor="middle"
            fill={p.fg}
            transform={`translate(${W / 2} ${H / 2}) scale(${headScale}) translate(${-W / 2} ${-H / 2})`}
          >
            {title}
          </text>

          <g transform={topT}>
            <g transform={`translate(0 ${sOff})`} opacity={0.9}>
              <path
                d={piece(topShadow, farTop)}
                fill={p.shadow}
                filter={`url(#${shTopId})`}
              />
            </g>
          </g>
          <g transform={botT}>
            <g transform={`translate(0 ${-0.8 * u})`} opacity={0.55}>
              <path
                d={piece(botShadow, farBot)}
                fill={p.shadow}
                filter={`url(#${shBotId})`}
              />
            </g>
            <path
              d={piece(botFiber, farBot)}
              fill={p.fiber}
              filter={`url(#${frayId})`}
            />
            <path
              d={piece(botBody, farBot)}
              fill={`url(#${inkId})`}
              filter={`url(#${paperId})`}
            />
          </g>
          <g transform={topT}>
            <path
              d={piece(topFiber, farTop)}
              fill={p.fiber}
              filter={`url(#${frayId})`}
            />
            <path
              d={piece(topBody, farTop)}
              fill={`url(#${inkId})`}
              filter={`url(#${paperId})`}
            />
          </g>
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 80% at 30% 16%, ${p.light}, transparent 70%), radial-gradient(ellipse 90% 90% at 50% 50%, transparent 55%, ${p.vignette} 100%)`,
          pointerEvents: "none",
        }}
      />
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
