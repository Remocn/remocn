"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sans } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});
const { fontFamily: serif } = loadSerif("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface OvalTypeProps {
  /** The poster row: one word per capsule, in reading order. */
  tagline?: string[];
  /** Words that ride the capsules past the frame before the tagline lands. */
  words?: string[];
  /** Index of the tagline word set in Instrument Serif italic; -1 for none. */
  accentWord?: number;
  /** Frames between two conveyor steps. */
  beat?: number;
  /** Kept for the shared draft API; the capsules take the "mesh" field. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

/**
 * Beat sheet (30fps, speed 1, beat 9, six conveyor words):
 *   0–6    three capsules hold, each with a word; a fourth peeks in.
 *   6–58   the row steps one capsule left per beat. Capsules stretch wide
 *          while they travel, squash and bounce tall when they land; the
 *          leading capsule moves first, so the gaps breathe.
 *  58–78   the tagline lands: the capsules stretch up into tall poster ovals,
 *          the words grow, the gaps close.
 *  78–     poster hold; the blurred field keeps drifting inside the ovals.
 */
const FIRST_STEP = 6;
const MOVE = 7;
const LAND_LEN = 18;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;
const STEP = Easing.bezier(0.6, 0, 0.2, 1);
const GROW = Easing.bezier(0.25, 1.15, 0.4, 1);

/** Instrument Sans 500 advance widths (per mille) for ASCII 32–126. */
const SANS = [
  197, 284, 417, 721, 623, 786, 761, 244, 423, 423, 419, 538, 265, 499, 265,
  444, 671, 389, 551, 577, 607, 578, 607, 546, 590, 615, 265, 265, 538, 538,
  538, 574, 860, 731, 640, 744, 753, 634, 598, 764, 731, 254, 441, 702, 589,
  902, 731, 790, 661, 796, 660, 623, 656, 708, 731, 1088, 697, 688, 627, 423,
  444, 423, 538, 446, 354, 546, 613, 543, 613, 567, 362, 613, 606, 250, 250,
  546, 250, 931, 606, 591, 613, 613, 383, 483, 392, 596, 530, 783, 569, 530,
  505, 423, 238, 423, 538,
];
/** Instrument Serif italic 400 advance widths (per mille) for ASCII 32–126. */
const SERIF_IT = [
  170, 275, 374, 629, 424, 591, 525, 235, 346, 346, 449, 531, 219, 426, 219,
  258, 461, 248, 404, 373, 394, 387, 411, 365, 437, 414, 299, 301, 531, 531,
  531, 358, 665, 457, 479, 475, 536, 454, 411, 514, 545, 250, 251, 499, 414,
  665, 542, 540, 469, 541, 525, 424, 461, 537, 458, 653, 545, 478, 427, 326,
  256, 326, 431, 372, 355, 474, 431, 351, 474, 348, 273, 401, 476, 288, 266,
  447, 240, 745, 521, 414, 450, 425, 368, 302, 272, 508, 412, 609, 450, 418,
  385, 320, 252, 320, 531,
];
const TRACK = -0.03;
/** The serif italic runs small next to the grotesk; it gets a size bump. */
const SERIF_BUMP = 1.22;

function measure(word: string, table: number[], track: number) {
  let w = 0;
  for (const ch of word) {
    const c = ch.charCodeAt(0);
    w += (c >= 32 && c < 127 ? table[c - 32] : 600) / 1000 + track;
  }
  return w - track;
}

// gradients.sh "mesh" (bg #0a0d24, [#ecdcf2, #8796ee, #2e45b7, #0e1645]) on
// dark: a pale lilac field with blue blooms at the capsule ends, so the ink
// word in the middle keeps its contrast. On light: "pixel-glass" blooms over
// a deep blue field with white words.
const THEMES = {
  dark: {
    stage: "#0A0A0B",
    word: "#0B0B10",
    base: "#ecdcf2",
    blooms: ["#2e45b7", "#8796ee"],
    mid: "#c9c3f4",
    grain: 0.06,
  },
  light: {
    stage: "#F5F4F0",
    word: "#FFFFFF",
    base: "#3d5bff",
    blooms: ["#ff4fb8", "#7a3cff"],
    mid: "#3d6bff",
    grain: 0.04,
  },
} as const;

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
          seed={17}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function OvalType({
  tagline = ["Make", "it", "move"],
  words = ["Plan", "Cut", "Edit", "Loop", "Sync", "Draft"],
  accentWord = 1,
  beat = 9,
  theme = "dark",
  speed = 1,
}: OvalTypeProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];

  const row = tagline.length > 0 ? tagline : ["Make"];
  const n = row.length;
  const items = [...words, ...row];
  const m = words.length;
  const isAccent = (k: number) => k - m === accentWord;

  const gapLoose = 0.026 * W;
  const gapTight = 0.014 * W;
  const ow = (W * 0.88 - (n - 1) * gapLoose) / n;
  const pitch = ow + gapLoose;
  const rowLeft = (W - (n * ow + (n - 1) * gapLoose)) / 2;

  // One type size for every word, set by the widest one.
  const widest = Math.max(
    ...items.map((w, k) =>
      isAccent(k)
        ? measure(w, SERIF_IT, 0) * SERIF_BUMP
        : measure(w, SANS, TRACK),
    ),
  );
  const fsPoster = Math.min((ow * 0.78) / widest, H * 0.2);

  const lastEnd = FIRST_STEP + (m - 1) * beat + MOVE;
  const posterAt = lastEnd + 2;

  // Conveyor position in slots, with a per-capsule lag: the leader moves first.
  const offsetAt = (time: number) => {
    let s = 0;
    for (let j = 0; j < m; j++) {
      const at = FIRST_STEP + j * beat;
      s += STEP(interpolate(time, [at, at + MOVE], [0, 1], CLAMP));
    }
    return s;
  };
  const s0 = offsetAt(t);

  const cy = H / 2;
  const fieldShift = t * 0.6;
  const field = [
    `radial-gradient(46% 26% at ${22 + fieldShift * 0.25}% ${6 + 3 * Math.sin(t * 0.05)}%, ${c.blooms[0]} 0%, transparent 74%)`,
    `radial-gradient(40% 24% at ${78 - fieldShift * 0.22}% ${95 - 3 * Math.sin(t * 0.045)}%, ${c.blooms[0]} 0%, transparent 74%)`,
    `radial-gradient(55% 48% at ${64 - fieldShift * 0.2}% ${26 + 4 * Math.cos(t * 0.04)}%, ${c.blooms[1]} 0%, transparent 70%)`,
    `radial-gradient(52% 46% at ${30 + fieldShift * 0.2}% ${82 + 3 * Math.cos(t * 0.05)}%, ${c.blooms[1]} 0%, transparent 70%)`,
    `radial-gradient(40% 40% at ${50 + 20 * Math.sin(t * 0.03)}% 50%, ${c.mid} 0%, transparent 75%)`,
    c.base,
  ].join(", ");

  const capsules = items.map((word, k) => {
    // Lag by where the capsule sits in the row: leftmost leads.
    const slotNow = k - s0;
    const lag = Math.max(0, Math.min(n, slotNow)) * 1.2;
    const s = offsetAt(t - lag);
    const v = (offsetAt(t - lag + 0.5) - offsetAt(t - lag - 0.5)) / 1;
    const slot = k - s;

    // Landing bounce after each step: tall, then settle.
    let bump = 0;
    for (let j = 0; j < m; j++) {
      const end = FIRST_STEP + j * beat + MOVE + lag;
      const dt = t - end;
      if (dt > 0 && dt < 12) {
        bump += Math.sin((dt / 12) * Math.PI * 2) * Math.exp(-dt / 4);
      }
    }

    const fi = k - m;
    const growAt = posterAt + Math.max(0, fi) * 2;
    const grow =
      fi >= 0
        ? GROW(interpolate(t, [growAt, growAt + LAND_LEN], [0, 1], CLAMP))
        : 0;
    const gap = gapLoose + (gapTight - gapLoose) * grow;
    const pitchNow = ow + gap;
    const rowW = n * ow + (n - 1) * gap;
    const left = (W - rowW) / 2;

    // A tall / short / mid rhythm along the conveyor; the poster evens it out.
    const rhythm = [1, 0.8, 0.9][k % 3];
    const baseH = H * (0.7 * (rhythm + (1 - rhythm) * grow) + 0.18 * grow);
    const wStretch = 1 + 0.55 * v + 0.05 * bump;
    const hStretch = 1 - 0.3 * v - 0.06 * bump;
    const w = ow * wStretch;
    const h = baseH * hStretch;
    // Slots keep their conveyor pitch until the poster closes the gaps.
    const x =
      (grow > 0 ? left + slot * pitchNow : rowLeft + slot * pitch) + ow / 2;
    // Capsules that already passed slide out as the poster row closes up.
    const clear =
      fi < 0
        ? GROW(interpolate(t, [posterAt, posterAt + LAND_LEN], [0, 1], CLAMP)) *
          (ow + 0.1 * W)
        : 0;
    const fs = fsPoster * (0.84 + 0.16 * grow) * (isAccent(k) ? SERIF_BUMP : 1);
    return { key: `${k}-${word}`, word, k, x: x - clear, w, h, fs };
  });

  return (
    <AbsoluteFill style={{ background: c.stage, overflow: "hidden" }}>
      {capsules.map((q) => {
        if (q.x + q.w / 2 < -20 || q.x - q.w / 2 > W + 20) return null;
        const left = q.x - q.w / 2;
        const top = cy - q.h / 2;
        return (
          <div
            key={q.key}
            style={{
              position: "absolute",
              left,
              top,
              width: q.w,
              height: q.h,
              borderRadius: Math.min(q.w, q.h) / 2,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: -left,
                top: -top,
                width: W,
                height: H,
                background: field,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: c.word,
                fontFamily: isAccent(q.k) ? serif : sans,
                fontStyle: isAccent(q.k) ? "italic" : "normal",
                fontWeight: isAccent(q.k) ? 400 : 500,
                fontSize: q.fs,
                letterSpacing: isAccent(q.k) ? "0em" : `${TRACK}em`,
                lineHeight: 1,
                whiteSpace: "nowrap",
                fontKerning: "normal",
              }}
            >
              {q.word}
            </div>
          </div>
        );
      })}
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
