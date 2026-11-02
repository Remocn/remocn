"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { useLayoutEffect, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const face = loadFont("normal", { weights: ["400"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["500"], subsets: ["latin"] });

export interface CursorFrameProps {
  /** The headline set inside the text frame. */
  title?: string;
  /** Selection colour: frame, handles and the size badge. */
  accent?: string;
  theme?: "dark" | "light";
  speed?: number;
}

const THEMES = {
  light: { bg: "#FAFAF9", fg: "#0E0E0D", handle: "#FFFFFF" },
  dark: { bg: "#0A0A0A", fg: "#F2F2F0", handle: "#FFFFFF" },
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_DRAG = Easing.bezier(0.45, 0, 0.2, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Beats, in frames at 30fps (before `speed`).
const ENTER = 0;
const ENTER_LEN = 24;
const PRESS = 25;
const DRAG = 28;
const DRAG_END = 70;
const GRAB = 80;
const RESIZE = 86;
const RESIZE_END = 134;
const RELEASE = 140;
const CLEAR = 150;
const RECENTRE = 148;
const RECENTRE_LEN = 36;
const WORD_IN = 12;
const LINE_HEIGHT = 1.1;
const WRAP_IN = 11;
/** How far a wrapping word drifts out and slides in, in em. */
const WRAP_SLIDE = 0.3;

interface Metrics {
  words: number[];
  space: number;
}

interface Placed {
  x: number;
  y: number;
}

/** Greedy line breaking at a given box width. */
function breakLines(m: Metrics, boxW: number, lineH: number) {
  const pos: Placed[] = [];
  let x = 0;
  let line = 0;
  let maxW = 0;
  m.words.forEach((w, i) => {
    if (i > 0 && x + m.space + w > boxW + 0.5) {
      line++;
      x = 0;
    } else if (i > 0) {
      x += m.space;
    }
    pos.push({ x, y: line * lineH });
    x += w;
    maxW = Math.max(maxW, x);
  });
  return { pos, lines: line + 1, maxW };
}

/** The narrowest two-line box: the most balanced split of the words. */
function twoLineWidth(m: Metrics) {
  let best = Number.POSITIVE_INFINITY;
  for (let k = 1; k < m.words.length; k++) {
    const a = m.words.slice(0, k);
    const b = m.words.slice(k);
    const wa = a.reduce((s, w) => s + w, 0) + (a.length - 1) * m.space;
    const wb = b.reduce((s, w) => s + w, 0) + (b.length - 1) * m.space;
    best = Math.min(best, Math.max(wa, wb));
  }
  return best;
}

function ArrowCursor({ size }: { size: number }) {
  return (
    <svg
      viewBox="-2 -2 20 30"
      width={(size * 20) / 30}
      height={size}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <path
        d="M0 0 L0 21.6 L5 16.9 L8.5 25.1 L12 23.6 L8.6 15.5 L15.4 15.5 Z"
        fill="#000"
        stroke="#fff"
        strokeWidth={1.7}
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  );
}

function ResizeCursor({ size }: { size: number }) {
  return (
    <svg
      viewBox="-15 -15 30 30"
      width={size}
      height={size}
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <path
        d="M-10.5 0 L-4.6 -5.9 L-4.6 -2.1 L4.6 -2.1 L4.6 -5.9 L10.5 0 L4.6 5.9 L4.6 2.1 L-4.6 2.1 L-4.6 5.9 Z"
        transform="rotate(45)"
        fill="#000"
        stroke="#fff"
        strokeWidth={1.7}
        strokeLinejoin="round"
        paintOrder="stroke"
      />
    </svg>
  );
}

export function CursorFrame({
  title = "Launch videos, in code.",
  accent = "#3B5BFD",
  theme = "light",
  speed = 1,
}: CursorFrameProps) {
  const frame = useCurrentFrame() * speed;
  const { width, height } = useVideoConfig();
  const t = THEMES[theme];
  const words = title.split(/\s+/).filter(Boolean);
  const u = width / 1280;

  const fontSize = Math.round(width * 0.068);
  const lineH = fontSize * LINE_HEIGHT;

  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const spaceRef = useRef<HTMLSpanElement>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [handle] = useState(() => delayRender("cursor-frame: measuring"));
  const released = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measure when the copy or size changes
  useLayoutEffect(() => {
    let live = true;
    face
      .waitUntilDone()
      .catch(() => undefined)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!live) return;
        const space = spaceRef.current;
        if (space) {
          const next: Metrics = {
            words: wordRefs.current
              .slice(0, words.length)
              .map((el) => el?.offsetWidth ?? 0),
            space: space.offsetWidth,
          };
          setMetrics((prev) =>
            prev &&
            prev.space === next.space &&
            prev.words.join() === next.words.join()
              ? prev
              : next,
          );
        }
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [title, fontSize, handle]);

  const m = metrics ?? { words: words.map(() => 0), space: 0 };
  const wide = breakLines(m, Number.POSITIVE_INFINITY, lineH);
  const W1 = wide.maxW + fontSize * 0.04;
  const W2 = twoLineWidth(m) + fontSize * 0.04;
  const H1 = lineH;
  const x0 = width / 2 - W1 / 2;
  const y0 = height / 2 - H1 / 2;

  // Box width the hand asks for at frame f (the corner follows the cursor).
  const dragX = (f: number) =>
    interpolate(f, [DRAG, DRAG_END], [0, 1], { ...clamp, easing: EASE_DRAG });
  const dragY = (f: number) =>
    interpolate(f, [DRAG, DRAG + 14], [0, 1], { ...clamp, easing: EASE_OUT });
  const boxW = (f: number) =>
    f < RESIZE
      ? W1 * dragX(f)
      : interpolate(f, [RESIZE, RESIZE_END], [W1, W2], {
          ...clamp,
          easing: EASE_IN_OUT,
        });

  // Reflow: a word that keeps its line slides to its new slot on a critically
  // damped spring. A word that wraps leaves a fading ghost drifting on at the
  // old line end and slides in fresh at the start of the next, so no two
  // words ever cross.
  const settleAt = (f: number) => {
    const start = breakLines(m, W1, lineH);
    const pos = start.pos.map((p) => ({
      ...p,
      vx: 0,
      wrap: -1e4,
      fromX: 0,
      fromY: 0,
    }));
    let h = lineH * start.lines;
    let vh = 0;
    const w = 0.6;
    const wh = 0.6;
    const end = Math.min(f, RESIZE_END + 60);
    for (let s = RESIZE; s <= end; s++) {
      const target = breakLines(m, boxW(s), lineH);
      pos.forEach((p, i) => {
        const tp = target.pos[i] ?? p;
        if (Math.abs(tp.y - p.y) > 0.5) {
          p.wrap = s;
          p.fromX = p.x;
          p.fromY = p.y;
          p.x = tp.x;
          p.y = tp.y;
          p.vx = 0;
        }
        p.vx += (tp.x - p.x) * w * w - 2 * w * p.vx;
        p.x += p.vx;
      });
      vh += (target.lines * lineH - h) * wh * wh - 2 * wh * vh;
      h += vh;
    }
    return { pos, h };
  };
  const fA = Math.floor(frame);
  const a = settleAt(fA);
  const b = settleAt(fA + 1);
  const fr = frame - fA;
  const wordPos = a.pos.map((p, i) => {
    const q = b.pos[i];
    return q && q.wrap === p.wrap ? { ...p, x: p.x + (q.x - p.x) * fr } : p;
  });
  const settledH = a.h + (b.h - a.h) * fr;

  const fw = boxW(frame);
  const fh = frame < RESIZE ? H1 * dragY(frame) : settledH;

  // When does the growing frame first pass each word's centre?
  const wordIn = wide.pos.map((p, i) => {
    const centre = p.x + (m.words[i] ?? 0) * 0.5;
    for (let f = DRAG; f <= DRAG_END; f++) if (boxW(f) >= centre) return f - 4;
    return DRAG_END;
  });

  // Cursor: glides in, presses, drags the corner out, swaps to the resize
  // arrows, drags the corner in, lets go and drifts off.
  const enter = interpolate(frame, [ENTER, ENTER + ENTER_LEN], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  const leave = interpolate(frame, [RELEASE + 6, RELEASE + 34], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  let cx = x0;
  let cy = y0;
  if (frame < DRAG) {
    cx = interpolate(enter, [0, 1], [x0 + width * 0.16, x0]);
    cy = interpolate(enter, [0, 1], [y0 + height * 0.2, y0]);
  } else {
    cx = x0 + fw;
    cy = y0 + fh;
  }
  cx += leave * width * 0.1;
  cy += leave * height * 0.12;
  const cursorOpacity =
    interpolate(frame, [ENTER, ENTER + 8], [0, 1], clamp) *
    interpolate(frame, [RELEASE + 14, RELEASE + 34], [1, 0], clamp);
  const press =
    interpolate(frame, [PRESS, PRESS + 3], [0, 1], clamp) -
    interpolate(frame, [DRAG_END, DRAG_END + 3], [0, 1], clamp) +
    interpolate(frame, [RESIZE - 3, RESIZE], [0, 1], clamp) -
    interpolate(frame, [RESIZE_END + 4, RESIZE_END + 7], [0, 1], clamp);
  const resizeIcon =
    interpolate(frame, [GRAB, GRAB + 3], [0, 1], clamp) -
    interpolate(frame, [RELEASE, RELEASE + 3], [0, 1], clamp);
  const cursorSize = 30 * u * (1 - press * 0.06);

  // Selection chrome: appears with the drag, clears once the text is set.
  const chromeIn = interpolate(frame, [DRAG, DRAG + 4], [0, 1], clamp);
  const clear = interpolate(frame, [CLEAR, CLEAR + 14], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const chrome = chromeIn * (1 - clear);
  const handlesIn = interpolate(frame, [DRAG + 2, DRAG + 12], [0, 1], {
    ...clamp,
    easing: EASE_OUT,
  });
  const handleScale = (0.5 + 0.5 * handlesIn) * (1 - clear * 0.5);

  // Once the frame is gone, the text block glides to the optical centre.
  const re = interpolate(frame, [RECENTRE, RECENTRE + RECENTRE_LEN], [0, 1], {
    ...clamp,
    easing: EASE_IN_OUT,
  });
  const finalH = breakLines(m, W2, lineH).lines * lineH;
  const shiftX = re * (W1 - W2) * 0.5;
  const shiftY = re * (H1 - finalH) * 0.5;

  const stroke = Math.max(1, 1.5 * u);
  const hs = 9 * u;
  const corners = [
    [0, 0],
    [fw, 0],
    [0, fh],
    [fw, fh],
  ];
  const badgeSize = 13 * u;

  return (
    <AbsoluteFill style={{ background: t.bg, overflow: "hidden" }}>
      {/* measuring row: never shown */}
      <div
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "pre",
          fontFamily: face.fontFamily,
          fontSize,
          fontWeight: 400,
          letterSpacing: "-0.035em",
        }}
      >
        {words.map((w, i) => (
          <span
            key={i}
            ref={(el) => {
              wordRefs.current[i] = el;
            }}
            style={{ display: "inline-block" }}
          >
            {w}
          </span>
        ))}
        <span ref={spaceRef} style={{ display: "inline-block" }}>
          {" "}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: x0 + shiftX,
          top: y0 + shiftY,
          width: 0,
          height: 0,
          opacity: metrics ? 1 : 0,
        }}
      >
        {words.map((w, i) => {
          const p = interpolate(
            frame,
            [wordIn[i] ?? DRAG, (wordIn[i] ?? DRAG) + WORD_IN],
            [0, 1],
            { ...clamp, easing: EASE_OUT },
          );
          const pos = wordPos[i] ?? {
            x: 0,
            y: 0,
            wrap: -1e4,
            fromX: 0,
            fromY: 0,
          };
          const wrapP = interpolate(
            frame,
            [pos.wrap + 4, pos.wrap + 4 + WRAP_IN],
            [0, 1],
            {
              ...clamp,
              easing: EASE_OUT,
            },
          );
          const ghostP = interpolate(
            frame,
            [pos.wrap, pos.wrap + WRAP_IN],
            [0, 1],
            {
              ...clamp,
              easing: EASE_OUT,
            },
          );
          const style = {
            position: "absolute",
            whiteSpace: "pre",
            fontFamily: face.fontFamily,
            fontSize,
            fontWeight: 400,
            letterSpacing: "-0.035em",
            lineHeight: LINE_HEIGHT,
            color: t.fg,
          } as const;
          const inP = p * wrapP;
          return (
            <span key={i}>
              {ghostP < 1 ? (
                <span
                  style={{
                    ...style,
                    left: pos.fromX + ghostP * fontSize * WRAP_SLIDE,
                    top: pos.fromY,
                    opacity: 1 - ghostP,
                    filter: `blur(${ghostP * 6}px)`,
                  }}
                >
                  {w}
                </span>
              ) : null}
              <span
                style={{
                  ...style,
                  left: pos.x,
                  top: pos.y,
                  opacity: inP,
                  filter: inP < 1 ? `blur(${(1 - inP) * 8}px)` : undefined,
                  transform: `translateY(${(1 - p) * fontSize * 0.12 - (1 - wrapP) * fontSize * 0.22}px)`,
                }}
              >
                {w}
              </span>
            </span>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: fw,
            height: fh,
            boxShadow: `inset 0 0 0 ${stroke}px ${accent}`,
            opacity: chrome,
          }}
        />
        {corners.map(([hx, hy]) => (
          <div
            key={`${hx === 0 ? "l" : "r"}${hy === 0 ? "t" : "b"}`}
            style={{
              position: "absolute",
              left: hx - hs / 2,
              top: hy - hs / 2,
              width: hs,
              height: hs,
              boxSizing: "border-box",
              background: t.handle,
              border: `${stroke}px solid ${accent}`,
              borderRadius: 1.5 * u,
              opacity: chrome * handlesIn,
              transform: `scale(${handleScale})`,
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: fw / 2,
            top: fh + 10 * u,
            transform: "translateX(-50%)",
            padding: `${3 * u}px ${6 * u}px`,
            borderRadius: 4 * u,
            background: accent,
            color: "#FFFFFF",
            fontFamily: mono.fontFamily,
            fontWeight: 500,
            fontSize: badgeSize,
            lineHeight: 1.2,
            letterSpacing: "0.01em",
            fontVariantNumeric: "tabular-nums",
            whiteSpace: "pre",
            opacity: chrome * handlesIn,
          }}
        >
          {`${Math.round(fw)} × ${Math.round(fh)}`}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: cx + shiftX,
          top: cy + shiftY,
          opacity: metrics ? cursorOpacity : 0,
          filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.28))",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            opacity: 1 - resizeIcon,
          }}
        >
          <ArrowCursor size={cursorSize} />
        </div>
        <div
          style={{
            position: "absolute",
            left: -cursorSize * 0.5,
            top: -cursorSize * 0.5,
            opacity: resizeIcon,
          }}
        >
          <ResizeCursor size={cursorSize} />
        </div>
      </div>
    </AbsoluteFill>
  );
}
