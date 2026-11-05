"use client";

import { loadFont } from "@remotion/google-fonts/Outfit";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  interpolateColors,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const outfit = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface DoubleTakeProps {
  text?: string;
  focus?: string;
  cue?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#2445E5", ink: "#FFFFFF", accent: "#FF8FB1" },
  light: { bg: "#FFFFFF", ink: "#2445E5", accent: "#E0457B" },
} as const;

const WGHT = 500;
const TRACK = -0.035;
const MEASURE_PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_CRAWL = Easing.bezier(0.42, 0, 0.62, 1);
const EASE_REWIND = Easing.bezier(0.5, 0, 0.12, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const IN_LEN = 14;
const IN_STAGGER = 3;
const CRAWL_AT = 16;
const PER_WORD = 6.5;
const STOP_HOLD = 8;
const REWIND_LEN = 24;
const CLEAR_LEN = 12;
const MIN_HOLD = 26;

let measureCtx: CanvasRenderingContext2D | null = null;

function ctx2d() {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) throw new Error("double-take: no 2d context");
  measureCtx.font = `${WGHT} ${MEASURE_PX}px "${outfit.fontFamily}"`;
  return measureCtx;
}

function em(s: string) {
  return (
    ctx2d().measureText(s).width / MEASURE_PX + TRACK * Array.from(s).length
  );
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("double-take: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      outfit.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${outfit.fontFamily}"`),
      document.fonts.load(`400 100px "${outfit.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (live) setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [handle]);
  return ready;
}

interface Layout {
  words: { text: string; x: number; w: number; focus: boolean }[];
  lineW: number;
  focusX0: number;
  focusX1: number;
  baseline: number;
  cap: number;
}

function buildLayout(text: string, focus: string): Layout {
  const tokens: { text: string; start: number; end: number }[] = [];
  const re = /\S+/g;
  let m = re.exec(text);
  while (m) {
    tokens.push({ text: m[0], start: m.index, end: m.index + m[0].length });
    m = re.exec(text);
  }
  const needle = focus.trim().toLowerCase();
  let at = needle ? text.toLowerCase().indexOf(needle) : -1;
  let end = at + needle.length;
  if (at < 0) {
    const last = tokens[tokens.length - 1];
    at = last ? last.start : 0;
    end = last ? last.end : 0;
  }
  const space = em(" ");
  let x = 0;
  const words = tokens.map((tk) => {
    const w = em(tk.text);
    const out = {
      text: tk.text,
      x,
      w,
      focus: tk.end > at && tk.start < end,
    };
    x += w + space;
    return out;
  });
  const lineW = em(tokens.map((tk) => tk.text).join(" "));
  const fw = words.filter((w) => w.focus);
  const focusX0 = fw.length ? fw[0].x : 0;
  const focusX1 = fw.length ? fw[fw.length - 1].x + fw[fw.length - 1].w : 0;

  const c = ctx2d();
  const fm = c.measureText("Hxg");
  const asc = fm.fontBoundingBoxAscent / MEASURE_PX;
  const desc = fm.fontBoundingBoxDescent / MEASURE_PX;
  const cap = c.measureText("H").actualBoundingBoxAscent / MEASURE_PX;
  const baseline = (1 - asc - desc) / 2 + asc;
  return { words, lineW, focusX0, focusX1, baseline, cap };
}

export function DoubleTake({
  text = "One person wrote this entire launch video over a single lunch break.",
  focus = "One person",
  cue = "Read that again.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: DoubleTakeProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady();

  const layout = useMemo(
    () => (ready ? buildLayout(text, focus) : null),
    [ready, text, focus],
  );

  if (!layout) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const F = portrait ? W * 0.3 : H * 0.34;
  const mx = W * (portrait ? 0.08 : 0.07);
  const my = H * (portrait ? 0.07 : 0.1);
  const { words, lineW, focusX0, focusX1, baseline, cap } = layout;

  const crawlLen = Math.max(36, Math.min(120, words.length * PER_WORD));
  const stopAt = CRAWL_AT + crawlLen;
  const rewindAt = stopAt + STOP_HOLD;
  const landAt = rewindAt + REWIND_LEN;
  const motionEnd = landAt + CLEAR_LEN;
  const room = durationInFrames * speed - MIN_HOLD;
  const k = Math.max(0.55, Math.min(1, room / motionEnd));
  const t = (frame * speed) / k;

  const startLeft = mx;
  const endLeft = Math.min(mx, W - mx - lineW * F);
  const crawl = interpolate(t, [CRAWL_AT, stopAt], [0, 1], {
    ...CLAMP,
    easing: EASE_CRAWL,
  });
  const left = startLeft + (endLeft - startLeft) * crawl;
  const centreAtStop = (W / 2 - endLeft) / F;

  const focusW = focusX1 - focusX0;
  const sF = Math.max(0.4, Math.min(1.25, (W * 0.84) / (focusW * F)));
  const r = interpolate(t, [rewindAt, landAt], [0, 1], {
    ...CLAMP,
    easing: EASE_REWIND,
  });
  const zoom = interpolate(t, [rewindAt + REWIND_LEN * 0.35, landAt], [0, 1], {
    ...CLAMP,
    easing: Easing.bezier(0.45, 0, 0.2, 1),
  });
  const s = Math.exp(Math.log(sF) * zoom);
  const focusCentre = (focusX0 + focusX1) / 2;

  const rewinding = t >= rewindAt;
  const fx = rewinding
    ? centreAtStop + (focusCentre - centreAtStop) * r
    : (W / 2 - left) / F;

  const stripY = H * (portrait ? 0.52 : 0.55);
  const lineTop = stripY + (cap / 2 - baseline) * F;

  const tint = interpolate(t, [landAt - 10, landAt + 2], [0, 1], CLAMP);
  const clear = interpolate(t, [landAt - 6, landAt + CLEAR_LEN], [1, 0], {
    ...CLAMP,
    easing: Easing.bezier(0.4, 0, 0.6, 1),
  });
  const focusColor = interpolateColors(tint, [0, 1], [c.ink, hi]);

  const cueF = Math.max(16, (portrait ? W : H) * 0.07);
  const cueIn = interpolate(t, [stopAt + 2, stopAt + 16], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });

  const clipTop = (baseline - 1.0) * F;
  const clipH = 1.3 * F;
  const fade = (mx * 0.9).toFixed(1);
  const edgeMask = `linear-gradient(90deg, transparent 0px, #000 ${fade}px, #000 calc(100% - ${fade}px), transparent 100%)`;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {cue ? (
        <div
          style={{
            position: "absolute",
            left: mx,
            top: my - (baseline - cap) * cueF,
            height: cueF * 1.3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontFamily: outfit.fontFamily,
              fontWeight: 400,
              fontSize: cueF,
              lineHeight: `${cueF}px`,
              letterSpacing: "-0.015em",
              whiteSpace: "pre",
              color: c.ink,
              transform: `translateY(${((1 - cueIn) * 1.2 * cueF).toFixed(2)}px)`,
            }}
          >
            {cue}
          </div>
        </div>
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          maskImage: edgeMask,
          WebkitMaskImage: edgeMask,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transformOrigin: "0 0",
            transform: `translate(${(W / 2).toFixed(2)}px, ${stripY.toFixed(2)}px) scale(${s.toFixed(5)}) translate(${(-fx * F).toFixed(2)}px, ${(-stripY).toFixed(2)}px)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -0.2 * F,
              top: lineTop + clipTop,
              width: (lineW + 0.6) * F,
              height: clipH,
              overflow: "hidden",
            }}
          >
            {words.map((w, i) => {
              const q = interpolate(
                t,
                [i * IN_STAGGER, i * IN_STAGGER + IN_LEN],
                [0, 1],
                { ...CLAMP, easing: EASE_OUT },
              );
              return (
                <div
                  key={`${i}-${w.text}`}
                  style={{
                    position: "absolute",
                    left: (w.x + 0.2) * F,
                    top: -clipTop,
                    height: F,
                    fontFamily: outfit.fontFamily,
                    fontWeight: WGHT,
                    fontSize: F,
                    lineHeight: `${F}px`,
                    letterSpacing: `${TRACK}em`,
                    whiteSpace: "pre",
                    color: w.focus ? focusColor : c.ink,
                    opacity: w.focus ? 1 : clear,
                    transform: `translateY(${((1 - q) * 1.15 * F).toFixed(2)}px)`,
                  }}
                >
                  {w.text}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}
