"use client";

import { loadFont } from "@remotion/google-fonts/BricolageGrotesque";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: bricolage } = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

/**
 * gradients.sh "radial-glow" palette: [#f3f1ff, #9db4ff, #5a46cb, #1d1240].
 * On dark it is a disc of light rising behind the object and catching its
 * faces; on paper it tints the stage under the numeral.
 */
const GLOW = ["#f3f1ff", "#9db4ff", "#5a46cb", "#1d1240"] as const;

export interface VersionHeroProps {
  /** The release number, rendered as the extruded object. */
  version?: string;
  /** Product name in the label under the numeral. */
  name?: string;
  /** Second half of the label. */
  label?: string;
  /** Replaces the label's name: by default the remocn logo when `name` is "remocn". */
  logo?: React.ReactNode;
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  /** Dark = brushed aluminium; light = matte paper stock. */
  theme?: "dark" | "light";
}

const SLICES = 10;
const SUB = 4;

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

/** Horizontal streak noise: brushed metal grain. Low x frequency, high y. */
const BRUSHED = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'><filter id='b'><feTurbulence type='fractalNoise' baseFrequency='0.003 0.75' numOctaves='2' seed='4' stitchTiles='stitch'/><feColorMatrix values='1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 0.2'/></filter><rect width='600' height='300' filter='url(%23b)'/></svg>")`;
/** Isotropic fibre noise: matte paper tooth. */
const PAPER = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' seed='9' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.33  0 0 0 0 0.3  0 0 0 0.22 0'/></filter><rect width='240' height='240' filter='url(%23p)'/></svg>")`;

const MATERIALS = {
  dark: {
    bg: "#050508",
    stageLight: "rgba(255,255,255,0.05)",
    /** Strength of the rising disc, and of its tint on the faces. */
    glow: 1,
    glowTint: 0.32,
    /** How much the inside of the disc fills with violet. */
    disc: 1,
    /** The rim of the disc, inside → out. */
    ring: [GLOW[0], GLOW[1], GLOW[2]],
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.18)",
    faceBase:
      "linear-gradient(180deg, #C4C7CD 0%, #A9ADB4 30%, #8D9199 52%, #9FA3AA 74%, #6E727A 100%)",
    faceTexture: BRUSHED,
    faceTextureSize: "600px 300px",
    plate: "#7D8088",
    side: [
      [0x5c, 0x5e, 0x65],
      [0x26, 0x27, 0x2b],
    ],
    sideFloor: [0x0d, 0x0d, 0x0f],
    spec: 0.9,
    specSide: 0.35,
    bevel: "rgba(255,255,255,0.75)",
    shadow: "rgba(0,0,0,0.85)",
    grain: 0.07,
  },
  light: {
    bg: "#F5F4F0",
    stageLight: "rgba(255,255,255,0.9)",
    glow: 0.8,
    glowTint: 0.16,
    disc: 0,
    ring: [GLOW[1], GLOW[2], GLOW[1]],
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    faceBase: "linear-gradient(180deg, #FFFFFF 0%, #F8F7F3 45%, #EDEBE5 100%)",
    faceTexture: PAPER,
    faceTextureSize: "240px 240px",
    plate: "#E4E1DA",
    side: [
      [0xd6, 0xd2, 0xc8],
      [0xb3, 0xae, 0xa2],
    ],
    sideFloor: [0x8f, 0x8a, 0x7f],
    spec: 0.55,
    specSide: 0.25,
    bevel: "rgba(255,255,255,1)",
    shadow: "rgba(60,52,40,0.32)",
    grain: 0.045,
  },
} as const;

type Material = (typeof MATERIALS)[keyof typeof MATERIALS];

