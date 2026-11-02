"use client";

import { loadFont } from "@remotion/google-fonts/Sora";
import type React from "react";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sora } = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

export interface BlockCityProps {
  /** Hero number, counted up on the accent block. */
  value?: number;
  prefix?: string;
  suffix?: string;
  /** Muted word after the number. */
  caption?: string;
  /** Optional dataset: one value per column, left to right (any scale). */
  data?: number[];
  accent?: string;
  /** Playback multiplier. */
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const RISE = Easing.bezier(0.3, 1.18, 0.5, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const COLS = 20;
const ROWS = 12;
const CELL = 52;
const FOOT = 37;

// camera keyframes: [frame, pitch°, yaw°, camX, camY, dolly, lens] (lengths in u).
// Fly low along the columns on a wide lens, then crane up and orbit to a long-lens
// front view where the skyline reads as a bar chart.
const CAM: [number, number, number, number, number, number, number][] = [
  [0, 76, -90, -150, 20, 260, 760],
  [112, 70, -76, 200, 60, -140, 900],
  [140, 69, -72, 220, 50, -170, 940],
  [210, 52, -20, 20, -110, -300, 1300],
];

const T_HERO = 112;
const T_LABEL = 178;

// gradients.sh "fluted" palette: bg #050507, [#1d2a8f, #2f7bff, #ff7a3d, #ffe2c4].
// It runs up the hero tower (deep blue at the street, warm at the roof) and tints the sky.
const FLUTED: RGB[] = [
  [29, 42, 143],
  [47, 123, 255],
  [255, 122, 61],
  [255, 226, 196],
];

const PALETTES = {
  dark: {
    bg: [6, 6, 9],
    haze: [22, 23, 30],
    top: [92, 92, 98],
    side: [38, 38, 43],
    ground: "#0E0E10",
    line: "rgba(255,255,255,0.05)",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    lead: "rgba(255,255,255,0.35)",
    sky: "rgba(47,123,255,0.10)",
    dusk: "rgba(29,42,143,0.32)",
    ring: "rgba(6,6,9,0.9)",
    spill: 0.2,
    grain: 0.06,
  },
  light: {
    bg: [245, 244, 240],
    haze: [240, 238, 233],
    top: [255, 255, 253],
    side: [228, 224, 216],
    ground: "#EEECE6",
    line: "rgba(18,18,20,0.06)",
    fg: "#121214",
    muted: "#6E6C67",
    lead: "rgba(18,18,20,0.3)",
    sky: "rgba(255,255,255,0.9)",
    dusk: "rgba(255,226,196,0.55)",
    ring: "rgba(245,244,240,0.9)",
    spill: 0.12,
    grain: 0.04,
  },
} as const;

type Palette = (typeof PALETTES)[keyof typeof PALETTES];
type RGB = readonly number[];

function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

const mix = (a: RGB, b: RGB, k: number): RGB => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k,
];
const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];
const css = (c: RGB) =>
  `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

/** Deterministic dataset: a rising trend across columns, a ripple across rows. */
function heightAt(c: number, r: number, data?: number[]) {
  const trend = data?.length
    ? (() => {
        const max = Math.max(...data);
        const v = data[Math.round((c / (COLS - 1)) * (data.length - 1))];
        return max > 0 ? v / max : 0;
      })()
    : 0.22 + 0.78 * (c / (COLS - 1)) ** 1.7;
  const ripple = 0.66 + 0.34 * Math.sin(r * 0.85 + c * 0.45);
  const noise = 0.85 + hash(c * 31 + r * 7) * 0.3;
  return 12 + 190 * trend * ripple * noise;
}

function camAt(t: number) {
  let i = 0;
  while (i < CAM.length - 2 && t > CAM[i + 1][0]) i++;
  const a = CAM[i];
  const b = CAM[i + 1];
  const k = interpolate(t, [a[0], b[0]], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const v = a.map((x, j) => x + (b[j] - x) * k);
  return {
    pitch: v[1],
    yaw: v[2],
    camX: v[3],
    camY: v[4],
    dolly: v[5],
    lens: v[6],
  };
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
          seed={31}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

const face: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  transformOrigin: "0 0",
};

export function BlockCity({
  value = 340,
  prefix = "+",
  suffix = "%",
  caption = "renders",
  data,
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: BlockCityProps) {
  const t = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const u = height / 720;
  const pal: Palette = PALETTES[theme];

  const cam = camAt(t);
  const persp = cam.lens * u;
  const rad = Math.PI / 180;
  const cp = Math.cos(cam.pitch * rad);
  const sp = Math.sin(cam.pitch * rad);
  const cyw = Math.cos(cam.yaw * rad);
  const syw = Math.sin(cam.yaw * rad);

  // the same transform chain as the CSS camera, for fog and the 2D label
  const project = (x: number, y: number, z: number) => {
    const px = x - cam.camX * u;
    const py = y - cam.camY * u;
    const rx = px * cyw - py * syw;
    const ry = px * syw + py * cyw;
    const y2 = ry * cp - z * sp;
    const z2 = ry * sp + z * cp + cam.dolly * u;
    const s = persp / (persp - z2);
    return { x: width / 2 + rx * s, y: height / 2 + y2 * s, z: z2 };
  };

  const heroC = COLS - 3;
  const heroR = ROWS - 3;
  const tallest = Math.max(
    ...Array.from({ length: COLS * ROWS }, (_, n) =>
      heightAt(n % COLS, Math.floor(n / COLS), data),
    ),
  );
  const heroH = tallest * 1.95 * u;

  // the rise wave travels from the near rows to the far rows with the camera
  const wave = interpolate(t, [0, 112], [5, COLS + 3], CLAMP);
  const heroP = interpolate(t, [T_HERO, T_HERO + 26], [0, 1], {
    ...CLAMP,
    easing: RISE,
  });
  const heroTint = interpolate(t, [T_HERO - 4, T_HERO + 12], [0, 1], CLAMP);

  const blocks: React.ReactNode[] = [];
  const s = FOOT * u;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const bx = (c - (COLS - 1) / 2) * CELL * u;
      const by = (r - (ROWS - 1) / 2) * CELL * u;
      const target = heightAt(c, r, data) * u;
      const lead = (wave - c + 2.6 - hash(c * 5 + r * 3) * 0.9) / 2.6;
      const rise = RISE(Math.max(0, Math.min(1, lead)));
      const isHero = c === heroC && r === heroR;
      let h = Math.max(2 * u, target * rise);
      if (isHero) h = h + (heroH - target) * heroP;

      // fog by distance past the point the camera looks at; cull what is behind the lens
      const pc = project(bx, by, h * 0.5);
      if (pc.z > persp * 0.86 || pc.y > height * 2) continue;
      const beyond = persp - pc.z - (persp - cam.dolly * u);
      const fog = interpolate(beyond, [-200 * u, 950 * u], [0, 0.88], CLAMP);
      // the hero tower throws warm light on its neighbours
      const near = (c - heroC) ** 2 + (r - heroR) ** 2;
      const spill = isHero ? 0 : heroTint * pal.spill * Math.exp(-near / 5);
      const baseTop: RGB = isHero
        ? mix(pal.top, FLUTED[3], heroTint)
        : mix(pal.top, FLUTED[2], spill);
      const baseSide: RGB = mix(pal.side, FLUTED[2], spill * 0.8);
      const bg = pal.haze;
      const top = css(mix(baseTop, bg, fog));
      const sideLit = mix(shade(baseSide, 1.08), bg, fog);
      const sideFront = mix(shade(baseSide, 0.9), bg, fog);
      const sideDark = mix(shade(baseSide, 0.72), bg, fog);
      // hero: the fluted gradient runs from the street (top of the face div) to the roof
      const heroFace = (k: number) => {
        const stops = FLUTED.map((c) =>
          css(mix(mix(shade(pal.side, k), shade(c, k), heroTint), bg, fog)),
        );
        return `linear-gradient(180deg, ${stops[0]} 0%, ${stops[1]} 38%, ${stops[2]} 78%, ${stops[3]} 100%)`;
      };
      const ao = (c3: RGB) =>
        `linear-gradient(180deg, ${css(mix(shade(c3, 0.72), bg, fog * 0.6))} 0%, ${css(c3)} ${Math.min(100, (40 * u * 100) / Math.max(h, 1))}%, ${css(c3)} 100%)`;

      blocks.push(
        <div
          key={`${c}-${r}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformStyle: "preserve-3d",
            transform: `translate3d(${bx}px, ${by}px, 0px)`,
          }}
        >
          {/* left (-x) */}
          <div
            style={{
              ...face,
              width: s,
              height: h,
              background: isHero ? heroFace(1.04) : ao(sideLit),
              transform: `translate3d(${-s / 2}px, ${-s / 2}px, 0px) rotateZ(90deg) rotateX(90deg)`,
            }}
          />
          {/* right (+x) */}
          <div
            style={{
              ...face,
              width: s,
              height: h,
              background: isHero ? heroFace(0.7) : ao(sideDark),
              transform: `translate3d(${s / 2}px, ${-s / 2}px, 0px) rotateZ(90deg) rotateX(90deg)`,
            }}
          />
          {/* front (+y) */}
          <div
            style={{
              ...face,
              width: s,
              height: h,
              background: isHero ? heroFace(0.88) : ao(sideFront),
              transform: `translate3d(${-s / 2}px, ${s / 2}px, 0px) rotateX(90deg)`,
            }}
          />
          {/* top */}
          <div
            style={{
              ...face,
              width: s,
              height: s,
              background: top,
              boxShadow: `inset 0 0 0 ${Math.max(0.6, 0.8 * u)}px ${css(mix(shade(baseTop, theme === "dark" ? 1.25 : 0.97), bg, fog))}`,
              transform: `translate3d(${-s / 2}px, ${-s / 2}px, ${h}px)`,
            }}
          />
        </div>,
      );
    }
  }

  const groundW = (COLS + 8) * CELL * u;
  const groundH = (ROWS + 8) * CELL * u;

  // hero label, placed in 2D from the projected roof of the hero block
  const heroX = (heroC - (COLS - 1) / 2) * CELL * u;
  const heroY = (heroR - (ROWS - 1) / 2) * CELL * u;
  const heroBase = heightAt(heroC, heroR, data) * u;
  const roof = project(heroX, heroY, heroBase + (heroH - heroBase) * heroP);
  const labelP = interpolate(t, [T_LABEL, T_LABEL + 22], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const count = interpolate(t, [T_LABEL, T_LABEL + 40], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const shown = Math.round(value * count);
  const leadLen = 40 * u;

  const fogTop = interpolate(cam.pitch, [54, 72], [0.18, 0.42]);

  return (
    <AbsoluteFill style={{ background: css(pal.bg), overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 18%, ${pal.sky}, transparent 70%), radial-gradient(ellipse 110% 46% at ${50 + Math.sin(t / 60) * 3}% 0%, ${pal.dusk}, transparent 72%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          perspective: persp,
          perspectiveOrigin: "50% 50%",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: width / 2,
            top: height / 2,
            width: 0,
            height: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(${cam.dolly * u}px) rotateX(${cam.pitch}deg) rotateZ(${cam.yaw}deg) translate3d(${-cam.camX * u}px, ${-cam.camY * u}px, 0px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -groundW / 2,
              top: -groundH / 2,
              width: groundW,
              height: groundH,
              background: `repeating-linear-gradient(90deg, ${pal.line} 0 ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px ${CELL * u}px), repeating-linear-gradient(0deg, ${pal.line} 0 ${Math.max(1, u)}px, transparent ${Math.max(1, u)}px ${CELL * u}px), radial-gradient(closest-side, ${pal.ground}, ${css(pal.bg)})`,
              backgroundPosition: `${(CELL / 2 + 4) * u}px ${(CELL / 2 + 4) * u}px, ${(CELL / 2 + 4) * u}px ${(CELL / 2 + 4) * u}px, 0 0`,
              transform: "translateZ(-1px)",
            }}
          />
          {blocks}
        </div>
      </div>

      {/* atmospheric haze toward the horizon */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${css(pal.bg)} 0%, rgba(${pal.haze.join(",")},${fogTop}) 24%, rgba(${pal.haze.join(",")},0) 50%)`,
        }}
      />

      {/* hero label: a roof marker, a short leader, the number to its left */}
      <div
        style={{
          position: "absolute",
          left: roof.x,
          top: roof.y,
          width: 0,
          height: 0,
          opacity: labelP,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -3.5 * u,
            top: -3.5 * u,
            width: 7 * u,
            height: 7 * u,
            borderRadius: "50%",
            background: accent,
            boxShadow: `0 0 0 ${2 * u}px ${pal.ring}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 10 * u,
            top: -0.5 * u,
            width: leadLen,
            height: Math.max(1, u),
            background: pal.lead,
            transformOrigin: "100% 50%",
            transform: `scaleX(${labelP})`,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: leadLen + 22 * u,
            top: -30 * u,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 6 * u,
            whiteSpace: "nowrap",
            transform: `translateX(${(1 - labelP) * 14 * u}px)`,
          }}
        >
          <span
            style={{
              fontFamily: sora,
              fontWeight: 400,
              fontSize: 60 * u,
              letterSpacing: "-0.045em",
              lineHeight: 1,
              color: pal.fg,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {prefix}
            {shown}
            {suffix}
          </span>
          <span
            style={{
              fontFamily: sora,
              fontWeight: 300,
              fontSize: 18 * u,
              letterSpacing: "0.01em",
              color: pal.muted,
            }}
          >
            {caption}
          </span>
        </div>
      </div>

      <AbsoluteFill
        style={{
          background:
            theme === "dark"
              ? "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 60%, rgba(0,0,0,0.45) 100%)"
              : "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 65%, rgba(110,100,85,0.1) 100%)",
        }}
      />
      <Grain opacity={pal.grain} />
    </AbsoluteFill>
  );
}
