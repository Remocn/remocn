"use client";

import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont } from "@remotion/google-fonts/Onest";
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

const { fontFamily: sans } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/**
 * gradients.sh "fluted" palette: [#1d2a8f, #2f7bff, #ff7a3d, #ffe2c4]. It is
 * the ground of the closing statement shot (ribbed like fluted glass), the
 * product bar in the number shot and, on paper, the italic accent word.
 */
const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"] as const;
const flutedLinear = (deg: number) =>
  `linear-gradient(${deg}deg, ${FLUTED[0]} 0%, ${FLUTED[1]} 48%, ${FLUTED[2]} 86%, ${FLUTED[3]} 108%)`;

/* ------------------------------------------------------------------ */
/* Built-in placeholder shots: abstract compositions in one palette.   */
/* ------------------------------------------------------------------ */

type Tone = "dark" | "graphite" | "light" | "accent";
type Kind = "title" | "pane" | "number" | "statement";
interface SceneSpec {
  kind: Kind;
  tone: Tone;
}

function toRgb(color: string): [number, number, number] {
  if (color.startsWith("rgb")) {
    const [r, g, b] = color.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
    return [r, g, b];
  }
  const h = color.replace("#", "");
  const v =
    h.length === 3
      ? h
          .split("")
          .map((ch) => ch + ch)
          .join("")
      : h.slice(0, 6);
  const n = Number.parseInt(v, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, t: number) {
  const x = toRgb(a);
  const y = toRgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function tones(tone: Tone, accent: string) {
  if (tone === "light") {
    return {
      bg: "#F5F4F0",
      fg: "#121214",
      muted: "#6E6C67",
      hair: "rgba(18,18,20,0.10)",
      surface: "#FFFFFF",
      block: "#E8E5DE",
      light: "rgba(255,255,255,0.95)",
      shadow: "rgba(40,36,30,0.16)",
      dot: accent,
    };
  }
  if (tone === "accent") {
    return {
      // fluted glass: soft ribs over the palette, the warm end held back
      bg: `repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 2.6%, rgba(0,0,0,0.09) 5.4%, rgba(255,255,255,0.06) 5.7%), linear-gradient(118deg, ${FLUTED[0]} 0%, ${FLUTED[1]} 52%, ${FLUTED[2]} 94%, ${FLUTED[3]} 120%)`,
      fg: "#F7F7F5",
      muted: "rgba(247,247,245,0.86)",
      hair: "rgba(255,255,255,0.22)",
      surface: mix(FLUTED[1], "#0A0A0B", 0.32),
      block: "rgba(255,255,255,0.16)",
      light: "rgba(255,255,255,0.22)",
      shadow: "rgba(0,0,0,0.35)",
      dot: "#0A0A0B",
    };
  }
  const graphite = tone === "graphite";
  return {
    bg: graphite ? "#17171A" : "#0A0A0B",
    fg: "#F3F2EF",
    muted: graphite ? "#97969C" : "#8B8A90",
    hair: "rgba(255,255,255,0.10)",
    surface: graphite ? "#1F1F23" : "#141416",
    block: graphite ? "#2C2C31" : "#232326",
    light: graphite ? "rgba(255,255,255,0.075)" : "rgba(255,255,255,0.065)",
    shadow: "rgba(0,0,0,0.6)",
    dot: accent,
  };
}

type Colors = ReturnType<typeof tones>;
interface Ctx {
  W: number;
  H: number;
  u: number;
  c: Colors;
  accent: string;
}

/**
 * The remocn.dev logo as outlines: the R mark (0.76em, on the baseline) and
 * "emocn" in Manrope 600 at -0.025em, 100 units per em, baseline at y = 0.
 * Glyph contours overlap (m, n, the e's bar), so they fill nonzero.
 */
const LOGO_R =
  "M 0.01 -75.54 C 0.01 -75.02 0.2 -74.42 0.62 -73.66 C 2.78 -69.75 7.61 -66.29 12.28 -65.3 C 12.99 -65.15 13.12 -65.15 29.09 -65.09 C 43.06 -65.04 45.3 -65.02 46.03 -64.92 C 50.88 -64.29 54.46 -62.03 56.26 -58.45 C 58.41 -54.17 58.04 -47.64 55.42 -43.69 C 53.58 -40.93 50.76 -39.21 47.13 -38.64 C 46.88 -38.6 39.73 -38.17 31.25 -37.68 C 14.05 -36.7 15.3 -36.81 13.69 -36.15 C 11.26 -35.16 8.4 -33.15 6.03 -30.78 C 2.75 -27.5 0.74 -23.97 0.14 -20.45 C 0.07 -20.04 0.05 -17.62 0.02 -9.96 L 0 0 5.38 0 L 10.76 0 10.78 -8.41 C 10.81 -17.54 10.8 -17.23 11.22 -18.8 C 12.33 -22.99 15.77 -25.76 20.63 -26.4 C 21.07 -26.45 22.31 -26.47 24.66 -26.45 C 28.37 -26.42 28.73 -26.38 30.13 -25.93 C 32.04 -25.3 33.78 -24 35.11 -22.18 C 35.39 -21.79 39.26 -17.21 43.7 -11.99 C 48.14 -6.78 51.87 -2.39 51.99 -2.23 C 52.12 -2.08 52.36 -1.65 52.54 -1.3 C 52.94 -0.52 53.27 -0.19 53.81 -0.07 C 54.06 -0.02 56.02 0 60.21 -0.02 L 66.24 -0.04 57.07 -11.99 C 52.03 -18.57 47.84 -24.05 47.77 -24.17 C 47.19 -25.12 47.36 -26.45 48.17 -27.32 C 48.56 -27.74 48.89 -27.92 49.85 -28.24 C 54.44 -29.74 58.96 -32.63 62.25 -36.17 C 68.26 -42.64 70.23 -50.91 67.61 -58.77 C 64.87 -67.05 57.7 -73.72 49.61 -75.53 C 47.51 -75.99 49.86 -75.95 23.69 -75.98 L 0.01 -76 0.01 -75.54 Z";

const LOGO_EMOCN = [
  // e
  "M105.2 1.5L105.2 1.5Q97.1 1.5 91 -2Q85 -5.6 81.6 -11.9Q78.2 -18.2 78.2 -26.6L78.2 -26.6Q78.2 -35.4 81.5 -41.9Q84.9 -48.4 90.8 -52Q96.8 -55.5 104.7 -55.5L104.7 -55.5Q112.9 -55.5 118.7 -51.7Q124.5 -47.9 127.4 -40.8Q130.3 -33.8 129.7 -24.1L129.7 -24.1L119.2 -24.1L119.2 -27.9Q119.1 -37.3 115.6 -41.8Q112.2 -46.3 105.1 -46.3L105.1 -46.3Q97.2 -46.3 93.3 -41.3Q89.3 -36.4 89.3 -27L89.3 -27Q89.3 -18.1 93.3 -13.2Q97.2 -8.3 104.7 -8.3L104.7 -8.3Q109.6 -8.3 113.1 -10.6Q116.7 -12.8 118.7 -16.9L118.7 -16.9L128.9 -13.7Q125.8 -6.5 119.4 -2.5Q113 1.5 105.2 1.5ZM124.5 -24.1L85.9 -24.1L85.9 -32.2L124.5 -32.2L124.5 -24.1Z",
  // m
  "M212 0L201.6 0L201.6 -33.6Q201.6 -39.5 198.6 -42.8Q195.6 -46.1 190.7 -46.1L190.7 -46.1Q187.7 -46.1 185.2 -44.7Q182.8 -43.3 181.2 -40.6Q179.7 -37.9 179.7 -33.8L179.7 -33.8L174.7 -36.3Q174.6 -42 177.1 -46.3Q179.6 -50.6 183.9 -53Q188.3 -55.4 193.7 -55.4L193.7 -55.4Q202.4 -55.4 207.3 -50.1Q212.1 -44.9 212.1 -36.1L212.1 -36.1L212 0ZM147.3 0L136.8 0L136.8 -54L146.1 -54L146.1 -38.4L147.3 -38.4L147.3 0ZM179.7 0L169.2 0L169.3 -33.5Q169.3 -39.4 166.3 -42.7Q163.3 -46.1 158.3 -46.1L158.3 -46.1Q153.3 -46.1 150.3 -42.7Q147.3 -39.3 147.3 -33.8L147.3 -33.8L142.3 -37Q142.3 -42.3 144.8 -46.4Q147.4 -50.6 151.8 -53Q156.1 -55.4 161.6 -55.4L161.6 -55.4Q167.3 -55.4 171.4 -52.9Q175.4 -50.5 177.6 -46.2Q179.7 -41.8 179.7 -36.1L179.7 -36.1L179.7 0Z",
  // o
  "M245.3 1.5L245.3 1.5Q237.2 1.5 231.3 -2.1Q225.3 -5.8 222.1 -12.2Q218.9 -18.7 218.9 -27.1L218.9 -27.1Q218.9 -35.5 222.2 -41.9Q225.5 -48.4 231.4 -51.9Q237.4 -55.5 245.3 -55.5L245.3 -55.5Q253.4 -55.5 259.4 -51.9Q265.3 -48.2 268.6 -41.8Q271.8 -35.4 271.8 -27.1L271.8 -27.1Q271.8 -18.6 268.6 -12.2Q265.3 -5.8 259.3 -2.1Q253.4 1.5 245.3 1.5ZM245.3 -8.3L245.3 -8.3Q253.1 -8.3 256.9 -13.6Q260.8 -18.8 260.8 -27.1L260.8 -27.1Q260.8 -35.5 256.9 -40.6Q253 -45.7 245.3 -45.7L245.3 -45.7Q240.1 -45.7 236.7 -43.3Q233.3 -40.9 231.6 -36.7Q230 -32.6 230 -27.1L230 -27.1Q230 -18.6 233.9 -13.5Q237.8 -8.3 245.3 -8.3Z",
  // c
  "M303.4 1.5L303.4 1.5Q295.1 1.5 289.3 -2.2Q283.5 -5.9 280.5 -12.4Q277.4 -18.8 277.3 -27L277.3 -27Q277.4 -35.4 280.5 -41.8Q283.7 -48.2 289.5 -51.9Q295.4 -55.5 303.6 -55.5L303.6 -55.5Q312.4 -55.5 318.7 -51.1Q325 -46.7 327 -39.1L327 -39.1L316.6 -36.1Q315 -40.6 311.5 -43.1Q308 -45.7 303.4 -45.7L303.4 -45.7Q298.3 -45.7 295 -43.2Q291.7 -40.8 290.1 -36.6Q288.5 -32.4 288.4 -27L288.4 -27Q288.5 -18.7 292.3 -13.5Q296 -8.3 303.4 -8.3L303.4 -8.3Q308.5 -8.3 311.6 -10.7Q314.8 -13 316.4 -17.4L316.4 -17.4L327 -14.9Q324.3 -7 318.3 -2.7Q312.1 1.5 303.4 1.5Z",
  // n
  "M383.2 0L372.6 0L372.6 -26.6Q372.6 -29.7 372.1 -33Q371.6 -36.4 370.1 -39.2Q368.6 -42.1 365.9 -43.8Q363.3 -45.6 358.9 -45.6L358.9 -45.6Q356.1 -45.6 353.6 -44.6Q351.1 -43.7 349.3 -41.7Q347.4 -39.6 346.3 -36.3Q345.3 -32.9 345.3 -28.1L345.3 -28.1L338.8 -30.6Q338.8 -37.9 341.5 -43.5Q344.3 -49.2 349.4 -52.3Q354.6 -55.5 361.8 -55.5L361.8 -55.5Q367.4 -55.5 371.3 -53.7Q375.1 -51.9 377.4 -48.9Q379.8 -46 381.1 -42.6Q382.3 -39.1 382.8 -35.8Q383.2 -32.5 383.2 -30L383.2 -30L383.2 0ZM345.3 0L334.6 0L334.6 -54L344 -54L344 -38.4L345.3 -38.4L345.3 0Z",
];
/** Ink box of the outlined logo, in its own units; the R is `rW` wide. */
const LOGO = { x: 0, y: -76, w: 383.2, h: 77.5, rW: 70.23 } as const;

/** The whole logo in one fill (a colour or a `url(#gradient)`). */
function LogoPaths({ fill }: { fill: string }) {
  return (
    <g fill={fill}>
      <path d={LOGO_R} />
      {LOGO_EMOCN.map((d) => (
        <path key={d.slice(0, 16)} d={d} />
      ))}
    </g>
  );
}

/** The logo at a font size, ink box only (it sits on its own baseline). */
function Logo({ size, color }: { size: number; color: string }) {
  const k = size / 100;
  return (
    <svg
      width={LOGO.w * k}
      height={LOGO.h * k}
      viewBox={`${LOGO.x} ${LOGO.y} ${LOGO.w} ${LOGO.h}`}
      style={{ display: "block", flexShrink: 0, overflow: "visible" }}
      aria-hidden
    >
      <LogoPaths fill={color} />
    </svg>
  );
}

/** The R mark alone, `height` tall. */
function LogoR({ height, color }: { height: number; color: string }) {
  return (
    <svg
      width={(height * LOGO.rW) / -LOGO.y}
      height={height}
      viewBox={`0 ${LOGO.y} ${LOGO.rW} ${-LOGO.y}`}
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      <path d={LOGO_R} fill={color} />
    </svg>
  );
}

const box = (x: number, y: number, w: number, h: number) =>
  ({
    position: "absolute",
    left: x,
    top: y,
    width: w,
    height: h,
  }) as const;

const displayType = (size: number): React.CSSProperties => ({
  fontFamily: sans,
  fontWeight: 500,
  fontSize: size,
  letterSpacing: "-0.045em",
  lineHeight: 1,
  fontVariantNumeric: "tabular-nums",
});

function TitleBody({ x }: { x: Ctx }) {
  const { u, c } = x;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 18 * u,
      }}
    >
      <div
        style={{
          fontSize: 20 * u,
          fontWeight: 400,
          color: c.muted,
          letterSpacing: "0.01em",
        }}
      >
        Introducing
      </div>
      <div style={{ padding: `${10 * u}px 0 ${14 * u}px` }}>
        <Logo size={150 * u} color={c.fg} />
      </div>
      <div
        style={{ fontSize: 24 * u, color: c.muted, letterSpacing: "-0.015em" }}
      >
        Motion for the films you launch with.
      </div>
    </div>
  );
}

