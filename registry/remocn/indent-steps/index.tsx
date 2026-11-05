"use client";

import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import { Fragment, useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const hanken = loadHanken("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface IndentStepsProps {
  lines?: string[];
  highlight?: string;
  lineNumbers?: boolean;
  exit?: boolean;
  accent?: string;
  background?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const FLUTED = ["#1d2a8f", "#2f7bff", "#ff7a3d", "#ffe2c4"] as const;

const PALETTES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F4F3F0",
    muted: "#5E5D64",
    guide: "rgba(244,243,240,0.2)",
    highlight: `linear-gradient(90deg, ${FLUTED[1]} 0%, #8f7cf0 30%, ${FLUTED[2]} 62%, ${FLUTED[3]} 100%)`,
    ground: [
      `radial-gradient(70% 80% at 104% 108%, color-mix(in oklab, ${FLUTED[0]} 50%, transparent) 0%, color-mix(in oklab, ${FLUTED[0]} 18%, transparent) 45%, transparent 75%)`,
      `radial-gradient(36% 44% at 100% 104%, color-mix(in oklab, ${FLUTED[2]} 16%, transparent) 0%, transparent 80%)`,
    ],
    grain: 0.05,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#111113",
    muted: "#A8A59E",
    guide: "rgba(17,17,19,0.18)",
    highlight: `linear-gradient(90deg, ${FLUTED[0]} 0%, ${FLUTED[1]} 34%, #c05a8a 66%, ${FLUTED[2]} 100%)`,
    ground: [
      `radial-gradient(70% 80% at 104% 108%, color-mix(in oklab, ${FLUTED[1]} 14%, transparent) 0%, color-mix(in oklab, ${FLUTED[3]} 40%, transparent) 45%, transparent 75%)`,
    ],
    grain: 0.035,
  },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_SNAP = Easing.bezier(0.3, 1.25, 0.45, 1);
const EASE_IN = Easing.bezier(0.6, 0, 0.9, 0.5);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const HANKEN_500 = [
  260, 244, 347, 697, 560, 743, 691, 180, 240, 240, 398, 560, 240, 327, 240,
  419, 560, 560, 560, 560, 560, 560, 560, 560, 560, 560, 240, 240, 560, 560,
  560, 516, 874, 649, 604, 706, 679, 583, 563, 732, 683, 252, 553, 644, 498,
  845, 680, 748, 557, 778, 603, 568, 586, 656, 661, 964, 651, 610, 590, 272,
  454, 272, 577, 434, 299, 542, 583, 519, 583, 540, 339, 517, 553, 232, 232,
  541, 269, 833, 553, 575, 583, 583, 413, 471, 353, 553, 526, 750, 527, 526,
  472, 254, 262, 254, 560,
];
const TRACK = -0.035;
const ASC = 1.0;
const DESC = 0.303;
const LINE = 1.16;

function textEm(text: string) {
  let w = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c <= 126 ? HANKEN_500[c - 32] : 600) / 1000 + TRACK;
  }
  return w;
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
          seed={5}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

interface Row {
  text: string;
  line: number;
  sub: number;
  hl: [number, number] | null;
}

function wrapRows(
  lines: string[],
  availEm: (line: number) => number,
  highlight: string,
) {
  const rows: Row[] = [];
  const needle = highlight.toLowerCase();
  lines.forEach((text, line) => {
    const words = text.split(/\s+/).filter(Boolean);
    const out: string[] = [];
    let cur = "";
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (cur && textEm(next) > availEm(line)) {
        out.push(cur);
        cur = w;
      } else cur = next;
    }
    if (cur || out.length === 0) out.push(cur);
    out.forEach((t, sub) => {
      const a = needle ? t.toLowerCase().indexOf(needle) : -1;
      rows.push({
        text: t,
        line,
        sub,
        hl: a >= 0 ? [a, a + needle.length] : null,
      });
    });
  });
  return rows;
}

