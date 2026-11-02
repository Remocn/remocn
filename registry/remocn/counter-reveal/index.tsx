"use client";

import { loadFont } from "@remotion/google-fonts/Sora";
import { useId, useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily: sora } = loadFont("normal", {
  weights: ["500"],
  subsets: ["latin"],
});

export interface CounterRevealProps {
  /**
   * Huge front word. Letters with embedded outlines (the default "Beta")
   * get real counter windows; any other letter falls back to live text.
   */
  word?: string;
  /** The line seen through the counters, then revealed in full. */
  line?: string;
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

// Sora 500 advance widths (per 1000 em) for ASCII 32–126, and full outlines
// (outer contours + counters, overlaps removed) for the default word, in the
// same units with the baseline at y = 0, y down. Extracted offline from the
// Google Fonts Sora build (fontTools + skia-pathops).
const SORA_500 = [
  222, 303, 452, 702, 652, 864, 702, 264, 382, 382, 568, 592, 266, 506, 266,
  365, 750, 423, 623, 620, 652, 630, 668, 585, 647, 668, 266, 266, 592, 590,
  592, 556, 1124, 765, 684, 797, 788, 598, 560, 832, 803, 320, 641, 703, 549,
  937, 858, 865, 649, 865, 710, 682, 602, 785, 719, 1052, 705, 654, 652, 382,
  365, 382, 587, 581, 300, 581, 694, 608, 694, 616, 380, 679, 644, 317, 324,
  595, 296, 973, 644, 678, 694, 694, 414, 543, 429, 634, 572, 873, 574, 555,
  493, 382, 375, 382, 511,
];

const GLYPHS: Record<string, { outer: string; holes: string }> = {
  B: {
    outer:
      "M98 4V-735H348Q470 -735 532 -684Q594 -632 594 -536V-522Q594 -454 562 -414Q543 -390 516 -374Q563 -357 592 -321Q624 -281 624 -212V-198Q624 -134 596 -88Q569 -43 514 -20Q460 4 378 4Z",
    holes:
      "M217 -320V-96H390Q444 -96 474 -126Q503 -156 503 -208Q503 -261 474 -290Q445 -320 390 -320ZM217 -635V-416H363Q420 -416 446 -446Q473 -477 473 -525Q473 -574 446 -604Q420 -635 363 -635Z",
  },
  e: {
    outer:
      "M321 18Q251 18 199 -6Q147 -30 114 -70Q81 -109 64 -158Q48 -208 48 -260V-279Q48 -332 64 -382Q81 -431 114 -470Q147 -510 198 -534Q248 -557 315 -557Q402 -557 460 -519Q518 -481 547 -420Q576 -360 576 -290V-243H160Q163 -204 176 -172Q193 -130 229 -106Q265 -81 321 -81Q377 -81 413 -106Q449 -130 457 -163H566Q555 -108 522 -67Q488 -26 437 -4Q386 18 321 18Z",
    holes:
      "M163 -322H462Q458 -351 448 -375Q431 -415 398 -436Q365 -458 315 -458Q263 -458 228 -434Q193 -410 176 -368Q167 -347 163 -322Z",
  },
  t: {
    outer:
      "M307 6Q240 6 194 -12Q148 -30 124 -74Q101 -118 101 -193V-452H12V-539H101V-696H212V-539H388V-452H212V-183Q212 -141 234 -118Q257 -96 298 -96H388V6Z",
    holes: "",
  },
  a: {
    outer:
      "M411 0V-105Q405 -83 394 -65Q372 -27 332 -6Q293 14 236 14Q177 14 133 -6Q89 -27 65 -66Q41 -106 41 -161Q41 -219 68 -257Q96 -295 147 -314Q198 -333 269 -333H392V-343Q392 -393 366 -419Q340 -445 289 -445Q261 -445 227 -444Q193 -443 160 -442Q128 -440 103 -438V-539Q125 -541 152 -542Q178 -544 206 -545Q235 -546 261 -546Q343 -546 397 -525Q451 -504 478 -458Q504 -413 504 -337V0Z",
    holes:
      "M392 -256H266Q213 -256 185 -230Q157 -205 157 -164Q157 -123 185 -98Q213 -74 266 -74Q297 -74 325 -86Q353 -97 372 -124Q390 -151 392 -200Z",
  },
};

const CAP = 0.73;
const WORD_TRACK = -0.03;
const LINE_TRACK = -0.035;
const WORD_SPACE = 0.24;

// Beats (frames at 30fps).
const ENTER = -6; // first letter is already mid-rise on frame 0
const ENTER_LEN = 20;
const STAGGER = 3;
const EXIT = 66;
const EXIT_LEN = 26;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.7, 0, 0.3, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// The ground under the plate is a gradients.sh palette: "mesh" (blue family,
// sits with the accent) for dark, "pixel-glass" for light. `tint` is the line
// while it is seen through the counters, `ink` once it is uncovered.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    ink: "#F5F4F0",
    tint: "#0A0F33",
    grain: 0.07,
    ground: "#0a0d24",
    blobs: [
      ["#ecdcf2", 86, 94, 30],
      ["#2e45b7", 16, 20, 100],
      ["#8796ee", 84, 22, 62],
      ["#0e1645", 20, 86, 100],
      ["accent", 52, 50, 58],
    ],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    ink: "#121214",
    tint: "#2B1D6E",
    grain: 0.045,
    ground: "#f4f3f1",
    blobs: [
      ["#7a3cff", 18, 24, 78],
      ["#ff4fb8", 84, 28, 62],
      ["#3d6bff", 72, 88, 82],
      ["accent", 24, 82, 50],
    ],
  },
} as const;

