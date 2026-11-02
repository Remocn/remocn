"use client";

import { loadFont as loadDisplay } from "@remotion/google-fonts/Fraunces";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: display } = loadDisplay("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface FlutedGlassProps {
  title?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// gradients.sh "fluted" palette: bg #050507, [#1d2a8f, #2f7bff, #ff7a3d, #ffe2c4].
// It fills the disc only, so the flutes have colour to refract.
const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"] as const;

const THEMES = {
  dark: {
    bg: "#050507",
    fg: "#F3F2EF",
    tint: "rgba(255,255,255,0.025)",
    ridge: "rgba(255,255,255,0.13)",
    spec: "rgba(255,255,255,0.2)",
    valley: "rgba(0,0,0,0.42)",
    sheen: "rgba(255,255,255,0.05)",
    edge: "rgba(255,255,255,0.55)",
    contact: "rgba(0,0,0,0.5)",
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    tint: "rgba(255,255,255,0.22)",
    ridge: "rgba(255,255,255,0.75)",
    spec: "rgba(255,255,255,0.9)",
    valley: "rgba(70,62,48,0.2)",
    sheen: "rgba(255,255,255,0.3)",
    edge: "rgba(255,255,255,1)",
    contact: "rgba(70,62,48,0.2)",
    grain: 0.045,
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

// Rough Fraunces 400 advances, only used to pick a font size that fits;
// the row itself is laid out by flexbox so the estimate never shifts it.
function textWidth(s: string, size: number) {
  let w = 0;
  for (const ch of s) {
    if (ch === " ") w += 0.25;
    else if ("iljtfr,.;:!'|".includes(ch)) w += 0.32;
    else if ("mwMW".includes(ch)) w += 0.86;
    else if (ch >= "A" && ch <= "Z") w += 0.68;
    else if (ch >= "0" && ch <= "9") w += 0.6;
    else w += 0.54;
    w -= 0.025;
  }
  return w * size;
}

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
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
          seed={21}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface Layout {
  u: number;
  size: number;
  disc: number;
  gap: number;
}

function useLayout(title: string): Layout {
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const disc = height * 0.42;
  const gap = 60 * u;
  const room = width * 0.84 - disc - gap;
  const size = Math.min(170 * u, room / Math.max(textWidth(title, 1), 0.1));
  return { u, size, disc, gap };
}

function Backdrop({
  t,
  title,
  accent,
  p,
  L,
}: {
  t: number;
  title: string;
  accent: string;
  p: Palette;
  L: Layout;
}) {
  const { width, height } = useVideoConfig();
  const drift = EASE_IO(interpolate(t, [0, 62], [0, 1], CLAMP));
  const ox = -width * 0.34 * (1 - drift);
  const oy = Math.sin(drift * Math.PI) * -46 * L.u;
  const angle = 168 + 10 * Math.sin(t / 44);
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width,
        height,
        background: p.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          flex: "none",
          width: L.disc,
          height: L.disc,
          marginRight: L.gap,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${ox}px, ${oy}px)`,
            borderRadius: "50%",
            background: `linear-gradient(${angle}deg, ${FLUTED[3]} 2%, ${FLUTED[2]} 30%, color-mix(in oklab, ${FLUTED[2]} 35%, ${FLUTED[1]}) 50%, ${FLUTED[1]} 70%, ${FLUTED[0]} 100%)`,
            boxShadow: `inset 0 0 0 ${1 * L.u}px color-mix(in oklab, ${accent} 30%, transparent)`,
          }}
        />
      </div>
      <div
        style={{
          flex: "none",
          fontFamily: display,
          fontWeight: 400,
          fontSize: L.size,
          letterSpacing: "-0.035em",
          lineHeight: 1,
          color: p.fg,
          whiteSpace: "pre",
          paddingBottom: L.size * 0.06,
        }}
      >
        {title}
      </div>
    </div>
  );
}

export function FlutedGlass({
  title = "In focus.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: FlutedGlassProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const p = THEMES[theme];
  const L = useLayout(title);
  const { u } = L;

  const fw = 26 * u;
  const lens = 0.3;
  const travel = width + 90 * u;
  const slideAt = (f: number) =>
    EASE_IO(interpolate(f, [66, 112], [0, 1], CLAMP)) * travel;
  const gx = slideAt(t);
  const vel = (gx - slideAt(t - 1)) / u;
  const smear = interpolate(vel, [8, 40], [0, 5], CLAMP) * u;

  const flutes: number[] = [];
  for (let i = 0; gx + i * fw < width; i++) flutes.push(i);

  const scene = { t, title, accent, p, L };

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <Backdrop {...scene} />
      {gx < width ? (
        <div
          style={{
            position: "absolute",
            left: gx,
            top: 0,
            width: width + fw,
            height,
            boxShadow: `${-18 * u}px 0 ${40 * u}px ${-6 * u}px ${p.contact}`,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: `blur(${1.4 * u + smear}px)`,
        }}
      >
        {flutes.map((i) => {
          const x0 = gx + i * fw;
          const wobble = (hash(i) - 0.5) * 3 * u;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x0,
                top: 0,
                width: fw + 0.6,
                height,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: -x0,
                  top: 0,
                  width,
                  height,
                  transform: `scaleX(${-lens})`,
                  transformOrigin: `${x0 + fw / 2 + wobble}px 50%`,
                }}
              >
                <Backdrop {...scene} />
              </div>
            </div>
          );
        })}
      </div>
      {gx < width ? (
        <div
          style={{
            position: "absolute",
            left: gx,
            top: 0,
            right: 0,
            bottom: 0,
            filter: smear > 0.3 ? `blur(${smear}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: p.tint,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `linear-gradient(90deg, ${p.ridge} 0, rgba(0,0,0,0) ${fw * 0.1}px, rgba(0,0,0,0) ${fw * 0.2}px, ${p.spec} ${fw * 0.27}px, rgba(0,0,0,0) ${fw * 0.4}px, rgba(0,0,0,0) ${fw * 0.62}px, ${p.valley} ${fw}px)`,
              backgroundSize: `${fw}px 100%`,
              opacity: 0.85,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, ${p.sheen}, rgba(0,0,0,0) 45%, rgba(0,0,0,0) 70%, ${p.sheen})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 7 * u,
              background: `linear-gradient(90deg, ${p.edge}, rgba(255,255,255,0.08) 45%, rgba(0,0,0,0) 100%)`,
              opacity: gx > 0 ? 1 : 0,
            }}
          />
        </div>
      ) : null}
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