function mix(a: readonly number[], b: readonly number[], t: number) {
  const c = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/** A soft diagonal band of light at horizontal position `x` (0..1). */
function specBand(x: number, strength: number) {
  const c = x * 100;
  const a = `rgba(255,255,255,${strength})`;
  const h = `rgba(255,255,255,${strength * 0.28})`;
  return `linear-gradient(104deg, transparent ${c - 22}%, ${h} ${c - 9}%, ${a} ${c}%, ${h} ${c + 5}%, transparent ${c + 14}%)`;
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
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
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

/** The logo at a font size, sitting on the label's baseline. */
function Logo({ size, color }: { size: number; color: string }) {
  const k = size / 100;
  return (
    <svg
      width={LOGO.w * k}
      height={LOGO.h * k}
      viewBox={`${LOGO.x} ${LOGO.y} ${LOGO.w} ${LOGO.h}`}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <LogoPaths fill={color} />
    </svg>
  );
}

export function VersionHero({
  version = "2.0",
  name = "remocn",
  label = "Now available",
  logo,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: VersionHeroProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const m: Material = MATERIALS[theme];

  const chars = Array.from(version).length;
  const fontSize = Math.min(height * 0.7, (width * 0.6) / (chars * 0.5));
  const depth = fontSize * 0.2;
  const dz = depth / (SLICES * SUB);
  const spreadMax = fontSize * 0.42;
  const boxW = width;
  const boxH = fontSize * 1.2;
  const cy = height * 0.43;

  // camera: a slow eased orbit plus a gentle dolly-in
  const orbit = interpolate(t, [0, 150], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const rotY = -24 + orbit * 16;
  const rotX = 10 - orbit * 4;
  const dolly = interpolate(t, [0, 70], [-220 * u, 0], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  // specular sweep across the faces once the stack has docked
  const sweep = interpolate(t, [44, 92], [-0.3, 1.35], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const restSheen = interpolate(t, [44, 92], [0, 1], CLAMP);
  // the disc of light rises behind the object as it docks
  const glowP = interpolate(t, [20, 96], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const glowY = 136 - 16 * glowP;

  const sliceP = (k: number) =>
    interpolate(t, [4 + k * 2.2, 4 + k * 2.2 + 34], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const textStyle: React.CSSProperties = {
    position: "absolute",
    left: -boxW / 2,
    top: -boxH / 2,
    width: boxW,
    height: boxH,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: bricolage,
    fontWeight: 500,
    fontSize,
    lineHeight: 1,
    letterSpacing: "-0.05em",
    whiteSpace: "nowrap",
    color: "transparent",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    backfaceVisibility: "visible",
  };

  const layers: React.ReactNode[] = [];
  for (let k = SLICES - 1; k >= 0; k--) {
    const p = sliceP(k);
    const zSlice = -k * SUB * dz - k * spreadMax * (1 - p);
    const appear = interpolate(t, [-6 + k * 1.6, 8 + k * 1.6], [0, 1], CLAMP);
    const blur = ((k * spreadMax * (1 - p)) / (spreadMax * SLICES)) * 7 * u;
    const subs: React.ReactNode[] = [];
    for (let s = SUB - 1; s >= 0; s--) {
      const j = k * SUB + s;
      const isFace = j === 0;
      const depthT = j / (SLICES * SUB - 1);
      const top = mix(m.side[0], m.sideFloor, depthT * 0.55);
      const bottom = mix(m.side[1], m.sideFloor, depthT * 0.8);
      const sideSpec = specBand(sweep - depthT * 0.05, m.specSide);
      let background: string;
      if (isFace) {
        background = [
          specBand(sweep, m.spec),
          `linear-gradient(104deg, transparent 0%, rgba(255,255,255,${0.12 * restSheen}) 40%, transparent 75%)`,
          // the disc rising behind bounces up into the lower half of the face
          `linear-gradient(180deg, transparent 38%, color-mix(in oklab, ${GLOW[1]} ${Math.round(m.glowTint * 100 * glowP)}%, transparent) 78%, color-mix(in oklab, ${GLOW[2]} ${Math.round(m.glowTint * 100 * glowP)}%, transparent) 100%)`,
          m.faceTexture,
          m.faceBase,
        ].join(", ");
      } else if (s === 0) {
        // the leading face of each slice reads as a plate while spread out
        const plate = 1 - p;
        background = `linear-gradient(180deg, ${m.plate}${Math.round(
          plate * 255,
        )
          .toString(16)
          .padStart(2, "0")}, ${m.plate}${Math.round(plate * 200)
          .toString(16)
          .padStart(
            2,
            "0",
          )}), ${sideSpec}, linear-gradient(180deg, ${top}, ${bottom})`;
      } else {
        background = `${sideSpec}, linear-gradient(180deg, ${top}, ${bottom})`;
      }
      if (isFace) {
        // chamfer: a hairline of light just behind the face, nudged up-left
        subs.push(
          <div
            key="bevel"
            style={{
              ...textStyle,
              color: m.bevel,
              transform: `translate3d(${-0.8 * u}px, ${-1 * u}px, ${-dz * 0.5}px)`,
            }}
          >
            {version}
          </div>,
        );
      }
      subs.push(
        <div
          key={j}
          style={{
            ...textStyle,
            transform: `translateZ(${-s * dz}px)`,
            backgroundImage: background,
            backgroundSize: isFace
              ? `100% 100%, 100% 100%, 100% 100%, ${m.faceTextureSize}, 100% 100%`
              : undefined,
          }}
        >
          {version}
        </div>,
      );
    }
    layers.push(
      <div
        key={k}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformStyle: blur > 0.15 ? undefined : "preserve-3d",
          transform: `translateZ(${zSlice}px)`,
          opacity: appear,
          filter: blur > 0.15 ? `blur(${blur}px)` : undefined,
        }}
      >
        {subs}
      </div>,
    );
  }

  // label under the object
  const labelP = (d: number) =>
    interpolate(t, [62 + d, 86 + d], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const labelTop = cy + fontSize * 0.4 + 44 * u;

  const shadowO = interpolate(t, [10, 60], [0.35, 1], CLAMP);

  return (
    <AbsoluteFill style={{ background: m.bg, overflow: "hidden" }}>
      {/* overhead key light on the stage */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 55% 60% at 50% 30%, ${m.stageLight}, transparent 72%)`,
        }}
      />
      {/* radial-glow: a disc of light rising behind the numeral */}
      <AbsoluteFill
        style={{
          opacity: m.glow * glowP,
          background: [
            `radial-gradient(82% 100% at 50% ${glowY}%, transparent 53%, color-mix(in oklab, ${m.ring[0]} 85%, transparent) 56.5%, color-mix(in oklab, ${m.ring[1]} 50%, transparent) 60%, color-mix(in oklab, ${m.ring[2]} 22%, transparent) 66%, transparent 78%)`,
            `radial-gradient(82% 100% at 50% ${glowY}%, color-mix(in oklab, ${GLOW[2]} ${Math.round(70 * m.disc)}%, transparent) 0%, color-mix(in oklab, ${GLOW[3]} ${Math.round(60 * m.disc)}%, transparent) 40%, transparent 56%)`,
          ].join(", "),
        }}
      />
      {/* contact shadow */}
      <div
        style={{
          position: "absolute",
          left: width / 2 - fontSize * 0.95,
          top: cy + fontSize * 0.3,
          width: fontSize * 1.9,
          height: fontSize * 0.16,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${m.shadow}, transparent)`,
          filter: `blur(${14 * u}px)`,
          opacity: shadowO,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: 2000 * u,
          perspectiveOrigin: `50% ${(cy / height) * 100}%`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: width / 2,
            top: cy,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(${dolly}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {layers}
        </div>
      </div>

      {/* label */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: labelTop,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16 * u,
          fontFamily: bricolage,
          fontSize: 22 * u,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9 * u,
            opacity: labelP(0),
            transform: `translateY(${(1 - labelP(0)) * 14 * u}px)`,
          }}
        >
          {logo ??
            (name.trim().toLowerCase() === "remocn" ? (
              <Logo size={30 * u} color={m.fg} />
            ) : (
              <span
                style={{
                  color: m.fg,
                  fontWeight: 500,
                  letterSpacing: "-0.03em",
                  fontSize: 26 * u,
                }}
              >
                {name}
              </span>
            ))}
        </div>
        <div
          style={{
            width: Math.max(1, u),
            height: 22 * u,
            background: accent,
            transform: `scaleY(${labelP(3)})`,
          }}
        />
        <span
          style={{
            color: m.muted,
            fontWeight: 400,
            letterSpacing: "-0.01em",
            opacity: labelP(6),
            transform: `translateY(${(1 - labelP(6)) * 14 * u}px)`,
          }}
        >
          {label}
        </span>
      </div>

      <Grain opacity={m.grain} />
    </AbsoluteFill>
  );
}