export const counterRevealDuration = EXIT + EXIT_LEN + 40;

function advance(ch: string) {
  const code = ch.charCodeAt(0);
  return (code >= 32 && code < 127 ? SORA_500[code - 32] : 640) / 1000;
}

function layoutRow(text: string, track: number) {
  const chars = Array.from(text);
  const xs: number[] = [];
  let x = 0;
  chars.forEach((ch, i) => {
    xs.push(x);
    const a = ch === " " ? WORD_SPACE : advance(ch);
    x += a + (i < chars.length - 1 ? track : 0);
  });
  return { chars, xs, width: x };
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
          seed={29}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

export function CounterReveal({
  word = "Beta",
  line = "Out now.",
  accent = "#3B5BFD",
  theme = "dark",
  speed = 1,
}: CounterRevealProps) {
  const t = useCurrentFrame() * speed;
  const { width: W, height: H } = useVideoConfig();
  const c = THEMES[theme];
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");

  const front = useMemo(() => layoutRow(word, WORD_TRACK), [word]);
  const back = useMemo(() => layoutRow(line, LINE_TRACK), [line]);

  // Front word fills the frame edge to edge.
  const F = Math.min((W * 0.96) / front.width, (H * 0.66) / CAP);
  const wordLeft = W / 2 - (front.width * F) / 2;
  const baseline = H / 2 + (CAP * F) / 2;

  // Back line at poster size; while it hides behind the windows it is set
  // much larger and darker, so its strokes register inside the counters.
  const B = Math.min((W * 0.86) / back.width, (H * 0.34) / CAP);
  const lineLeft = W / 2 - (back.width * B) / 2;
  const lineBase = H / 2 + (CAP * B) / 2;
  const end = EXIT + EXIT_LEN;
  const drift = EASE_IO(interpolate(t, [0, end], [0, 1], CLAMP));
  const lineShift = (1 - drift) * W * 0.45;
  const shrink = EASE_IO(interpolate(t, [EXIT - 6, end + 4], [0, 1], CLAMP));
  const settle = interpolate(t, [end, end + 36], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  const lineScale = (1.9 - 0.9 * shrink) * (1 + 0.03 * settle);
  const tint = c.tint;
  // Blobs drift a few percent over the shot, deterministic in frame.
  const flow = interpolate(t, [0, counterRevealDuration], [0, 1], CLAMP);
  const ground = [
    ...c.blobs.map(([col, x, y, a], i) => {
      const dx = (i % 2 ? -5 : 5) * flow;
      const dy = (i % 3 === 0 ? 4 : -3) * flow;
      const cc = col === "accent" ? accent : col;
      return `radial-gradient(85% 95% at ${x + dx}% ${y + dy}%, color-mix(in oklab, ${cc} ${a}%, transparent) 0%, transparent 68%)`;
    }),
    c.ground,
  ].join(", ");

  const exit = EASE_IO(interpolate(t, [EXIT, end], [0, 1], CLAMP));
  const plateY = -exit * H * 1.04;
  const push = 1 + 0.025 * interpolate(t, [ENTER_LEN, EXIT], [0, 1], CLAMP);
  // Screen y of the plate's trailing edge: below it the line is already
  // uncovered and shows in its final ink; through the windows it stays dark.
  const edgeY = plateY + baseline + (H - baseline) * push;

  const rise = (i: number) =>
    EASE_OUT(
      interpolate(
        t,
        [ENTER + i * STAGGER, ENTER + i * STAGGER + ENTER_LEN],
        [0, 1],
        CLAMP,
      ),
    );
  const glyphAt = (i: number) =>
    `translate(${wordLeft + front.xs[i] * F} ${baseline + (1 - rise(i)) * CAP * F * 1.08}) scale(${F / 1000})`;

  const maskId = `m${uid}`;
  const clipId = `c${uid}`;
  const edgeId = `e${uid}`;
  // Holes in the plate overshoot by a hair; the glyph drawn on top hides it.
  const pad = (Math.max(1.5, 0.004 * F) * 1000) / F;

  return (
    <AbsoluteFill style={{ background: c.ground, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: ground }} />
      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{ position: "absolute", inset: 0 }}
        aria-hidden
      >
        <defs>
          <clipPath id={clipId}>
            <rect
              x={-W}
              y={-H}
              width={W * 3}
              height={H + baseline + 0.02 * F}
            />
          </clipPath>
          <clipPath id={edgeId}>
            <rect x={0} y={edgeY} width={W} height={Math.max(0, H - edgeY)} />
          </clipPath>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="white" />
            <g clipPath={`url(#${clipId})`}>
              {front.chars.map((ch, i) => {
                const g = GLYPHS[ch];
                if (!g?.holes) return null;
                return (
                  <path
                    key={`${i}-${ch}`}
                    d={g.holes}
                    fill="black"
                    stroke="black"
                    strokeWidth={pad}
                    strokeLinejoin="round"
                    transform={glyphAt(i)}
                  />
                );
              })}
            </g>
          </mask>
        </defs>

        <g
          transform={`translate(${W / 2 + lineShift} ${H / 2}) scale(${lineScale}) translate(${-W / 2} ${-H / 2})`}
        >
          <text
            x={back.xs.map((x) => lineLeft + x * B).join(" ")}
            y={lineBase}
            fontFamily={sora}
            fontWeight={500}
            fontSize={B}
            fill={tint}
            style={{ fontOpticalSizing: "none" }}
          >
            {back.chars.join("")}
          </text>
        </g>

        <g transform={`translate(0 ${plateY})`}>
          <g
            transform={`translate(${W / 2} ${baseline}) scale(${push}) translate(${-W / 2} ${-baseline})`}
          >
            <rect
              x={-W}
              y={-H}
              width={W * 3}
              height={H * 2}
              fill={c.bg}
              mask={`url(#${maskId})`}
            />
            <g clipPath={`url(#${clipId})`} fill={c.fg}>
              {front.chars.map((ch, i) => {
                const g = GLYPHS[ch];
                if (g) {
                  return (
                    <path
                      key={`${i}-${ch}`}
                      d={g.outer + g.holes}
                      fillRule="evenodd"
                      transform={glyphAt(i)}
                    />
                  );
                }
                return (
                  <text
                    key={`${i}-${ch}`}
                    transform={glyphAt(i)}
                    fontFamily={sora}
                    fontWeight={500}
                    fontSize={1000}
                    style={{ fontOpticalSizing: "none" }}
                  >
                    {ch}
                  </text>
                );
              })}
            </g>
          </g>
        </g>
        <g clipPath={`url(#${edgeId})`}>
          <g
            transform={`translate(${W / 2 + lineShift} ${H / 2}) scale(${lineScale}) translate(${-W / 2} ${-H / 2})`}
          >
            <text
              x={back.xs.map((x) => lineLeft + x * B).join(" ")}
              y={lineBase}
              fontFamily={sora}
              fontWeight={500}
              fontSize={B}
              fill={c.ink}
              style={{ fontOpticalSizing: "none" }}
            >
              {back.chars.join("")}
            </text>
          </g>
        </g>
      </svg>
      <Grain opacity={c.grain} />
    </AbsoluteFill>
  );
}
