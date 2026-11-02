"use client";

import { loadVariableFont } from "@remotion/google-fonts/MonaSans";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const flex = loadVariableFont("normal", { subsets: ["latin"] });

export interface AxisFlexProps {
  /** The word that flexes. */
  word?: string;
  /** Second line, set in the narrow cut under the word. */
  line?: string;
  accent?: string;
  theme?: "dark" | "light";
  /** Playback multiplier. */
  speed?: number;
}

/**
 * The word is filled with the gradients.sh "beam" palette (clip-text), which
 * pairs with the accent; it only drifts a few degrees over the shot.
 */
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fill: (accent: string) => ["#F4F7FF", "#C9D8FF", "#8FB4FF", accent],
  },
  light: {
    bg: "#F5F4F0",
    fill: (accent: string) => ["#1A1660", "#2B2A8A", accent, "#5E86F0"],
  },
} as const;

interface Axes {
  wdth: number;
  wght: number;
}

/** Mona Sans axes: wdth 75–125, wght 200–900; the wave stays at 500 or lighter. */
const AXIS = { wdth: [75, 125], wght: [200, 500] } as const;
/** Equalizer floor and ceiling: light condensed up to wide medium. */
const LOW: Axes = { wdth: 75, wght: 200 };
const HIGH: Axes = { wdth: 125, wght: 500 };
/** The style every letter snaps to. */
const FINAL: Axes = { wdth: 120, wght: 460 };
/** The narrow cut for the second line. */
const NARROW: Axes = { wdth: 75, wght: 400 };

const TRACK = -0.02;

// Timeline (frames at speed 1).
const WAVE_IN = 6;
const WAVE_FULL = 22;
const PERIOD = 30;
const SETTLE = 84;
const SETTLE_STAGGER = 2;
const LINE_IN = SETTLE + 16;
const SAMPLE_END = SETTLE + 24;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const SPRING_SNAP = { damping: 14, stiffness: 170, mass: 0.7 };

const mix = (a: Axes, b: Axes, k: number): Axes => ({
  wdth: a.wdth + (b.wdth - a.wdth) * k,
  wght: a.wght + (b.wght - a.wght) * k,
});

const clampAxes = (a: Axes): Axes => ({
  wdth: Math.min(AXIS.wdth[1], Math.max(AXIS.wdth[0], a.wdth)),
  wght: Math.min(AXIS.wght[1], Math.max(AXIS.wght[0], a.wght)),
});

const fvs = (a: Axes) =>
  `"wdth" ${a.wdth.toFixed(2)}, "wght" ${a.wght.toFixed(1)}`;

/** Equalizer level of glyph i at time t: a travelling wave plus a faster ripple. */
function level(i: number, t: number) {
  const amp = interpolate(t, [WAVE_IN, WAVE_FULL], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.55, 1),
  });
  const ph = ((t - WAVE_IN) / PERIOD) * Math.PI * 2;
  const main = Math.sin(ph - i * 0.95);
  const ripple = Math.sin(ph * 1.85 - i * 1.7 + 1.1);
  const v = (main * 0.72 + ripple * 0.28 + 1) / 2;
  const shaped = v * v * (3 - 2 * v);
  return 0.32 + (shaped - 0.32) * amp;
}

const LEVELS = [0, 0.25, 0.5, 0.75, 1];

interface Metrics {
  /** Advance per glyph (em) at each sampled level. */
  adv: number[][];
  finalWidth: number;
  /** Second line width (em) in the narrow cut. */
  lineWidth: number;
}

function measure(chars: string[], line: string): Metrics {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${flex.fontFamily}"`,
    fontSize: "100px",
    lineHeight: "1",
  });
  document.body.appendChild(probe);
  const width = (s: string, a: Axes) => {
    probe.style.fontVariationSettings = fvs(a);
    probe.textContent = s;
    return probe.getBoundingClientRect().width / 100;
  };
  const adv = chars.map((ch) =>
    LEVELS.map((l) => width(ch, mix(LOW, HIGH, l)) + TRACK),
  );
  const finalWidth = chars.reduce((s, ch) => s + width(ch, FINAL) + TRACK, 0);
  const lineWidth = width(line, NARROW);
  probe.remove();
  return { adv, finalWidth, lineWidth };
}

