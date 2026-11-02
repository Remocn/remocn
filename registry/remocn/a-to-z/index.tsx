"use client";

import { loadFont } from "@remotion/google-fonts/Unbounded";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const unbounded = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface AToZProps {
  entries?: string[];
  finale?: string;
  connector?: string;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const DEFAULT_ENTRIES = [
  "any aspect ratio.",
  "brand fonts.",
  "captions.",
  "dark mode.",
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const ELLIPSIS = "…";
const FONT_PX = 200;
const TRACK = -0.03;
const LETTER_TRACK = -0.02;

const EASE_ROLL = Easing.bezier(0.6, 0, 0.1, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const DWELLS = [28, 19, 17, 17];
const ROLL = 7;
const STAGGER = 2;
const FINAL_ROLL = 13;
const HOLD_MIN = 36;

interface Metrics {
  letters: Record<string, number>;
  maxLetter: number;
  words: Record<string, number>;
  space: number;
  connector: number;
  asc: number;
  desc: number;
  cap: number;
  tall: number;
  deep: number;
}

function measure(texts: string[], connector: string): Metrics {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("a-to-z: no 2d context");
  const em = (s: string, w: number, track: number) => {
    ctx.font = `${w} ${FONT_PX}px "${unbounded.fontFamily}"`;
    return (
      ctx.measureText(s).width / FONT_PX +
      track * Math.max(0, Array.from(s).length - 1)
    );
  };
  const letters: Record<string, number> = {};
  let maxLetter = 0;
  for (const ch of ALPHABET) {
    letters[ch] = em(ch, 500, 0);
    maxLetter = Math.max(maxLetter, letters[ch]);
  }
  const words: Record<string, number> = {};
  for (const tx of texts) {
    for (const w of tx.split(/\s+/)) {
      if (w && words[w] === undefined) words[w] = em(w, 500, TRACK);
    }
  }
  ctx.font = `500 ${FONT_PX}px "${unbounded.fontFamily}"`;
  const fm = ctx.measureText("Hgy");
  return {
    letters,
    maxLetter,
    words,
    space: em(" ", 500, 0),
    connector: em(connector, 400, TRACK),
    asc: fm.fontBoundingBoxAscent / FONT_PX,
    desc: fm.fontBoundingBoxDescent / FONT_PX,
    cap: ctx.measureText("H").actualBoundingBoxAscent / FONT_PX,
    tall: ctx.measureText("dlkhfH").actualBoundingBoxAscent / FONT_PX,
    deep: ctx.measureText("gjpqy,").actualBoundingBoxDescent / FONT_PX,
  };
}

function useMetrics(texts: string[], connector: string) {
  const key = `${connector}\u0001${texts.join("\u0002")}`;
  const [state, setState] = useState<{ key: string; m: Metrics } | null>(null);
  const [handle] = useState(() => delayRender("a-to-z: measuring"));
  const released = useRef(false);
  const input = useRef({ texts, connector });
  input.current = { texts, connector };
  useEffect(() => {
    let live = true;
    Promise.all([
      unbounded.waitUntilDone(),
      document.fonts.load(`500 100px "${unbounded.fontFamily}"`),
      document.fonts.load(`400 100px "${unbounded.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setState({
          key,
          m: measure(input.current.texts, input.current.connector),
        });
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [key, handle]);
  return state && state.key === key ? state.m : null;
}

function wrap(text: string, m: Metrics, max: number) {
  const words = text.trim().split(/\s+/);
  const widths = words.map((w) => m.words[w] ?? w.length * 0.7);
  const run = (limit: number) => {
    const lines: string[][] = [];
    let line: string[] = [];
    let w = 0;
    words.forEach((word, i) => {
      const add = line.length === 0 ? widths[i] : w + m.space + widths[i];
      if (line.length > 0 && add > limit) {
        lines.push(line);
        line = [word];
        w = widths[i];
      } else {
        line.push(word);
        w = add;
      }
    });
    if (line.length) lines.push(line);
    return lines;
  };
  const first = run(max);
  let best = first;
  for (let k = 1; k <= 20; k++) {
    const next = run(max * (1 - k * 0.025));
    if (next.length !== first.length) break;
    best = next;
  }
  return {
    lines: best.map((l) => l.join(" ")),
    widest: Math.max(
      ...best.map((l) =>
        l.reduce((s, w, i) => s + (m.words[w] ?? 0) + (i > 0 ? m.space : 0), 0),
      ),
    ),
  };
}

function initialOf(text: string) {
  const ch = text.trim().charAt(0).toUpperCase();
  return ALPHABET.includes(ch) ? ch : "A";
}

interface Step<T> {
  at: number;
  value: T;
  roll: number;
  ease: (x: number) => number;
}

function stepAt<T>(steps: Step<T>[], t: number) {
  let k = 0;
  for (let i = 0; i < steps.length; i++) if (t >= steps[i].at) k = i;
  return { cur: steps[k], prev: k > 0 ? steps[k - 1] : null };
}

function flickDurations(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const fromStart = i;
    const fromEnd = count - 1 - i;
    if (fromStart === 0) return 3;
    if (fromStart === 1) return 2;
    if (fromEnd === 0) return 4;
    if (fromEnd === 1) return 3;
    if (fromEnd === 2) return 2;
    return 1;
  });
}

export function AToZ({
  entries = DEFAULT_ENTRIES,
  finale = "zero lock-in.",
  connector = "is for",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: AToZProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const dark = theme === "dark";
  const field = dark ? (accent ?? "#FF5A1F") : "#FFFFFF";
  const stage =
    background === "transparent" ? "transparent" : (background ?? field);
  const ink = "#000000";
  const letterInk = dark ? "#000000" : (accent ?? "#E8480F");

  const list = entries.length > 0 ? entries : DEFAULT_ENTRIES;
  const m = useMetrics([...list, finale, ELLIPSIS], connector);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const total = durationInFrames * speed;
  const lastLetter = initialOf(list[list.length - 1]);
  const finalLetter = initialOf(finale);
  const between =
    ALPHABET.indexOf(finalLetter) > ALPHABET.indexOf(lastLetter) + 1
      ? ALPHABET.slice(
          ALPHABET.indexOf(lastLetter) + 1,
          ALPHABET.indexOf(finalLetter),
        ).split("")
      : [];
  const flick = flickDurations(between.length);
  const flickSum = flick.reduce((s, d) => s + d, 0);
  const natural = list.map((_, k) => DWELLS[Math.min(k, DWELLS.length - 1)]);
  const natSum = natural.reduce((s, d) => s + d, 0);
  const budget = total - HOLD_MIN - FINAL_ROLL - flickSum - 4;
  const fit = natSum > 0 ? Math.min(1, budget / natSum) : 1;
  const starts: number[] = [];
  let at = 0;
  for (let k = 0; k < list.length; k++) {
    starts.push(at);
    at += Math.max(8, Math.round(natural[k] * fit));
  }
  const ellipsisAt = at;
  const flickAt = between.length > 0 ? ellipsisAt + 2 : ellipsisAt;
  const finaleAt = flickAt + flickSum;

  const letterSteps: Step<string>[] = list.map((e, k) => ({
    at: starts[k],
    value: initialOf(e),
    roll: ROLL,
    ease: EASE_ROLL,
  }));
  let fa = flickAt;
  between.forEach((ch, i) => {
    letterSteps.push({ at: fa, value: ch, roll: 0, ease: EASE_ROLL });
    fa += flick[i];
  });
  letterSteps.push({
    at: finaleAt,
    value: finalLetter,
    roll: FINAL_ROLL,
    ease: EASE_OUT,
  });

  const portrait = H > W * 1.1;
  const marginX = W * (portrait ? 0.09 : 0.075);

  const shown = [...list, finale].map(initialOf);
  const shownMax = Math.max(...shown.map((ch) => m.letters[ch] ?? 0));
  const all = [...list, finale];
  const widestWord = Math.max(
    ...all.flatMap((s) => s.split(/\s+/).map((w) => m.words[w] ?? 0)),
  );
  const singleWidest = Math.max(...all.map((s) => wrap(s, m, 1e9).widest));
  const lead = Math.max(1.04, m.tall + m.deep + 0.1);

  let G: number;
  let F: number;
  let xL: number;
  let textX: number;
  let textMax: number;
  let yB: number;
  let connectorBase: number;
  if (portrait) {
    G = Math.min(H * 0.26, W * 0.62) / m.cap;
    xL = marginX;
    textX = marginX;
    textMax = W - marginX * 2;
    F = Math.min(
      W * 0.1,
      textMax / Math.max(widestWord, 0.1),
      (textMax * 2) / Math.max(singleWidest * 1.1, 0.1),
    );
    yB = H * 0.44;
    connectorBase = yB + F * 1.1;
  } else {
    const gap0 = W * 0.04;
    G = (H * 0.5) / m.cap;
    G = Math.min(G, (marginX * 0.8) / Math.max(m.maxLetter - shownMax, 0.01));
    const colW = shownMax * G;
    const avail = W - marginX * 2 - colW - gap0;
    F = Math.min(
      H * 0.15,
      avail / Math.max(widestWord, 0.1),
      (avail * 2) / Math.max(singleWidest * 1.1, 0.1),
    );
    const textW = Math.max(...all.map((s) => wrap(s, m, avail / F).widest)) * F;
    const groupW = colW + gap0 + textW;
    const left = Math.max(marginX, (W - groupW) / 2);
    xL = left + colW;
    textX = xL + gap0;
    textMax = W - marginX - textX;
    yB = H / 2 + (m.cap * G) / 2;
    connectorBase = yB - m.cap * G + F * 0.5 * m.cap;
  }
  const capPx = m.cap * G;
  const capTop = yB - capPx;
  const lineSets = [...list, ELLIPSIS, finale].map(
    (s) => wrap(s, m, textMax / F).lines,
  );
  const Fc = F * 0.5;
  const lineH = lead * F;
  const itemTop0 = connectorBase + F * (m.deep + 0.25 + m.tall);

  const textSteps: Step<string[]>[] = list.map((_, k) => ({
    at: starts[k],
    value: lineSets[k],
    roll: ROLL,
    ease: EASE_ROLL,
  }));
  if (between.length > 0) {
    textSteps.push({
      at: ellipsisAt,
      value: lineSets[list.length],
      roll: ROLL,
      ease: EASE_ROLL,
    });
  }
  textSteps.push({
    at: finaleAt + 2,
    value: lineSets[list.length + 1],
    roll: FINAL_ROLL,
    ease: EASE_OUT,
  });

  const rise = (delay: number) =>
    interpolate(t, [delay - 3, delay + 11], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const rollPair = (
    key: string,
    winTop: number,
    winH: number,
    render: (value: string, y: number, k: string) => React.ReactNode,
    outgoing: string | null,
    incoming: string | null,
    p: number,
    winStyle?: React.CSSProperties,
  ) => {
    const travel = winH * 1.02;
    const kids: React.ReactNode[] = [];
    if (outgoing !== null && p < 1)
      kids.push(render(outgoing, -travel * p, "o"));
    if (incoming !== null && p > 0)
      kids.push(render(incoming, travel * (1 - p), "i"));
    return (
      <div
        key={key}
        style={{
          position: "absolute",
          top: winTop,
          height: winH,
          overflow: "hidden",
          ...winStyle,
        }}
      >
        {kids}
      </div>
    );
  };

  const nodes: React.ReactNode[] = [];

  {
    const { cur, prev } = stepAt(letterSteps, t);
    const p = !prev
      ? rise(0)
      : cur.roll === 0
        ? 1
        : interpolate(t, [cur.at, cur.at + cur.roll], [0, 1], {
            ...CLAMP,
            easing: cur.ease,
          });
    const pad = G * 0.06;
    const winTop = capTop - pad;
    const winH = capPx + pad * 2;
    const lineBox = (m.asc + m.desc) * G;
    const textTop = yB - m.asc * G - winTop;
    nodes.push(
      rollPair(
        "letter",
        winTop,
        winH,
        (v, y, k) => (
          <div
            key={k}
            style={{
              position: "absolute",
              ...(portrait ? { left: 0 } : { right: 0 }),
              top: textTop + y,
              height: lineBox,
              lineHeight: `${lineBox}px`,
              fontFamily: unbounded.fontFamily,
              fontWeight: 500,
              fontSize: G,
              letterSpacing: `${LETTER_TRACK}em`,
              color: letterInk,
              whiteSpace: "pre",
            }}
          >
            {v}
          </div>
        ),
        prev ? prev.value : null,
        cur.value,
        p,
        portrait
          ? { left: marginX, width: W - marginX }
          : { left: 0, width: xL },
      ),
    );
  }

  const textLine = (size: number, weight: number, color: string) =>
    function TextLine(v: string, y: number, k: string) {
      const lineBox = (m.asc + m.desc) * size;
      return (
        <div
          key={k}
          style={{
            position: "absolute",
            left: 0,
            top: (m.tall + 0.05 - m.asc) * size + y,
            height: lineBox,
            lineHeight: `${lineBox}px`,
            fontFamily: unbounded.fontFamily,
            fontWeight: weight,
            fontSize: size,
            letterSpacing: `${TRACK}em`,
            color,
            whiteSpace: "pre",
          }}
        >
          {v}
        </div>
      );
    };

  {
    const cp = rise(3);
    const winTop = connectorBase - Fc * (m.tall + 0.05);
    nodes.push(
      rollPair(
        "connector",
        winTop,
        Fc * (m.tall + m.deep + 0.1),
        textLine(Fc, 400, ink),
        null,
        connector,
        cp,
        { left: textX, right: 0 },
      ),
    );
  }

  {
    const { cur, prev } = stepAt(textSteps, t);
    const prevLines = prev ? prev.value : [];
    const curLines = cur.value;
    const slots = Math.max(prevLines.length, curLines.length);
    const slotOf = (lines: string[], s: number) => {
      if (portrait) return lines[s] ?? null;
      const i = lines.length - 1 - s;
      return i >= 0 ? lines[i] : null;
    };
    for (let s = 0; s < slots; s++) {
      const base = portrait ? itemTop0 + s * lineH : yB - s * lineH;
      const order = portrait ? s : slots - 1 - s;
      const delay = order * STAGGER;
      const p = !prev
        ? rise(5 + delay)
        : interpolate(t, [cur.at + delay, cur.at + delay + cur.roll], [0, 1], {
            ...CLAMP,
            easing: cur.ease,
          });
      const winTop = base - F * (m.tall + 0.05);
      nodes.push(
        rollPair(
          `s${s}`,
          winTop,
          F * (m.tall + m.deep + 0.1),
          textLine(F, 500, ink),
          slotOf(prevLines, s),
          slotOf(curLines, s),
          p,
          { left: textX, right: 0 },
        ),
      );
    }
  }

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {nodes}
    </AbsoluteFill>
  );
}
