"use client";

import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: bricolage } = loadBricolage("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface SlitScanProps {
  word?: string;
  caption?: string;
  slices?: number;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const MOVE_AT = -30;
const MOVE_END = 28;
const LAG = 34;
const RESOLVE_AT = 36;
const RESOLVE_END = 76;
const CAPTION_AT = 78;

const MOVE = Easing.bezier(0.3, 0.1, 0.2, 1);
const RESOLVE = Easing.bezier(0.65, 0, 0.35, 1);
const SETTLE = Easing.bezier(0.22, 1, 0.36, 1);

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    muted: "#8B8A90",
    hair: "rgba(255,255,255,0.14)",
    band: 0.42,
    rib: "70",
    grain: 0.055,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    muted: "#6E6C67",
    hair: "rgba(18,18,20,0.16)",
    band: 0.34,
    rib: "60",
    grain: 0.04,
  },
} as const;

/**
 * gradients.sh "fluted" palette, ordered as a heat trail: the freshest stale
 * slices run hot, the oldest cool off to blue.
 */
const FLUTED = {
  dark: ["#FFE2C4", "#FF7A3D", "#2F7BFF", "#3A47C8"],
  light: ["#FF7A3D", "#E2562A", "#2F7BFF", "#1D2A8F"],
} as const;

function mix(a: string, b: string, k: number) {
  const pa = Number.parseInt(a.slice(1), 16);
  const pb = Number.parseInt(b.slice(1), 16);
  const ch = (v: number, sh: number) => (v >> sh) & 255;
  const c = (sh: number) =>
    Math.round(ch(pa, sh) + (ch(pb, sh) - ch(pa, sh)) * k)
      .toString(16)
      .padStart(2, "0");
  return `#${c(16)}${c(8)}${c(0)}`;
}

function sample(stops: readonly string[], k: number) {
  const x = Math.min(1, Math.max(0, k)) * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  return mix(stops[i], stops[i + 1], x - i);
}