function useMetrics(chars: string[], line: string) {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("axis-flex: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      flex.waitUntilDone(),
      document.fonts.load(`400 100px "${flex.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setMetrics(measure(chars, line));
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [chars, line, handle]);
  return metrics;
}

function advAt(row: number[], l: number) {
  const x = Math.min(1, Math.max(0, l)) * (LEVELS.length - 1);
  const k = Math.min(LEVELS.length - 2, Math.floor(x));
  return row[k] + (row[k + 1] - row[k]) * (x - k);
}

export function AxisFlex({
  word = "elastic",
  line = "One family, every width",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: AxisFlexProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const chars = useMemo(() => Array.from(word), [word]);
  const m = useMetrics(chars, line);

  // Widest the row ever gets while flexing, so it never leaves the frame.
  const widest = useMemo(() => {
    if (!m) return 1;
    let max = m.finalWidth;
    for (let f = 0; f <= SAMPLE_END; f++) {
      let w = 0;
      for (let i = 0; i < chars.length; i++) w += advAt(m.adv[i], level(i, f));
      max = Math.max(max, w);
    }
    return max;
  }, [m, chars]);

  if (!m) {
    return <div style={{ position: "absolute", inset: 0, background: c.bg }} />;
  }

  const F = Math.min((W * 0.84) / widest, H * 0.36);
  const F2 = Math.min(F * 0.26, (W * 0.8) / Math.max(0.1, m.lineWidth));

  const lineP = interpolate(t, [LINE_IN, LINE_IN + 20], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lineSqueeze = interpolate(t, [LINE_IN, LINE_IN + 24], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.3, 0, 0.1, 1),
  });
  const lineAxes = mix({ ...NARROW, wdth: 100 }, NARROW, lineSqueeze);

  const enter = interpolate(t, [0, 10], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const stops = c.fill(accent);
  const angle = 100 + Math.sin(t / 45) * 6;
  const fill = `linear-gradient(${angle.toFixed(2)}deg, ${stops[0]} 0%, ${stops[1]} 30%, ${stops[2]} 62%, ${stops[3]} 100%)`;

  return (
    <AbsoluteFill
      style={{
        background: c.bg,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "center",
          whiteSpace: "pre",
          fontFamily: flex.fontFamily,
          fontSize: F,
          lineHeight: 1,
          // the fill box must cover the ink, descenders included; the extra
          // bottom padding is pulled back with a negative margin
          height: F * 1.08,
          marginTop: F * 0.1,
          marginBottom: -F * 0.22,
          padding: `0 ${F * 0.04}px`,
          backgroundImage: fill,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          opacity: 0.4 + 0.6 * enter,
          transform: `translateY(${(1 - enter) * F * 0.08}px)`,
        }}
      >
        {chars.map((ch, i) => {
          const snap = spring({
            frame: t - SETTLE - i * SETTLE_STAGGER,
            fps,
            config: SPRING_SNAP,
          });
          const l = level(i, t);
          const axes = clampAxes(mix(mix(LOW, HIGH, l), FINAL, snap));
          return (
            <span
              key={`${i}-${ch}`}
              style={{
                fontVariationSettings: fvs(axes),
                letterSpacing: `${TRACK}em`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          overflow: "hidden",
          marginTop: F * 0.2,
          height: F2 * 1.2,
        }}
      >
        <div
          style={{
            fontFamily: flex.fontFamily,
            fontSize: F2,
            lineHeight: 1.2,
            whiteSpace: "pre",
            color: accent,
            fontVariationSettings: fvs(lineAxes),
            letterSpacing: "0.01em",
            transform: `translateY(${(1 - lineP) * F2 * 1.25}px)`,
          }}
        >
          {line}
        </div>
      </div>
    </AbsoluteFill>
  );
}
