"use client";

import { loadFont } from "@remotion/google-fonts/BarlowCondensed";
import type React from "react";
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

const barlow = loadFont("normal", { weights: ["500"], subsets: ["latin"] });

export interface NegationDropProps {
  lines?: string[];
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const THEMES = {
  dark: {
    bg: "#000000",
    ink: "#FFFFFF",
    dim: "#4A4A4A",
    accent: "#D4FF00",
    onBlock: "#000000",
  },
  light: {
    bg: "#D4FF00",
    ink: "#000000",
    dim: "#8FAD00",
    accent: "#000000",
    onBlock: "#D4FF00",
  },
} as const;

const TRACK = -0.01;
const LINE_H = 0.88;
const ENTER_AT = -4;
const ENTER_STAGGER = 6;
const ENTER_LEN = 16;
const FLIP_AT = 44;
const FLIP_GAP = 14;
const FALL_LEN = 9;
const CLOSE_DELAY = 6;
const LIT_DELAY = 6;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_FALL = Easing.bezier(0.55, 0, 0.9, 0.45);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const DEFAULT_LINES = [
  "You can’t animate.",
  "You don’t have a team.",
  "It isn’t done.",
];

type PartKind = "plain" | "keep" | "drop";
interface Part {
  text: string;
  kind: PartKind;
}

function splitLine(line: string): Part[][] {
  const words = line.trim().split(/\s+/);
  let flipped = false;
  return words.map((w) => {
    if (!flipped) {
      const can = w.match(/^(can)([’']t)(\W*)$/i);
      const nt =
        can || /^(won|shan)[’']t/i.test(w)
          ? null
          : w.match(/^(\w+)(n[’']t)(\W*)$/i);
      const hit = can ?? nt;
      if (hit) {
        flipped = true;
        const parts: Part[] = [
          { text: hit[1], kind: "keep" },
          { text: hit[2].replace("'", "’"), kind: "drop" },
        ];
        if (hit[3]) parts.push({ text: hit[3], kind: "plain" });
        return parts;
      }
    }
    return [{ text: w, kind: "plain" }];
  });
}

const upper = (s: string) => s.toUpperCase();

function useWidths(strings: string[]) {
  const key = strings.join("\u0001");
  const [state, setState] = useState<{
    key: string;
    w: Map<string, number>;
    space: number;
    baseline: number;
    capTop: number;
  } | null>(null);
  const [handle] = useState(() => delayRender("negation-drop: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      barlow.waitUntilDone(),
      document.fonts.load(`500 100px "${barlow.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        const probe = document.createElement("span");
        Object.assign(probe.style, {
          position: "absolute",
          left: "-99999px",
          top: "0",
          visibility: "hidden",
          whiteSpace: "pre",
          fontFamily: `"${barlow.fontFamily}"`,
          fontWeight: "500",
          fontSize: "100px",
          lineHeight: "1",
          letterSpacing: `${TRACK}em`,
        });
        document.body.appendChild(probe);
        const w = new Map<string, number>();
        for (const s of key.split("\u0001")) {
          probe.textContent = upper(s);
          w.set(s, probe.getBoundingClientRect().width / 100);
        }
        probe.textContent = "A A";
        const aa = probe.getBoundingClientRect().width;
        probe.textContent = "AA";
        const space = Math.max(
          0.2,
          ((aa - probe.getBoundingClientRect().width) / 100) * 1.5,
        );
        probe.remove();

        let baseline = 0.8;
        let capTop = 0.7;
        const ctx = document.createElement("canvas").getContext("2d");
        if (ctx) {
          ctx.font = `500 200px "${barlow.fontFamily}"`;
          const fm = ctx.measureText("H");
          const asc = fm.fontBoundingBoxAscent / 200;
          const desc = fm.fontBoundingBoxDescent / 200;
          baseline = (1 - (asc + desc)) / 2 + asc;
          capTop = fm.actualBoundingBoxAscent / 200;
        }
        setState({ key, w, space, baseline, capTop });
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

export function NegationDrop({
  lines = DEFAULT_LINES,
  accent,
  background,
  speed = 1,
  theme = "dark",
}: NegationDropProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H, fps } = useVideoConfig();
  const c = THEMES[theme];
  const block = accent ?? c.accent;

  const rows = useMemo(() => lines.map(splitLine), [lines]);
  const strings = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) for (const w of r) for (const p of w) set.add(p.text);
    return [...set];
  }, [rows]);
  const m = useWidths(strings);

  const transparent = background === "transparent";
  const stage = transparent ? "transparent" : (background ?? c.bg);

  if (!m) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const portrait = H > W * 1.1;
  const wOf = (s: string) => m.w.get(s) ?? 0;

  const lineEm = rows.map((r) => {
    let full = 0;
    let drop = 0;
    r.forEach((word, wi) => {
      if (wi > 0) full += m.space;
      for (const p of word) {
        full += wOf(p.text);
        if (p.kind === "drop") drop += wOf(p.text);
      }
    });
    return { full, drop };
  });

  const flipAt = (i: number) => FLIP_AT + i * FLIP_GAP;
  const close = rows.map((_, i) =>
    spring({
      frame: t - flipAt(i) - CLOSE_DELAY,
      fps,
      config: { damping: 15, stiffness: 150, mass: 0.8 },
    }),
  );

  const padX = W * (portrait ? 0.035 : 0.025);
  const measureW = W - padX * 2;
  const fitF = lineEm.map(
    (l, i) => measureW / Math.max(0.3, l.full - l.drop * close[i]),
  );
  const restF = lineEm.map((l) => measureW / Math.max(0.3, l.full - l.drop));
  const maxBlockH = H * (portrait ? 0.72 : 0.9);
  const restH = restF.reduce((a, f) => a + f * LINE_H, 0);
  const k = Math.min(1, maxBlockH / Math.max(1, restH));
  const sizes = fitF.map((f) => f * k);
  const blockH = sizes.reduce((a, f) => a + f * LINE_H, 0);
  const blockTop = (H - blockH) / 2 + (sizes[0] ?? 0) * 0.04;

  let lineTop = blockTop;
  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      {rows.map((r, i) => {
        const F = sizes[i];
        const top = lineTop;
        lineTop += F * LINE_H;
        const enter = interpolate(
          t,
          [
            ENTER_AT + i * ENTER_STAGGER,
            ENTER_AT + i * ENTER_STAGGER + ENTER_LEN,
          ],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        );
        const f0 = flipAt(i);
        const tint = interpolate(t, [f0 - 8, f0 - 1], [0, 1], CLAMP);
        const fall = interpolate(t, [f0, f0 + FALL_LEN], [0, 1], {
          ...CLAMP,
          easing: EASE_FALL,
        });
        const lit = interpolate(
          t,
          [f0 + LIT_DELAY, f0 + LIT_DELAY + 10],
          [0, 1],
          { ...CLAMP, easing: EASE_OUT },
        );
        const clipTop = top - F * 0.2;
        const baseY = top + m.baseline * F;
        const clipBottom = baseY + F * 0.1;
        const lineW = (lineEm[i].full - lineEm[i].drop * close[i]) * F;
        const left = (W - lineW) / 2;
        const bpad = F * 0.05;

        const pieces: React.ReactNode[] = [];
        let x = 0;
        let passedDrop = false;
        r.forEach((word, wi) => {
          if (wi > 0) x += m.space * F;
          for (const p of word) {
            const pw = wOf(p.text) * F;
            const shift = passedDrop ? -lineEm[i].drop * F * close[i] : 0;
            const style: React.CSSProperties = {
              position: "absolute",
              left: left + x + shift,
              top: top - clipTop,
              height: F,
              lineHeight: `${F}px`,
              whiteSpace: "pre",
              color: c.ink,
            };
            if (p.kind === "drop") {
              style.color = interpolateHex(c.ink, c.dim, tint);
              style.transform = `translateY(${(fall * F * 0.95).toFixed(2)}px)`;
              passedDrop = true;
            }
            if (p.kind === "keep" && lit > 0) {
              style.color = `color-mix(in oklab, ${c.ink} ${((1 - lit) * 100).toFixed(1)}%, ${c.onBlock})`;
              pieces.push(
                <div
                  key={`b${wi}`}
                  style={{
                    position: "absolute",
                    left: left + x - bpad,
                    top: baseY - m.capTop * F - bpad - clipTop,
                    width: pw + bpad * 2,
                    height: m.capTop * F + bpad * 2,
                    background: block,
                    transformOrigin: "0 50%",
                    transform: `scaleX(${lit.toFixed(4)})`,
                  }}
                />,
              );
            }
            pieces.push(
              <span key={`${wi}-${p.kind}-${p.text}`} style={style}>
                {upper(p.text)}
              </span>,
            );
            x += pw;
          }
        });

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              width: W,
              top: clipTop,
              height: clipBottom - clipTop,
              overflow: "hidden",
              fontFamily: barlow.fontFamily,
              fontWeight: 500,
              fontSize: F,
              letterSpacing: `${TRACK}em`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `translateY(${((1 - enter) * (clipBottom - clipTop + F * 0.05)).toFixed(2)}px)`,
              }}
            >
              {pieces}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}

function interpolateHex(a: string, b: string, k: number) {
  const pa = hex(a);
  const pb = hex(b);
  if (!pa || !pb) return k < 0.5 ? a : b;
  const mix = pa.map((v, i) => Math.round(v + (pb[i] - v) * k));
  return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
}

function hex(s: string) {
  const mm = s.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!mm) return null;
  const n = Number.parseInt(mm[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
