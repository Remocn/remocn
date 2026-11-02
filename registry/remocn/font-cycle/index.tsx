"use client";

import { loadFont as loadBricolage } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadFredoka } from "@remotion/google-fonts/Fredoka";
import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSerif";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { loadFont as loadOswald } from "@remotion/google-fonts/Oswald";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadSyne } from "@remotion/google-fonts/Syne";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const LATIN = { subsets: ["latin"] as ["latin"] };
// Every face stays at 500 or lighter: the cycle is about letterforms, not weight.
const manrope = loadManrope("normal", { weights: ["500"], ...LATIN });
const instrument = loadInstrument("normal", { weights: ["400"], ...LATIN });
const mono = loadMono("normal", { weights: ["400"], ...LATIN });
const playfair = loadPlayfair("italic", { weights: ["500"], ...LATIN });
const oswald = loadOswald("normal", { weights: ["500"], ...LATIN });
const fredoka = loadFredoka("normal", { weights: ["500"], ...LATIN });
const bricolage = loadBricolage("normal", { weights: ["400"], ...LATIN });
const syne = loadSyne("normal", { weights: ["500"], ...LATIN });
const LOADS = [
  manrope,
  instrument,
  mono,
  playfair,
  oswald,
  fredoka,
  bricolage,
  syne,
];

export interface FontCycleFace {
  family: string;
  label: string;
  weight?: number;
  style?: "normal" | "italic";
  tracking?: number;
}

export interface FontCycleProps {
  word?: string;
  fonts?: FontCycleFace[];
  final?: FontCycleFace;
  passes?: number;
  showLabel?: boolean;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const DEFAULT_FONTS: FontCycleFace[] = [
  { family: instrument.fontFamily, label: "Instrument Serif", weight: 400 },
  {
    family: mono.fontFamily,
    label: "JetBrains Mono",
    weight: 400,
    tracking: -0.04,
  },
  {
    family: playfair.fontFamily,
    label: "Playfair Display Italic",
    weight: 500,
    style: "italic",
    tracking: -0.015,
  },
  { family: oswald.fontFamily, label: "Oswald", weight: 500 },
  {
    family: fredoka.fontFamily,
    label: "Fredoka",
    weight: 500,
    tracking: -0.015,
  },
  {
    family: bricolage.fontFamily,
    label: "Bricolage Grotesque",
    weight: 400,
    tracking: -0.035,
  },
  { family: syne.fontFamily, label: "Syne", weight: 500, tracking: -0.03 },
];

const FINAL_FACE: FontCycleFace = {
  family: manrope.fontFamily,
  label: "Manrope",
  weight: 500,
  tracking: -0.045,
};

// gradients.sh "silk" (bg #030308): indigo with a peach sheen. It only lights
// the landed word, as a clip-text fill whose sheen drifts a little to the right.
const SILK = {
  dark: ["#8a7bff", "#f3d6c0", "#aab0ff", "#5d5ff0"],
  light: ["#3b3fd8", "#f0a987", "#8a7bff", "#2a2c9e"],
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: { bg: "#0A0A0B", fg: "#F3F2EF", grain: 0.07 },
  light: { bg: "#F5F4F0", fg: "#121214", grain: 0.045 },
} as const;

const PROBE = 200;

interface FaceMetric {
  width: number;
  cap: number;
  inkCenter: number;
}

function quoted(family: string) {
  return /["',]/.test(family) ? family : `"${family}"`;
}

function fontSpec(face: FontCycleFace, size: number) {
  return `${face.style ?? "normal"} ${face.weight ?? 400} ${size}px ${quoted(face.family)}`;
}

function measure(faces: FontCycleFace[], word: string): FaceMetric[] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return faces.map(() => ({ width: 3, cap: 0.7, inkCenter: 1.5 }));
  return faces.map((face) => {
    ctx.font = fontSpec(face, PROBE);
    ctx.letterSpacing = `${(face.tracking ?? 0) * PROBE}px`;
    const cap = ctx.measureText("H").actualBoundingBoxAscent / PROBE;
    const m = ctx.measureText(word);
    const left = -m.actualBoundingBoxLeft / PROBE;
    const right = m.actualBoundingBoxRight / PROBE;
    return {
      width: right - left,
      cap: cap > 0 ? cap : 0.7,
      inkCenter: (left + right) / 2,
    };
  });
}

function useFaceMetrics(faces: FontCycleFace[], word: string) {
  const [metrics, setMetrics] = useState<FaceMetric[] | null>(null);
  const [handle] = useState(() => delayRender("font-cycle: measuring faces"));
  const released = useRef(false);
  const key = faces.map((f) => fontSpec(f, 1)).join("|");

  useEffect(() => {
    let live = true;
    const release = () => {
      if (released.current) return;
      released.current = true;
      continueRender(handle);
    };
    const specs = key.split("|");
    Promise.all([
      ...LOADS.map((l) => l.waitUntilDone()),
      ...specs.map((s) => document.fonts.load(s.replace(" 1px ", " 100px "))),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(faces, word));
        release();
      });
    return () => {
      live = false;
    };
  }, [key, word, handle, faces]);