function PaneBody({ x }: { x: Ctx }) {
  const { W, H, u, c, accent } = x;
  const p = { x: 0.08 * W, y: 0.1 * H, w: 0.84 * W, h: 0.8 * H };
  const side = 0.27 * W;
  const insp = 0.765 * W;
  const bar = 0.075 * H;
  const lightPane = c.surface === "#FFFFFF";
  const tint = mix(accent, c.surface, lightPane ? 0.9 : 0.8);
  const canvas = { x: 0.335 * W, y: 0.2 * H, w: 0.36 * W, h: 0.36 * H };
  const rows = [0.62, 0.48, 0.7, 0.42, 0.56, 0.5];
  const tracks: [number, number][][] = [
    [
      [0.3, 0.42],
      [0.43, 0.62],
    ],
    [[0.34, 0.56]],
    [
      [0.29, 0.38],
      [0.39, 0.52],
      [0.53, 0.74],
    ],
  ];
  return (
    <>
      <div
        style={{
          ...box(p.x, p.y, p.w, p.h),
          background: c.surface,
          borderRadius: 16 * u,
          boxShadow: `0 0 0 1px ${c.hair}, 0 ${30 * u}px ${70 * u}px ${c.shadow}`,
        }}
      />
      <div style={{ ...box(p.x, p.y + bar, p.w, 1), background: c.hair }} />
      <div
        style={{
          position: "absolute",
          left: p.x + 22 * u,
          top: p.y,
          height: bar,
          display: "flex",
          alignItems: "center",
          gap: 9 * u,
        }}
      >
        <Logo size={17 * u} color={c.fg} />
        <div style={{ fontSize: 15 * u, color: c.muted, marginLeft: 6 * u }}>
          / Launch film
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          right: W - p.x - p.w + 18 * u,
          top: p.y + bar / 2 - 15 * u,
          height: 30 * u,
          padding: `0 ${14 * u}px`,
          borderRadius: 8 * u,
          background: accent,
          color: "#FFFFFF",
          fontSize: 14 * u,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
        }}
      >
        Render
      </div>
      <div
        style={{ ...box(side, p.y + bar, 1, p.h - bar), background: c.hair }}
      />
      <div
        style={{ ...box(insp, p.y + bar, 1, p.h - bar), background: c.hair }}
      />
      {rows.map((w, i) => {
        const y = p.y + bar + 26 * u + i * 0.062 * H;
        const on = i === 1;
        return (
          <div key={w}>
            {on ? (
              <div
                style={{
                  ...box(p.x + 12 * u, y - 10 * u, side - p.x - 24 * u, 34 * u),
                  background: tint,
                  borderRadius: 8 * u,
                }}
              />
            ) : null}
            <div
              style={{
                ...box(p.x + 24 * u, y, 14 * u, 14 * u),
                borderRadius: 4 * u,
                background: on ? accent : c.block,
              }}
            />
            <div
              style={{
                ...box(
                  p.x + 48 * u,
                  y + 3 * u,
                  (side - p.x - 80 * u) * w,
                  8 * u,
                ),
                borderRadius: 4 * u,
                background: on ? mix(accent, c.surface, 0.55) : c.block,
              }}
            />
          </div>
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const y = p.y + bar + 28 * u + i * 0.075 * H;
        return (
          <div key={i}>
            <div
              style={{
                ...box(insp + 20 * u, y, 0.04 * W, 7 * u),
                borderRadius: 4 * u,
                background: c.block,
              }}
            />
            <div
              style={{
                ...box(insp + 20 * u, y + 16 * u, 0.155 * W - 40 * u, 22 * u),
                borderRadius: 6 * u,
                boxShadow: `inset 0 0 0 1px ${c.hair}`,
              }}
            />
          </div>
        );
      })}
      <div
        style={{
          ...box(side, canvas.y + canvas.h + 0.07 * H, insp - side, 1),
          background: c.hair,
        }}
      />
      {tracks.map((clips, ti) =>
        clips.map(([a, b]) => (
          <div
            key={`${ti}-${a}`}
            style={{
              ...box(
                a * W,
                canvas.y + canvas.h + 0.1 * H + ti * 0.058 * H,
                (b - a) * W - 4 * u,
                0.042 * H,
              ),
              borderRadius: 6 * u,
              background: ti === 1 ? accent : c.block,
              opacity: ti === 1 ? 0.9 : 1,
            }}
          />
        )),
      )}
      <div
        style={{
          ...box(0.47 * W, canvas.y + canvas.h + 0.085 * H, 2 * u, 0.2 * H),
          background: c.fg,
          borderRadius: u,
        }}
      />
      <div
        style={{
          ...box(canvas.x, canvas.y, canvas.w, canvas.h),
          borderRadius: 10 * u,
          background: lightPane ? "#0A0A0B" : "#F5F4F0",
          boxShadow: `inset 0 0 0 1px ${c.hair}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 80% 90% at 30% 0%, ${lightPane ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.9)"}, transparent 70%)`,
          }}
        />
        <LogoR height={48 * u} color={lightPane ? "#F3F2EF" : "#121214"} />
      </div>
    </>
  );
}