/** Advance widths (em) for Bricolage Grotesque 500 at -0.035em tracking. */
function widthEm(text: string) {
  let w = 0;
  for (const ch of text) {
    if (ch === " ") w += 0.25;
    else if ("ijlI.,:;'!|".includes(ch)) w += 0.26;
    else if ("ftr".includes(ch)) w += 0.38;
    else if ("mwMW".includes(ch)) w += 0.84;
    else if (ch >= "A" && ch <= "Z") w += 0.64;
    else w += 0.56;
    w -= 0.035;
  }
  return Math.max(w, 0.5);
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
          seed={9}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function splitTail(word: string) {
  const m = word.match(/^(.*?)([.!?]+)$/);
  return m ? [m[1], m[2]] : [word, ""];
}

export function SlitScan({
  word = "Faster.",
  caption = "First render in 1.8s, down from 4.7s",
  slices = 120,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: SlitScanProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const u = H / 720;
  const stage = THEMES[theme];
  const heat = FLUTED[theme];
  const n = Math.max(24, Math.round(slices));

  const em = widthEm(word);
  const size = Math.min(300 * u, (0.74 * W) / em);
  const wordW = em * size;
  const travel = W / 2 + wordW / 2 + 40 * u;
  const lift = -0.06 * H;

  const lag =
    LAG *
    interpolate(t, [0, 14], [0.35, 1], CLAMP) *
    (1 - RESOLVE(interpolate(t, [RESOLVE_AT, RESOLVE_END], [0, 1], CLAMP)));
  const lagK = lag / LAG;
  const pos = (tau: number) =>
    travel * (1 - MOVE(interpolate(tau, [MOVE_AT, MOVE_END], [0, 1], CLAMP)));

  const [body, tail] = splitTail(word);
  const sw = W / n;
  const gap = Math.max(0, 1.2 * u * Math.min(1, lagK * 1.6));

  const capIn = SETTLE(
    interpolate(t, [CAPTION_AT, CAPTION_AT + 20], [0, 1], CLAMP),
  );
  const ruleIn = SETTLE(
    interpolate(t, [CAPTION_AT - 4, CAPTION_AT + 18], [0, 1], CLAMP),
  );
  const capSize = Math.max(15, 24 * u);
  const baseY = H / 2 + lift + size * 0.5;

  // Fluted ground: the same heat palette as a low band behind the word,
  // ribbed into the slice pitch so the slits read as glass flutes.
  const bandIn = interpolate(t, [0, 30], [0, 1], CLAMP);
  const flow = interpolate(t, [0, 125], [-4, 4]);
  const bandStops = `${heat[3]} ${8 + flow}%, ${heat[2]} ${34 + flow}%, ${heat[1]} ${62 + flow}%, ${heat[0]} ${88 + flow}%`;
  const ribW = Math.max(4, W / n) * 2;

  const cols = [];
  const now = pos(t);
  const stale = 0.015 * size;
  let prevU = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < n; i++) {
    const s = (i + 0.5) / n;
    const d = lag * s ** 1.8;
    const left = i * sw;
    const raw = left - pos(t - d);
    const u = Math.max(raw, prevU);
    prevU = u;
    const x = left - u;
    const isStale = Math.abs(x - now) > stale;
    const color = isStale
      ? sample(heat, (Math.abs(x - now) / (0.75 * wordW)) ** 0.7)
      : stage.fg;
    cols.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left,
          top: 0,
          width: sw + 0.75 - (isStale ? gap : 0),
          height: H,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -left,
            top: 0,
            width: W,
            height: H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: `translate(${x}px, ${lift}px)`,
          }}
        >
          <div
            style={{
              fontFamily: bricolage,
              fontWeight: 500,
              fontSize: size,
              letterSpacing: "-0.035em",
              lineHeight: 1,
              whiteSpace: "nowrap",
              color,
              paddingBottom: 0.06 * size,
            }}
          >
            {body}
            {tail ? <span style={{ color: accent }}>{tail}</span> : null}
          </div>
        </div>
      </div>,
    );
  }

  return (
    <AbsoluteFill style={{ background: stage.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: bandIn * stage.band,
          backgroundImage: `linear-gradient(90deg, ${bandStops})`,
          WebkitMaskImage: `radial-gradient(72% 40% at 50% ${50 + (lift / H) * 100 + 4}%, #000 0%, rgba(0,0,0,0.4) 55%, transparent 100%)`,
          maskImage: `radial-gradient(72% 40% at 50% ${50 + (lift / H) * 100 + 4}%, #000 0%, rgba(0,0,0,0.4) 55%, transparent 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: bandIn,
          backgroundImage: `repeating-linear-gradient(90deg, ${stage.bg}00 0px, ${stage.bg}00 ${ribW / 2}px, ${stage.bg}${stage.rib} ${ribW / 2}px, ${stage.bg}${stage.rib} ${ribW}px)`,
        }}
      />
      {cols}
      <div
        style={{
          position: "absolute",
          left: W / 2 - (wordW * 0.5 * ruleIn) / 1,
          top: baseY + 34 * u,
          width: wordW * ruleIn,
          height: Math.max(1, u),
          background: stage.hair,
        }}
      />
      {caption ? (
        <div
          style={{
            position: "absolute",
            left: 0.08 * W,
            right: 0.08 * W,
            top: baseY + 58 * u,
            textAlign: "center",
            fontFamily: bricolage,
            fontWeight: 400,
            fontSize: capSize,
            letterSpacing: "-0.005em",
            fontVariantNumeric: "tabular-nums",
            color: stage.muted,
            opacity: capIn,
            transform: `translateY(${(1 - capIn) * 10 * u}px)`,
          }}
        >
          {caption}
        </div>
      ) : null}
      <Grain opacity={stage.grain} />
    </AbsoluteFill>
  );
}