  return metrics;
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
          seed={23}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function schedule(count: number) {
  const ends: number[] = [];
  let at = 0;
  for (let k = 0; k < count; k++) {
    const intro = 9 * Math.max(0, 1 - k / 2.4) ** 2;
    const tail = 9 * Math.max(0, (k - (count - 6)) / 5) ** 1.7;
    at += Math.round(3 + intro + tail);
    ends.push(at);
  }
  return ends;
}

export function FontCycle({
  word = "Launch",
  fonts = DEFAULT_FONTS,
  final = FINAL_FACE,
  passes = 2,
  showLabel = true,
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: FontCycleProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const u = W / 1280;
  const silkId = `fcs${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const faces = useMemo(() => [...fonts, final], [fonts, final]);
  const metrics = useFaceMetrics(faces, word);

  const sequence = useMemo(() => {
    const list: number[] = [];
    for (let p = 0; p < passes; p++) {
      for (let i = 0; i < fonts.length; i++) list.push(i);
    }
    return list;
  }, [fonts.length, passes]);
  const ends = useMemo(() => schedule(sequence.length), [sequence.length]);
  const landAt = ends[ends.length - 1] ?? 0;

  if (!metrics) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }

  const slot = ends.findIndex((e) => t < e);
  const faceIndex = slot < 0 ? faces.length - 1 : sequence[slot];
  const landed = slot < 0;
  const face = faces[faceIndex];
  const m = metrics[faceIndex];

  // All faces share one cap height, so the swaps read against the guides.
  const capPx = Math.min(
    H * 0.26,
    ...metrics.map((mm) => (W * 0.86 * mm.cap) / mm.width),
  );
  const size = capPx / m.cap;
  const cx = W / 2;
  const labelGap = capPx * 0.5;
  const labelSize = Math.max(15, 18 * u);
  const blockH = capPx + (showLabel ? labelGap + labelSize : 0);
  const baseline = H / 2 - blockH / 2 + capPx;

  const enter = interpolate(t, [0, 10], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const guideIn = interpolate(t, [0, 16], [0, 1], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const settle = interpolate(t, [landAt, landAt + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const guideOut = interpolate(t, [landAt + 4, landAt + 26], [1, 0], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const guideAlpha = guideIn * (0.12 + 0.06 * (1 - guideOut)) * guideOut;
  const guideHalf = W * 0.42 * guideIn;
  const lift = (1 - enter) * capPx * 0.08;
  const scale = landed ? 1.035 - 0.035 * settle : 1;
  const hair = Math.max(1, u);
  const sheen = interpolate(t, [landAt, landAt + 60], [0.34, 0.48], {
    ...CLAMP,
    easing: EASE_IO,
  });
  const silk = SILK[theme];
  const inkL = cx - (m.width / 2) * size * 1.04;
  const inkW = m.width * size * 1.04;

  return (
    <AbsoluteFill style={{ background: c.bg, overflow: "hidden" }}>
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <linearGradient
            id={silkId}
            gradientUnits="userSpaceOnUse"
            x1={inkL}
            y1={baseline - capPx * 1.3}
            x2={inkL + inkW}
            y2={baseline + capPx * 0.3}
          >
            <stop offset="0" stopColor={silk[0]} />
            <stop offset={sheen - 0.16} stopColor={silk[2]} />
            <stop offset={sheen} stopColor={silk[1]} />
            <stop offset={sheen + 0.2} stopColor={silk[2]} />
            <stop offset="1" stopColor={silk[3]} />
          </linearGradient>
        </defs>
        {[baseline, baseline - capPx].map((y) => (
          <rect
            key={y}
            x={cx - guideHalf}
            y={y - hair / 2}
            width={guideHalf * 2}
            height={hair}
            fill={c.fg}
            opacity={guideAlpha}
          />
        ))}
        <g
          transform={`translate(${cx} ${baseline - capPx / 2 + lift}) scale(${scale}) translate(${-cx} ${-(baseline - capPx / 2)})`}
          opacity={enter}
        >
          <text
            x={cx - m.inkCenter * size}
            y={baseline}
            fontFamily={face.family}
            fontWeight={face.weight ?? 400}
            fontStyle={face.style ?? "normal"}
            fontSize={size}
            letterSpacing={`${face.tracking ?? 0}em`}
            fill={landed ? `url(#${silkId})` : c.fg}
          >
            {word}
          </text>
        </g>
      </svg>
      {showLabel ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: baseline + labelGap,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: labelSize * 0.6,
            fontFamily: mono.fontFamily,
            fontWeight: 400,
            fontSize: labelSize,
            lineHeight: 1,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: c.fg,
            opacity: enter * (landed ? 0.62 + 0.2 * settle : 0.46),
          }}
        >
          <span
            style={{
              width: labelSize * 0.42,
              height: labelSize * 0.42,
              borderRadius: "50%",
              background: landed ? accent : c.fg,
              opacity: landed ? 1 : 0.5,
            }}
          />
          <span>
            {face.label}
            {face.weight ? ` ${face.weight}` : ""}
          </span>
        </div>
      ) : null}
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