function NumberBody({ x }: { x: Ctx }) {
  const { W, H, u, c } = x;
  const left = 0.08 * W;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left,
          top: 0.16 * H,
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
          fontSize: 19 * u,
          fontWeight: 500,
          color: c.muted,
        }}
      >
        <div
          style={{
            width: 9 * u,
            height: 9 * u,
            borderRadius: 9 * u,
            background: c.dot,
          }}
        />
        Median render time
      </div>
      <div
        style={{
          position: "absolute",
          left: left - 10 * u,
          top: 0.27 * H,
          ...displayType(250 * u),
          fontWeight: 400,
          letterSpacing: "-0.055em",
        }}
      >
        4.8×
      </div>
      <div
        style={{
          position: "absolute",
          left,
          top: 0.27 * H + 268 * u,
          width: 0.4 * W,
          fontSize: 28 * u,
          lineHeight: 1.25,
          color: c.muted,
          letterSpacing: "-0.015em",
          textWrap: "balance",
        }}
      >
        faster from script to final cut
      </div>
      {[
        { label: "Before", w: 1, color: c.block },
        { label: "With remocn", w: 1 / 4.8, color: flutedLinear(90) },
      ].map((row, i) => (
        <div
          key={row.label}
          style={{
            position: "absolute",
            left: 0.58 * W,
            top: 0.4 * H + i * 0.13 * H,
          }}
        >
          <div
            style={{ fontSize: 18 * u, color: c.muted, marginBottom: 12 * u }}
          >
            {row.label}
          </div>
          <div
            style={{
              width: 0.32 * W * row.w,
              height: 20 * u,
              borderRadius: 10 * u,
              background: row.color,
              boxShadow: row.color.startsWith("linear")
                ? undefined
                : `inset 0 0 0 1px ${c.hair}`,
            }}
          />
        </div>
      ))}
    </>
  );
}