export function IndentSteps({
  lines = ["Write it in React.", "Render it in Remotion.", "Ship it tonight."],
  highlight = "tonight",
  lineNumbers = true,
  exit = false,
  accent = "#3B5BFD",
  background,
  speed = 1,
  theme = "dark",
}: IndentStepsProps) {
  const raw = useCurrentFrame();
  const frame = raw * speed;
  const { width, height, durationInFrames } = useVideoConfig();
  const p = PALETTES[theme];
  const logical = lines.slice(0, 5);
  const n = Math.max(1, logical.length);

  const portrait = height > width * 1.1;
  const s = portrait
    ? (width / 1280) * 1.55
    : Math.min(width / 1280, height / 720);
  const padX = width * (portrait ? 0.07 : 0.09);
  const gutterEm = lineNumbers ? 0.95 : 0;
  const maxW = width - padX * 2;
  const maxH = height * (portrait ? 0.7 : 0.78);

  const widths = logical.map(textEm);
  const baseFs = (portrait ? 104 : 104) * s;
  const tab = portrait ? 1.1 : 1.5;
  const needEm = gutterEm + Math.max(...widths.map((w, i) => w + i * tab));
  const fitNoWrap = maxW / needEm;
  let fs: number;
  let rows: Row[];
  if (!portrait && fitNoWrap >= baseFs * 0.66) {
    fs = Math.min(baseFs, fitNoWrap);
    rows = wrapRows(logical, () => Number.POSITIVE_INFINITY, highlight);
  } else {
    fs = baseFs * (portrait ? 0.86 : 0.7);
    rows = [];
    for (let k = 0; k < 12; k++) {
      const f = fs;
      rows = wrapRows(logical, (i) => maxW / f - gutterEm - i * tab, highlight);
      const longestWord = Math.max(
        ...logical.flatMap((t, i) =>
          t.split(/\s+/).map((w) => textEm(w) + i * tab + gutterEm),
        ),
      );
      if (rows.length * fs * LINE <= maxH && longestWord * fs <= maxW) break;
      fs *= 0.92;
    }
  }
  const lh = fs * LINE;
  const blockW =
    (gutterEm + Math.max(...rows.map((r) => textEm(r.text) + r.line * tab))) *
    fs;
  const x0 = (width - blockW) / 2 + gutterEm * fs;
  const top = (height - rows.length * lh) / 2;
  const baseline = ((LINE - (ASC + DESC)) / 2 + ASC) * fs;
  const span = logical.map((_, i) => {
    const first = rows.findIndex((r) => r.line === i);
    return { first, count: rows.filter((r) => r.line === i).length };
  });

  const beat = n > 1 ? Math.min(20, 60 / (n - 1)) : 20;
  const enter = (i: number) => 4 + i * beat;
  const tabAt = (i: number) => enter(i) + Math.min(10, beat * 0.5);
  const done = n > 1 ? tabAt(n - 1) + 8 : enter(0) + 16;
  const EXIT = 18;
  const exitStart = durationInFrames - EXIT;
  const outdent = exit
    ? interpolate(raw, [exitStart, exitStart + 8], [0, 1], {
        ...CLAMP,
        easing: EASE_OUT,
      })
    : 0;
  const leave = (r: number) =>
    exit
      ? interpolate(
          raw,
          [exitStart + 6 + r * 2, exitStart + 15 + r * 2],
          [0, 1],
          {
            ...CLAMP,
            easing: EASE_IN,
          },
        )
      : 0;
  const lightT = interpolate(frame, [done - 4, done + 18], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const drift = interpolate(raw, [0, durationInFrames], [0, 1], CLAMP);

  const indent = (i: number) => {
    if (i === 0) return 0;
    const snap = interpolate(frame, [tabAt(i), tabAt(i) + 8], [0, 1], {
      ...CLAMP,
      easing: EASE_SNAP,
    });
    return (i - 1 + snap) * (1 - outdent);
  };
  const rise = (row: Row) =>
    interpolate(
      frame,
      [enter(row.line) + row.sub * 2, enter(row.line) + row.sub * 2 + 16],
      [0, 1],
      {
        ...CLAMP,
        easing: EASE_OUT,
      },
    );

  const transparent = background === "transparent";
  const guideW = Math.max(1, 1.5 * s);

  return (
    <AbsoluteFill
      style={{
        background: transparent ? "transparent" : (background ?? p.bg),
        overflow: "hidden",
      }}
    >
      {!transparent && background === undefined ? (
        <>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: p.ground.join(", "),
              transform: `translate(${(-drift * 2).toFixed(3)}%, ${(-drift * 1.5).toFixed(3)}%) scale(1.06)`,
            }}
          />
          <Grain opacity={p.grain} />
        </>
      ) : null}

      {logical.map((_, i) => {
        const { first, count } = span[i];
        if (first < 0) return null;
        const pos = indent(i);
        const r = rise(rows[first]) * (1 - leave(first));
        if (r <= 0) return null;
        const stops = Math.min(i, Math.ceil(pos - 0.001));
        return Array.from({ length: stops }, (_, k) => {
          const grow = Math.min(1, pos - k);
          const heat =
            k === i - 1
              ? interpolate(frame, [tabAt(i) + 2, tabAt(i) + 20], [1, 0], CLAMP)
              : 0;
          return (
            <div
              key={`${i}-${k}`}
              style={{
                position: "absolute",
                left: x0 + k * tab * fs + fs * 0.03,
                top: top + first * lh - lh * 0.04,
                width: guideW,
                height: count * lh * grow,
                background: heat > 0.01 ? accent : p.guide,
                opacity: (heat > 0.01 ? 0.35 + 0.65 * heat : 1) * r,
              }}
            />
          );
        });
      })}

      {lineNumbers
        ? logical.map((_, i) => {
            const { first } = span[i];
            if (first < 0) return null;
            const r = rise(rows[first]) * (1 - leave(first));
            if (r <= 0) return null;
            const nfs = Math.max(12, fs * 0.22);
            return (
              <div
                key={`n${i}`}
                style={{
                  position: "absolute",
                  left: x0 - gutterEm * fs,
                  width: gutterEm * fs * 0.62,
                  top: top + first * lh + baseline - nfs * 0.98,
                  textAlign: "right",
                  fontFamily: mono.fontFamily,
                  fontWeight: 400,
                  fontSize: nfs,
                  lineHeight: 1,
                  color: p.muted,
                  fontVariantNumeric: "tabular-nums",
                  opacity: r,
                }}
              >
                {i + 1}
              </div>
            );
          })
        : null}

      {rows.map((row, ri) => {
        const r = rise(row);
        if (r <= 0) return null;
        const out = leave(ri);
        const pos = indent(row.line);
        const parts: [string, boolean][] = row.hl
          ? [
              [row.text.slice(0, row.hl[0]), false],
              [row.text.slice(row.hl[0], row.hl[1]), true],
              [row.text.slice(row.hl[1]), false],
            ]
          : [[row.text, false]];
        return (
          <div
            key={`l${ri}`}
            style={{
              position: "absolute",
              left: x0 + pos * tab * fs,
              top: top + ri * lh,
              height: lh,
              overflow: "hidden",
              paddingRight: "0.1em",
              fontFamily: hanken.fontFamily,
              fontWeight: 500,
              fontSize: fs,
              lineHeight: `${lh}px`,
              letterSpacing: `${TRACK}em`,
              whiteSpace: "nowrap",
              color: p.fg,
            }}
          >
            <div
              style={{
                transform: `translateY(${((1 - r) * 100 - out * 100).toFixed(2)}%)`,
              }}
            >
              {parts.map(([text, hl], k) =>
                hl ? (
                  <span key={k} style={{ position: "relative" }}>
                    <span style={{ opacity: 1 - lightT }}>{text}</span>
                    <span
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        opacity: lightT,
                        backgroundImage: p.highlight,
                        backgroundSize: "160% 100%",
                        backgroundPosition: `${(drift * 60).toFixed(2)}% 0%`,
                        WebkitBackgroundClip: "text",
                        backgroundClip: "text",
                        color: "transparent",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {text}
                    </span>
                  </span>
                ) : (
                  <Fragment key={k}>{text}</Fragment>
                ),
              )}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
}
