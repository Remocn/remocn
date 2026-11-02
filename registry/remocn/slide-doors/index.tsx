"use client";

import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const jakarta = loadJakarta("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface SlideDoorsProps {
  lines?: string[];
  highlight?: string;
  hold?: number;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#0B1F33",
    ink: "#E8EEF2",
    teal: "#00BFA5",
    track: "rgba(232,238,242,0.16)",
  },
  light: {
    bg: "#E8EEF2",
    ink: "#0B1F33",
    teal: "#00A08A",
    track: "rgba(11,31,51,0.14)",
  },
} as const;

const SCALE_MIN = 0.58;
const WGHT = 400;
const TRACK = -0.03;
const WORD = 0.14;

const ENTER = 20;
const CRACK = 8;
const PUSH = 16;
const CLEAR = 14;
const OPEN = CRACK + PUSH + CLEAR;
const PAD = 0.22;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_PUSH = Easing.bezier(0.45, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

interface LineMetrics {
  words: string[];
  split: number;
  left: number;
  right: number;
  full: number;
}

function measure(lines: string[]): LineMetrics[] {
  const probe = document.createElement("span");
  Object.assign(probe.style, {
    position: "absolute",
    left: "-99999px",
    top: "0",
    visibility: "hidden",
    whiteSpace: "pre",
    fontFamily: `"${jakarta.fontFamily}"`,
    fontWeight: String(WGHT),
    fontSize: "100px",
    lineHeight: "1",
    letterSpacing: `${TRACK}em`,
    wordSpacing: `${WORD}em`,
  });
  document.body.appendChild(probe);
  const w = (s: string) => {
    probe.textContent = s;
    return s ? probe.getBoundingClientRect().width / 100 - TRACK : 0;
  };
  const out = lines.map((line) => {
    const words = line.split(" ").filter(Boolean);
    const full = w(words.join(" "));
    let split = -1;
    let best = Number.POSITIVE_INFINITY;
    for (let k = 0; k < words.length - 1; k++) {
      const lw = w(words.slice(0, k + 1).join(" "));
      const d = Math.abs(lw - full / 2);
      if (d < best) {
        best = d;
        split = k;
      }
    }
    const left = split >= 0 ? w(words.slice(0, split + 1).join(" ")) : full;
    const right = split >= 0 ? w(words.slice(split + 1).join(" ")) : 0;
    return { words, split, left, right, full };
  });
  probe.remove();
  return out;
}

function useLines(lines: string[]) {
  const key = lines.join("\u0001");
  const [state, setState] = useState<{ key: string; m: LineMetrics[] } | null>(
    null,
  );
  const [handle] = useState(() => delayRender("slide-doors: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      jakarta.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${jakarta.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({ key, m: measure(key.split("\u0001")) });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state : null;
}

const stripPunct = (s: string) => s.replace(/[.,!?;:’'"]+$/u, "");

export function SlideDoors({
  lines = ["Scenes that move.", "Code you own.", "Arriving in your repo."],
  highlight = "repo.",
  hold = 28,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: SlideDoorsProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.teal;
  const list = useMemo(
    () => (lines.length > 0 ? lines : ["Arriving in your repo."]),
    [lines],
  );
  const state = useLines(list);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!state) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }
  const { m } = state;

  const portrait = H > W * 1.1;
  const minDim = Math.min(W, H);
  const widest = Math.max(...m.map((l) => l.full), 0.1);
  const F = Math.min(
    (W * (portrait ? 0.86 : 0.8)) / widest,
    H * (portrait ? 0.075 : 0.14),
  );
  const cx = W / 2;
  const lineH = F * 1.25;
  const trackY = H * (portrait ? 0.7 : 0.74);
  const top = trackY - lineH - F * 0.12;
  const pad = PAD * F;
  const far = W * 0.62;
  const stroke = Math.max(1.5, minDim * 0.0026);

  const STEP = CRACK + PUSH + Math.max(8, hold);
  const openAt = (k: number) => ENTER + Math.max(8, hold) + k * STEP;
  let cur = 0;
  for (let k = 0; k < list.length - 1; k++) if (t >= openAt(k)) cur = k + 1;
  const opening = cur > 0 && t < openAt(cur - 1) + OPEN;
  const out = opening ? cur - 1 : -1;

  const textStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    height: lineH,
    lineHeight: `${lineH}px`,
    whiteSpace: "pre",
    fontFamily: jakarta.fontFamily,
    fontWeight: WGHT,
    fontSize: F,
    letterSpacing: `${TRACK}em`,
    wordSpacing: `${WORD}em`,
    color: c.ink,
  };

  const renderWords = (k: number, words: string[]) =>
    words.map((w, i) => {
      const hl =
        k === list.length - 1 &&
        highlight &&
        stripPunct(w).toLowerCase() === stripPunct(highlight).toLowerCase();
      return (
        <span key={`${k}-${i}-${w}`} style={hl ? { color: hi } : undefined}>
          {w}
          {i < words.length - 1 ? " " : ""}
        </span>
      );
    });

  const doors = (k: number, dl: number, dr: number) => {
    const l = m[k];
    const x0 = cx - (l.full * F) / 2;
    const leftWords = l.split >= 0 ? l.words.slice(0, l.split + 1) : l.words;
    const rightWords = l.split >= 0 ? l.words.slice(l.split + 1) : [];
    return (
      <>
        <div
          key={`L${k}`}
          style={{
            ...textStyle,
            left: x0,
            transform: `translateX(${(-dl).toFixed(2)}px)`,
          }}
        >
          {renderWords(k, leftWords)}
        </div>
        {rightWords.length > 0 ? (
          <div
            key={`R${k}`}
            style={{
              ...textStyle,
              left: x0 + (l.full - l.right) * F,
              transform: `translateX(${dr.toFixed(2)}px)`,
            }}
          >
            {renderWords(k, rightWords)}
          </div>
        ) : null}
      </>
    );
  };

  let content: React.ReactNode;
  let gapL = cx;
  let gapR = cx;
  if (t < ENTER || (cur === 0 && !opening)) {
    const p = interpolate(t, [0, ENTER], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
    content = doors(0, (1 - p) * far, (1 - p) * far);
  } else if (opening) {
    const tau = t - openAt(out);
    const lo = m[out];
    const ln = m[cur];
    const x0 = cx - (lo.full * F) / 2;
    const edgeL = x0 + lo.left * F;
    const edgeR = lo.split >= 0 ? x0 + (lo.full - lo.right) * F : edgeL;
    const g0 = edgeR - edgeL;
    const gCrack = ln.full * SCALE_MIN * F + 2 * pad;
    const gRest = ln.full * F + 2 * pad;
    const push = interpolate(tau, [CRACK, CRACK + PUSH], [0, 1], {
      ...CLAMP,
      easing: EASE_PUSH,
    });
    const s = SCALE_MIN + (1 - SCALE_MIN) * push;
    const nw = ln.full * s * F;
    let gapW: number;
    if (tau < CRACK) {
      const k = interpolate(tau, [0, CRACK], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      });
      gapW = g0 + (Math.max(gCrack, g0) - g0) * k;
    } else {
      const after = Math.max(0, tau - CRACK - PUSH);
      gapW = Math.max(nw + 2 * pad, g0) + 2 * (F * 0.04 * after * after);
    }
    const centre0 = (edgeL + edgeR) / 2;
    const drift = interpolate(
      gapW,
      [g0, Math.max(g0 + 1, gRest)],
      [0, 1],
      CLAMP,
    );
    const centre = centre0 + (cx - centre0) * drift;
    const dl = edgeL - (centre - gapW / 2);
    const dr = centre + gapW / 2 - edgeR;
    const fits = interpolate(
      gapW - ln.full * SCALE_MIN * F - pad,
      [0, pad],
      [0, 1],
      CLAMP,
    );
    gapL = centre - gapW / 2;
    gapR = centre + gapW / 2;
    content = (
      <>
        {doors(out, dl, dr)}
        <div
          key={`N${cur}`}
          style={{
            ...textStyle,
            left: centre - (ln.full * F) / 2,
            transformOrigin: `${((ln.full * F) / 2).toFixed(2)}px ${(lineH * 0.7).toFixed(2)}px`,
            transform: `scale(${s.toFixed(4)})`,
            opacity: fits,
          }}
        >
          {renderWords(cur, ln.words)}
        </div>
      </>
    );
  } else {
    const l = m[cur];
    content = (
      <div
        key={`N${cur}`}
        style={{ ...textStyle, left: cx - (l.full * F) / 2 }}
      >
        {renderWords(cur, l.words)}
      </div>
    );
  }

  const trackIn = interpolate(t, [0, ENTER], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const halfW = (W / 2) * trackIn;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: cx - halfW,
          width: halfW * 2,
          top: trackY,
          height: stroke,
          background: c.track,
        }}
      />
      {opening ? (
        <div
          style={{
            position: "absolute",
            left: Math.max(0, gapL),
            width: Math.max(0, Math.min(W, gapR) - Math.max(0, gapL)),
            top: trackY - stroke * 0.5,
            height: stroke * 2,
            background: hi,
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top,
          width: W,
          height: lineH,
        }}
      >
        {content}
      </div>
    </AbsoluteFill>
  );
}