function StatementBody({ x }: { x: Ctx }) {
  const { W, H, u, c } = x;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0.08 * W,
          top: 0.1 * H,
          display: "flex",
          alignItems: "center",
          gap: 10 * u,
        }}
      >
        <Logo size={24 * u} color={c.fg} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0.08 * W,
          right: 0.08 * W,
          top: 0.36 * H,
          ...displayType(118 * u),
          lineHeight: 1.02,
          textWrap: "balance",
        }}
      >
        Every frame,{" "}
        <span
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontWeight: 400,
            letterSpacing: "-0.01em",
            ...(c.bg === "#F5F4F0"
              ? {
                  backgroundImage: flutedLinear(100),
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  paddingRight: "0.08em",
                }
              : null),
          }}
        >
          yours.
        </span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0.08 * W,
          bottom: 0.1 * H,
          fontSize: 20 * u,
          color: c.muted,
        }}
      >
        Copy it in. Change anything.
      </div>
      <div
        style={{
          position: "absolute",
          right: 0.08 * W,
          bottom: 0.1 * H,
          fontSize: 20 * u,
          color: c.muted,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        remocn.dev
      </div>
    </>
  );
}

const BODIES: Record<Kind, (p: { x: Ctx }) => React.ReactElement> = {
  title: TitleBody,
  pane: PaneBody,
  number: NumberBody,
  statement: StatementBody,
};

