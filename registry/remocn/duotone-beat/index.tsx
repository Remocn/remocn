"use client";

import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/** [shadow ink, highlight ink], hex colors. */
export type DuotonePalette = [string, string];

export type DuotoneBeatProps = {
  /** Portrait image. Without it a head-and-shoulders silhouette is drawn. */
  src?: string;
  /** Ink pairs, one per beat, cycled. Hex colors only (they feed an SVG LUT). */
  palettes?: DuotonePalette[];
  /** Frames per beat at 30fps. Ignored when `bpm` is set. */
  beatFrames?: number;
  bpm?: number;
  /** Beats per bar; the first beat of each bar gets the bigger punch-in. */
  beatsPerBar?: number;
  /** Scale added on the downbeat. Off-beats get a third of it. */
  punch?: number;
  showIndicator?: boolean;
  /** Halftone dot pitch in px at 720p for a printed look. 0 keeps smooth tones. */
  halftone?: number;
  speed?: number;
};

export const duotoneBeatDefaults = {
  palettes: [
    ["#111111", "#FFFFFF"],
    ["#111111", "#E5322D"],
    ["#E5322D", "#FFFFFF"],
    ["#E5322D", "#111111"],
  ] as DuotonePalette[],
  beatFrames: 15,
  beatsPerBar: 4,
  punch: 0.07,
  showIndicator: true,
  halftone: 8,
  speed: 1,
};

const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "").trim();
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function Ground({
  id,
  width,
  height,
}: {
  id: string;
  width: number;
  height: number;
}) {
  return (
    <svg width={width} height={height} aria-hidden>
      <defs>
        <radialGradient id={`${id}-ground`} cx="0.5" cy="0.4" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.5" stopColor="#F2F2F2" />
          <stop offset="1" stopColor="#C4C4C4" />
        </radialGradient>
      </defs>
      <rect width={width} height={height} fill={`url(#${id}-ground)`} />
    </svg>
  );
}

