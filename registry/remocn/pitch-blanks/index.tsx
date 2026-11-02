"use client";

import { loadFont } from "@remotion/google-fonts/Bitter";
import { useEffect, useRef, useState } from "react";
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

const bitter = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface PitchBlanksProps {
  line?: string;
  labels?: string[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: { bg: "#0F1B3D", ink: "#F4EFE6", accent: "#FF8A3D" },
  light: { bg: "#F4EFE6", ink: "#0F1B3D", accent: "#C85A12" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const TRACK = -0.025;
const LABEL_TRACK = 0.12;
const LABEL_SCALE = 0.2;
const BOX = 1.15;
const PITCH = 1.72;
const RULE_Y = 1.02;
const FIRST_FILL = 42;
const FILL_GAP = 32;
const MOTION_TAIL = 24;

interface Tok {
  text: string;
  attach: boolean;
  blank: number;
  label: string;
}

function parse(line: string, labels: string[]) {
  const toks: Tok[] = [];
  const re = /\{([^}]*)\}/g;
  let last = 0;
  let n = 0;
  let glue = false;
  const pushText = (s: string) => {
    if (!s) return;
    const lead = /^\s/.test(s);
    const parts = s.split(/\s+/).filter(Boolean);
    parts.forEach((p, i) => {
      toks.push({
        text: p,
        attach: i === 0 && !lead && glue,
        blank: -1,
        label: "",
      });
    });
    glue = !/\s$/.test(s);
  };
  for (let m = re.exec(line); m; m = re.exec(line)) {
    pushText(line.slice(last, m.index));
    const attach = toks.length > 0 && glue;
    toks.push({
      text: m[1].trim(),
      attach,
      blank: n,
      label: labels[n] ?? "",
    });
    n++;
    glue = true;
    last = m.index + m[0].length;
  }
  pushText(line.slice(last));
  return { toks, blanks: n };
}

function useFontsReady() {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("pitch-blanks: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      bitter.waitUntilDone(),
      document.fonts.load(`400 100px "${bitter.fontFamily}"`),
      document.fonts.load(`500 100px "${bitter.fontFamily}"`),
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

function useMeasure() {
  const ctx = useRef<CanvasRenderingContext2D | null>(null);
  const cache = useRef(new Map<string, number>());
  return (text: string, weight: 400 | 500, track: number) => {
    const key = `${weight}\u0001${track}\u0001${text}`;
    const hit = cache.current.get(key);
    if (hit !== undefined) return hit;
    if (!ctx.current)
      ctx.current = document.createElement("canvas").getContext("2d");
    let w = text.length * 0.5;
    if (ctx.current) {
      ctx.current.font = `${weight} 100px "${bitter.fontFamily}"`;
      w = ctx.current.measureText(text).width / 100;
    }
    const em = w + track * Array.from(text).length;
    cache.current.set(key, em);
    return em;
  };
}

function breakLines(
  widths: number[],
  attach: boolean[],
  space: number,
  max: number,
) {
  const starts = [0];
  let x = 0;
  for (let i = 0; i < widths.length; i++) {
    const gap = i === starts[starts.length - 1] || attach[i] ? 0 : space;
    if (
      i > starts[starts.length - 1] &&
      !attach[i] &&
      x + gap + widths[i] > max
    ) {
      let s = i;
      while (s > starts[starts.length - 1] + 1 && attach[s]) s--;
      starts.push(s);
      x = 0;
      for (let k = s; k <= i; k++)
        x += (k === s || attach[k] ? 0 : space) + widths[k];
    } else {
      x += gap + widths[i];
    }
  }
  return starts;
}

export function PitchBlanks({
  line = "{remocn} is a {launch-film kit} for {teams of one}.",
  labels = ["product", "category", "audience"],
  accent,
  background,
  speed = 1,
  theme = "dark",
}: PitchBlanksProps) {
  const frame = useCurrentFrame() * speed;
  const { width: W, height: H, durationInFrames: T } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady();
  const measure = useMeasure();

  if (!ready) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const { toks, blanks } = parse(line, labels);
  const motionEnd =
    FIRST_FILL + Math.max(0, blanks - 1) * FILL_GAP + MOTION_TAIL;
  const tail = Math.max(30, T * 0.18);
  const pace = Math.min(1.5, Math.max(0.5, (T - tail) / motionEnd));
  const t = frame / pace;

  const portrait = H > W * 1.1;
  const mx = W * (portrait ? 0.08 : 0.075);
  const maxW = W - mx * 2;

  const space = measure(" ", 400, TRACK);
  const fullW = toks.map((tk) =>
    measure(tk.text, tk.blank >= 0 ? 500 : 400, TRACK),
  );
  const labelW = toks.map((tk) =>
    tk.blank >= 0
      ? measure(tk.label.toUpperCase(), 400, LABEL_TRACK) * LABEL_SCALE
      : 0,
  );
  const emptyW = toks.map((tk, i) =>
    tk.blank >= 0 ? Math.max(1.9, labelW[i] + 0.7) : 0,
  );
  const slotW = toks.map((tk, i) =>
    tk.blank >= 0 ? Math.max(fullW[i], emptyW[i]) : fullW[i],
  );
  const attach = toks.map((tk) => tk.attach);

  const fit = (maxLines: number) => {
    let size = portrait ? W * 0.13 : H * 0.135;
    let br = breakLines(slotW, attach, space, maxW / size);
    for (let k = 0; k < 60; k++) {
      const widest = Math.max(...slotW) * size;
      const tall = br.length * PITCH * size;
      if (br.length <= maxLines && widest <= maxW && tall <= H * 0.8) break;
      size *= 0.96;
      br = breakLines(slotW, attach, space, maxW / size);
    }
    return { size, br };
  };
  let fitted = fit(portrait ? 6 : 2);
  if (!portrait && fitted.size < H * 0.085) fitted = fit(3);
  const Fs = fitted.size;
  let starts = fitted.br;
  if (starts.length > 1) {
    let best = starts;
    const count = starts.length;
    for (let k = 1; k <= 30; k++) {
      const next = breakLines(
        slotW,
        attach,
        space,
        (maxW / Fs) * (1 - k * 0.015),
      );
      if (next.length !== count) break;
      best = next;
    }
    starts = best;
  }
  const lineOf = toks.map((_, i) => {
    let l = 0;
    while (l + 1 < starts.length && starts[l + 1] <= i) l++;
    return l;
  });

  const fillAt = (b: number) => FIRST_FILL + b * FILL_GAP;
  const fillP = (b: number) =>
    interpolate(t, [fillAt(b), fillAt(b) + 14], [0, 1], {
      ...CLAMP,
      easing: EASE_IO,
    });
  const wordP = (b: number) =>
    interpolate(t, [fillAt(b) + 10, fillAt(b) + 26], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });

  const curW = toks.map((tk, i) =>
    tk.blank >= 0
      ? emptyW[i] + (fullW[i] - emptyW[i]) * fillP(tk.blank)
      : fullW[i],
  );
  const xs: number[] = [];
  let x = 0;
  toks.forEach((tk, i) => {
    if (i === starts[lineOf[i]]) x = 0;
    else if (!tk.attach) x += space;
    xs.push(x);
    x += curW[i];
  });

  const pitch = PITCH * Fs;
  const blockH = (starts.length - 1) * pitch + BOX * Fs + Fs * 0.5;
  const top0 = H / 2 - blockH / 2;
  const Fl = Math.max(11, Fs * LABEL_SCALE);
  const ruleH = Math.max(2, Fs * 0.03);

  const intro = (i: number) =>
    interpolate(t, [i * 2, i * 2 + 16], [0, 1], { ...CLAMP, easing: EASE_OUT });

  return (
    <AbsoluteFill
      style={{
        background: stage,
        color: c.ink,
        fontFamily: bitter.fontFamily,
        fontWeight: 400,
        overflow: "hidden",
      }}
    >
      {toks.map((tk, i) => {
        const left = mx + xs[i] * Fs;
        const top = top0 + lineOf[i] * pitch;
        const w = curW[i] * Fs;
        if (tk.blank < 0) {
          const p = intro(i);
          return (
            <div
              key={`w${i}`}
              style={{
                position: "absolute",
                left,
                top,
                height: BOX * Fs,
                lineHeight: `${BOX * Fs}px`,
                fontSize: Fs,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                opacity: p,
                transform: `translateY(${((1 - p) * Fs * 0.3).toFixed(2)}px)`,
              }}
            >
              {tk.text}
            </div>
          );
        }
        const draw = interpolate(t, [4 + i * 2, 22 + i * 2], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        const lab = interpolate(t, [12 + i * 2, 28 + i * 2], [0, 1], {
          ...CLAMP,
          easing: EASE_OUT,
        });
        const f = fillP(tk.blank);
        const wp = wordP(tk.blank);
        return (
          <div key={`b${i}`}>
            <div
              style={{
                position: "absolute",
                left,
                top: top + RULE_Y * Fs,
                width: w,
                height: ruleH,
                background: interpolateColors(f, [0, 1], [c.ink, hi]),
                opacity: 0.4 + 0.6 * f,
                transform: `scaleX(${draw.toFixed(4)})`,
                transformOrigin: "0 50%",
              }}
            />
            <div
              style={{
                position: "absolute",
                left,
                top,
                height: BOX * Fs,
                lineHeight: `${BOX * Fs}px`,
                fontSize: Fs,
                fontWeight: 500,
                letterSpacing: `${TRACK}em`,
                whiteSpace: "pre",
                opacity: wp,
                transform: `translateY(${((1 - wp) * Fs * 0.42).toFixed(2)}px)`,
              }}
            >
              {tk.text}
            </div>
            <div
              style={{
                position: "absolute",
                left,
                width: w,
                top: top + RULE_Y * Fs + ruleH + Fs * 0.1,
                fontSize: Fl,
                lineHeight: 1.2,
                letterSpacing: `${LABEL_TRACK}em`,
                textTransform: "uppercase",
                textAlign: "center",
                whiteSpace: "pre",
                color: interpolateColors(f, [0, 1], [c.ink, hi]),
                opacity: lab * (0.55 + 0.35 * f),
              }}
            >
              {tk.label}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