const LIGHT_AT: Record<Kind, string> = {
  title: "22% 6%",
  pane: "50% -10%",
  number: "86% 12%",
  statement: "78% 100%",
};

/** One full-frame placeholder shot. */
function PlaceholderScene({
  kind,
  tone,
  accent,
}: SceneSpec & { accent: string }) {
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const c = tones(tone, accent);
  const Body = BODIES[kind];
  return (
    <AbsoluteFill
      style={{
        background: c.bg,
        color: c.fg,
        fontFamily: sans,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 75% 85% at ${LIGHT_AT[kind]}, ${c.light}, transparent 72%)`,
        }}
      />
      <Body x={{ W, H, u, c, accent }} />
    </AbsoluteFill>
  );
}

function ImageScene({ src }: { src: string }) {
  return (
    <AbsoluteFill style={{ background: "#0A0A0B" }}>
      <Img
        src={src}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </AbsoluteFill>
  );
}

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

/** Resolves `scenes` / `from`+`to` / `images` / placeholders into a shot list. */
function useShots({
  scenes,
  from,
  to,
  images,
  fallback,
  accent,
}: {
  scenes?: React.ReactNode[];
  from?: React.ReactNode;
  to?: React.ReactNode;
  images?: string[];
  fallback: SceneSpec[];
  accent: string;
}): React.ReactNode[] {
  if (scenes && scenes.length >= 2) return scenes;
  if (from !== undefined || to !== undefined) {
    return [
      from ?? <PlaceholderScene {...fallback[0]} accent={accent} />,
      to ?? <PlaceholderScene {...fallback[1]} accent={accent} />,
    ];
  }
  if (images && images.length >= 2) {
    return images.map((src) => <ImageScene key={src} src={src} />);
  }
  return fallback.map((s) => (
    <PlaceholderScene key={`${s.kind}-${s.tone}`} {...s} accent={accent} />
  ));
}

/**
 * Splits the timeline into hold → cut → hold → cut … and returns which cut is
 * active (or the last one finished) plus its local frame.
 */
function cutClock(t: number, cuts: number, hold: number, length: number) {
  const k = Math.max(
    0,
    Math.min(cuts - 1, Math.floor((t - hold) / (hold + length))),
  );
  const local = t - hold - k * (hold + length);
  return { k, local };
}

/* ------------------------------------------------------------------ */
/* Flash sweep                                                         */
/* ------------------------------------------------------------------ */

export interface FlashSweepProps {
  /** Outgoing shot. */
  from?: React.ReactNode;
  /** Incoming shot. */
  to?: React.ReactNode;
  /** A chain of shots; every neighbouring pair gets one sweep. Wins over `from`/`to`. */
  scenes?: React.ReactNode[];
  /** Screenshots, used when no React shots are passed. */
  images?: string[];
  /** `light` burns through to white, `dark` passes a shadow over light shots. Follows `theme` by default. */
  variant?: "light" | "dark";
  /** Tilt of the band from vertical, in degrees. */
  angle?: number;
  /** Which way the band travels. */
  direction?: "right" | "left";
  /** Frames the band takes to cross the frame (8–14 reads best). */
  duration?: number;
  /** Frames each shot holds before the next sweep. */
  hold?: number;
  /** Colour of the light; defaults to a warm white (or near-black for `dark`). */
  tint?: string;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

/** Frames the incoming shot keeps settling after the peak. */
const SETTLE = 20;
/** Frames the exposure takes to fall back after the peak. */
const BLOOM = 8;
const EASE_IN = Easing.bezier(0.55, 0, 1, 0.45);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_PASS = Easing.bezier(0.42, 0, 0.58, 1);

const DARK_SET: SceneSpec[] = [
  { kind: "title", tone: "dark" },
  { kind: "pane", tone: "graphite" },
  { kind: "number", tone: "dark" },
  { kind: "statement", tone: "accent" },
];
const LIGHT_SET: SceneSpec[] = [
  { kind: "statement", tone: "light" },
  { kind: "pane", tone: "light" },
  { kind: "number", tone: "light" },
];

function rgba(color: string, a: number) {
  const [r, g, b] = toRgb(color);
  return `rgba(${r},${g},${b},${a})`;
}

/** A soft band profile: wide shoulders, a bright core. */
function bandGradient(color: string, strength: number) {
  const stops: [number, number][] = [
    [0, 0],
    [18, 0.06],
    [32, 0.28],
    [42, 0.72],
    [48, 0.96],
    [50, 1],
    [52, 0.96],
    [58, 0.72],
    [68, 0.28],
    [82, 0.06],
    [100, 0],
  ];
  return `linear-gradient(90deg, ${stops
    .map(([at, a]) => `${rgba(color, a * strength)} ${at}%`)
    .join(", ")})`;
}

export function FlashSweep({
  from,
  to,
  scenes,
  images,
  variant,
  angle = 22,
  direction = "right",
  duration = 12,
  hold = 30,
  tint,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: FlashSweepProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const mode = variant ?? (theme === "light" ? "dark" : "light");
  const light = mode === "light";
  const color = tint ?? (light ? "#FFFCF4" : "#0B0B0D");
  const D = Math.max(6, duration);
  const shots = useShots({
    scenes,
    from,
    to,
    images,
    fallback: theme === "light" ? LIGHT_SET : DARK_SET,
    accent,
  });
  const cuts = shots.length - 1;
  const { k, local } = cutClock(t, cuts, hold, D);
  const peak = D / 2;
  const swapped = local >= peak;
  const j = swapped ? k + 1 : k;

  // Exposure: climbs into the peak, holds one frame of full cover, falls fast.
  const exposure = swapped
    ? 1 - EASE_OUT(interpolate(local, [peak, peak + BLOOM], [0, 1], CLAMP))
    : EASE_IN(interpolate(local, [peak * 0.2, peak], [0, 1], CLAMP));
  const cover = swapped
    ? interpolate(local, [peak, peak + 2.2], [1, 0], CLAMP)
    : interpolate(local, [peak - 1.6, peak], [0, 1], CLAMP);

  // Camera: push into the outgoing shot, the incoming one lands from a touch closer.
  const push = swapped
    ? 1 +
      0.05 *
        (1 - EASE_OUT(interpolate(local, [peak, peak + SETTLE], [0, 1], CLAMP)))
    : 1 + 0.045 * EASE_IN(interpolate(local, [0, peak], [0, 1], CLAMP));
  // Slow drift across a shot's whole life, so holds are never frozen.
  const born = j === 0 ? -hold : hold + (j - 1) * (hold + D) + peak;
  const drift =
    1 + 0.02 * interpolate(t - born, [0, hold * 2 + D], [0, 1], CLAMP);

  // Band travel along the sweep axis, measured from the frame centre.
  const rad = (angle * Math.PI) / 180;
  const reach = (W * Math.cos(rad) + H * Math.sin(Math.abs(rad))) / 2;
  const bandW = Math.max(W, H) * 1.5;
  const sweep = EASE_PASS(
    interpolate(local, [-D * 0.15, D * 1.15], [0, 1], CLAMP),
  );
  const sgn = direction === "left" ? -1 : 1;
  const travel = (lead: number) =>
    sgn * (-(reach + bandW / 2) + (2 * reach + bandW) * sweep) * lead;
  const inSweep = local > -D * 0.15 && local < D * 1.15;

  const sceneFilter = light
    ? `brightness(${1 + 0.7 * exposure}) saturate(${1 - 0.3 * exposure})`
    : `brightness(${1 - 0.5 * exposure}) contrast(${1 + 0.1 * exposure})`;
  const bloomBlur = 18 * u;

  const band = (offset: number, w: number, strength: number, lead = 1) => {
    const x = travel(lead) + offset * sgn;
    return (
      <div
        style={{
          position: "absolute",
          left: W / 2 - w / 2,
          top: H / 2 - H * 1.5,
          width: w,
          height: H * 3,
          transform: `translateX(${x}px) rotate(${sgn * angle}deg)`,
          background: bandGradient(color, strength),
          mixBlendMode: light ? "plus-lighter" : "multiply",
        }}
      />
    );
  };

  return (
    <AbsoluteFill
      style={{ background: light ? "#0A0A0B" : "#F5F4F0", overflow: "hidden" }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${push * drift})`,
          filter: inSweep || exposure > 0.001 ? sceneFilter : undefined,
        }}
      >
        {shots[j]}
      </AbsoluteFill>
      {light && exposure > 0.01 ? (
        <AbsoluteFill
          style={{
            transform: `scale(${push * drift})`,
            filter: `blur(${bloomBlur}px) brightness(1.6)`,
            mixBlendMode: "screen",
            opacity: 0.85 * exposure,
          }}
        >
          {shots[j]}
        </AbsoluteFill>
      ) : null}
      {inSweep ? (
        <AbsoluteFill>
          {band(0, bandW, 1)}
          {/* Glass: thin reflections riding with the band at their own pace.
              A shadow has no specular, so the dark pass gets one soft echo. */}
          {light ? band(-0.32 * W, 26 * u, 0.55, 1.08) : null}
          {light
            ? band(0.3 * W, 70 * u, 0.3, 0.94)
            : band(-0.34 * W, 220 * u, 0.3, 1.06)}
        </AbsoluteFill>
      ) : null}
      {cover > 0 ? (
        <AbsoluteFill
          style={{
            opacity: cover,
            background: light
              ? `radial-gradient(ellipse 85% 85% at ${50 - sgn * 12}% 40%, ${color}, ${mix(color, "#D9D5CC", 0.35)} 100%)`
              : `radial-gradient(ellipse 85% 85% at ${50 - sgn * 12}% 40%, ${mix(color, "#2A2A2E", 0.5)}, ${color} 100%)`,
          }}
        />
      ) : null}
      <Grain opacity={theme === "light" ? 0.04 : 0.055} />
    </AbsoluteFill>
  );
}