function Portrait({
  id,
  width,
  height,
}: {
  id: string;
  width: number;
  height: number;
}) {
  const h = height;
  const cx = width / 2;
  const P = (x: number, y: number) => `${cx + x * h} ${y * h}`;
  const head = [
    `M ${P(0, 0.17)}`,
    `C ${P(0.075, 0.17)} ${P(0.118, 0.23)} ${P(0.118, 0.32)}`,
    `C ${P(0.118, 0.4)} ${P(0.095, 0.46)} ${P(0.06, 0.49)}`,
    `C ${P(0.035, 0.51)} ${P(-0.035, 0.51)} ${P(-0.06, 0.49)}`,
    `C ${P(-0.095, 0.46)} ${P(-0.118, 0.4)} ${P(-0.118, 0.32)}`,
    `C ${P(-0.118, 0.23)} ${P(-0.075, 0.17)} ${P(0, 0.17)} Z`,
  ].join(" ");
  const hair = [
    `M ${P(-0.126, 0.34)}`,
    `C ${P(-0.14, 0.17)} ${P(-0.05, 0.125)} ${P(0.02, 0.135)}`,
    `C ${P(0.11, 0.14)} ${P(0.145, 0.21)} ${P(0.126, 0.32)}`,
    `C ${P(0.11, 0.245)} ${P(0.06, 0.215)} ${P(-0.01, 0.222)}`,
    `C ${P(-0.07, 0.228)} ${P(-0.105, 0.26)} ${P(-0.126, 0.34)} Z`,
  ].join(" ");
  const torso = [
    `M ${P(-0.07, 0.585)}`,
    `C ${P(-0.13, 0.62)} ${P(-0.3, 0.63)} ${P(-0.36, 0.7)}`,
    `C ${P(-0.41, 0.76)} ${P(-0.43, 0.88)} ${P(-0.44, 1.01)}`,
    `L ${P(0.44, 1.01)}`,
    `C ${P(0.43, 0.88)} ${P(0.41, 0.76)} ${P(0.36, 0.7)}`,
    `C ${P(0.3, 0.63)} ${P(0.13, 0.62)} ${P(0.07, 0.585)} Z`,
  ].join(" ");
  return (
    <svg width={width} height={height} aria-hidden>
      <defs>
        <linearGradient id={`${id}-skin`} x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor="#121212" />
          <stop offset="0.55" stopColor="#3A3A3A" />
          <stop offset="1" stopColor="#9C9C9C" />
        </linearGradient>
        <linearGradient id={`${id}-shirt`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#141414" />
          <stop offset="0.6" stopColor="#262626" />
          <stop offset="1" stopColor="#6A6A6A" />
        </linearGradient>
      </defs>
      <path
        d={`M ${P(-0.055, 0.45)} L ${P(-0.065, 0.61)} L ${P(0.065, 0.61)} L ${P(0.055, 0.45)} Z`}
        fill="#0C0C0C"
      />
      <path d={torso} fill={`url(#${id}-shirt)`} />
      <path
        d={`M ${P(-0.075, 0.59)} Q ${P(0, 0.67)} ${P(0.075, 0.59)}`}
        fill="none"
        stroke="#7A7A7A"
        strokeWidth={0.012 * h}
      />
      <ellipse
        cx={cx - 0.12 * h}
        cy={0.34 * h}
        rx={0.018 * h}
        ry={0.04 * h}
        fill="#161616"
      />
      <ellipse
        cx={cx + 0.12 * h}
        cy={0.34 * h}
        rx={0.018 * h}
        ry={0.04 * h}
        fill="#8A8A8A"
      />
      <path d={head} fill={`url(#${id}-skin)`} />
      <path d={hair} fill="#060606" />
      {/* Rim light on the key side. */}
      <g
        fill="none"
        stroke="#D6D6D6"
        strokeWidth={0.007 * h}
        strokeLinecap="round"
        style={{ filter: `blur(${0.003 * h}px)` }}
      >
        <path
          d={`M ${P(0.112, 0.27)} C ${P(0.118, 0.36)} ${P(0.105, 0.43)} ${P(0.07, 0.475)}`}
        />
        <path
          d={`M ${P(0.14, 0.625)} C ${P(0.3, 0.64)} ${P(0.39, 0.72)} ${P(0.42, 0.88)}`}
        />
      </g>
    </svg>
  );
}

export function DuotoneBeat({
  src,
  palettes = duotoneBeatDefaults.palettes,
  beatFrames = duotoneBeatDefaults.beatFrames,
  bpm,
  beatsPerBar = duotoneBeatDefaults.beatsPerBar,
  punch = duotoneBeatDefaults.punch,
  showIndicator = duotoneBeatDefaults.showIndicator,
  halftone = duotoneBeatDefaults.halftone,
  speed = duotoneBeatDefaults.speed,
}: DuotoneBeatProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const u = Math.min(width, height) / 720;
  const t = (frame / fps) * 30 * speed;
  const period = Math.max(1, bpm ? (30 * 60) / bpm : beatFrames);
  const beat = Math.floor(t / period);
  const local = t - beat * period;
  const bar = Math.max(1, Math.round(beatsPerBar));
  const inBar = beat % bar;
  const list = palettes.length > 0 ? palettes : duotoneBeatDefaults.palettes;
  const [dark, light] = list[beat % list.length].map(hexToRgb);

  const strength = inBar === 0 ? punch : punch / 3;
  const scale = 1 + strength * Math.exp(-local / 3.2);
  const rise = interpolate(t, [0, 12], [0.22, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const intro = interpolate(t, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const table = (i: number) => `${dark[i]} ${light[i]}`;
  // Halftone screen: a radial distance tile, thresholded against the gray.
  const pitch = halftone * u;
  const tile =
    pitch > 0
      ? `data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${pitch}" height="${pitch}"><defs><radialGradient id="g" r="0.71"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient></defs><rect width="${pitch}" height="${pitch}" fill="url(#g)"/></svg>`,
        )}`
      : null;
  const lightHex = list[beat % list.length][1];
  const darkHex = list[beat % list.length][0];

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <filter
          id={`${id}-duotone`}
          x="0"
          y="0"
          width="1"
          height="1"
          colorInterpolationFilters="sRGB"
        >
          <feColorMatrix type="saturate" values="0" result="gray" />
          {tile ? (
            <>
              <feImage
                href={tile}
                x={0}
                y={0}
                width={pitch}
                height={pitch}
                result="dot"
              />
              <feTile in="dot" result="screen" />
              {/* alpha: 8 - 8 + 1 = 1, color: 8 * (gray - screen) + 1 */}
              <feComposite
                in="gray"
                in2="screen"
                operator="arithmetic"
                k1={0}
                k2={8}
                k3={-8}
                k4={1}
              />
            </>
          ) : null}
          <feComponentTransfer>
            <feFuncR type="table" tableValues={table(0)} />
            <feFuncG type="table" tableValues={table(1)} />
            <feFuncB type="table" tableValues={table(2)} />
          </feComponentTransfer>
        </filter>
      </svg>
      <AbsoluteFill style={{ filter: `url(#${id}-duotone)` }}>
        <AbsoluteFill
          style={{
            backgroundColor: "#FFFFFF",
            transform: `scale(${scale})`,
            transformOrigin: "50% 40%",
          }}
        >
          {src ? (
            <Img
              src={src}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `scale(${1.12 - 0.12 * intro})`,
              }}
            />
          ) : (
            <>
              <Ground id={id} width={width} height={height} />
              <AbsoluteFill
                style={{ transform: `translateY(${rise * height}px)` }}
              >
                <Portrait id={id} width={width} height={height} />
              </AbsoluteFill>
            </>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
      {showIndicator ? (
        <div
          style={{
            position: "absolute",
            left: 48 * u,
            bottom: 44 * u,
            display: "flex",
            alignItems: "center",
            gap: 10 * u,
          }}
        >
          {Array.from({ length: bar }, (_, i) => (
            <div
              key={i}
              style={{
                width: 26 * u,
                height: 26 * u,
                boxSizing: "border-box",
                border: `${2.5 * u}px solid ${darkHex}`,
                backgroundColor: i === inBar ? darkHex : "transparent",
                transform: `scale(${i === inBar ? 1 + 0.25 * Math.exp(-local / 3) : 1})`,
              }}
            />
          ))}
          <span
            style={{
              marginLeft: 10 * u,
              fontFamily: MONO,
              fontSize: 20 * u,
              fontWeight: 700,
              letterSpacing: 2 * u,
              color: darkHex,
              backgroundColor: lightHex,
            }}
          >
            {String(Math.round((30 * 60) / period))} BPM
          </span>
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
