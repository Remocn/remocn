"use client";

import { loadFont } from "@remotion/google-fonts/Outfit";
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

const outfit = loadFont("normal", {
  weights: ["400", "500"],
  subsets: ["latin"],
});

export interface OutOfContextProps {
  claim?: string;
  rest?: string;
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
const PITCH = 1.02;
const MEASURE_PX = 100;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_CAM = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_DROP = Easing.bezier(0.55, 0, 0.8, 0.4);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const IN_LEN = 14;
const IN_STAGGER = 4;
const DROP_AT = 40;
const DROP_LEN = 9;
const PULL_AT = 46;
const PULL_LEN = 40;
const REST_AT = 0.42;
const REST_LEN = 14;
const REST_STAGGER = 3;
const MOTION_END = 100;
const MIN_HOLD = 24;

let measureCtx: CanvasRenderingContext2D | null = null;

function ctx2d() {
  if (!measureCtx) {
    measureCtx = document.createElement("canvas").getContext("2d");
  }
  if (!measureCtx) throw new Error("out-of-context: no 2d context");
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
  const [handle] = useState(() => delayRender("out-of-context: fonts"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    Promise.all([
      outfit.waitUntilDone(),
      document.fonts.load(`${WGHT} 100px "${outfit.fontFamily}"`),
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

interface PlacedWord {
  text: string;
  line: number;
  x: number;
  rest: boolean;
  order: number;
}

interface Layout {
  words: PlacedWord[];
  lineCount: number;
  claimLines: number;
  claimW: number;
  blockW: number;
  dotX: number;
  baseline: number;
  cap: number;
  zoomF: number;
  finalF: number;
}

function split(s: string) {
  return s.split(/\s+/).filter(Boolean);
}

function balanced(words: string[], n: number): string[][] {
  if (n <= 1) return [words];
  let best: string[][] = [words];
  let bestW = Number.POSITIVE_INFINITY;
  const walk = (start: number, left: number, acc: string[][]) => {
    if (left === 1) {
      const rows = [...acc, words.slice(start)];
      const w = Math.max(...rows.map((r) => em(r.join(" "))));
      if (w < bestW) {
        bestW = w;
        best = rows;
      }
      return;
    }
    for (let i = start + 1; i <= words.length - left + 1; i++) {
      walk(i, left - 1, [...acc, words.slice(start, i)]);
    }
  };
  walk(0, n, []);
  return best;
}

function buildLayout(
  claim: string,
  rest: string,
  W: number,
  H: number,
): Layout {
  const portrait = H > W * 1.1;
  const clean = claim.trim().replace(/[.!?…,;:]+$/u, "");
  const explicit = clean
    .split("\n")
    .map((l) => split(l))
    .filter((l) => l.length > 0);
  const flat = explicit.flat();

  let claimRows: string[][];
  if (!portrait && explicit.length > 1) {
    claimRows = explicit;
  } else {
    let bestF = 0;
    claimRows = [flat];
    const maxN = Math.min(flat.length, portrait ? 6 : 3);
    for (let n = 1; n <= maxN; n++) {
      const rows = balanced(flat, n);
      const w = Math.max(...rows.map((r) => em(r.join(" "))));
      const f = Math.min((W * 0.9) / (w + 0.3), (H * 0.84) / (n * PITCH));
      if (f > bestF * 1.04) {
        bestF = f;
        claimRows = rows;
      }
    }
  }

  const space = em(" ");
  const dot = em(".");
  const rowW = (r: string[]) => em(r.join(" "));
  const claimW = Math.max(
    ...claimRows.map((r, i) =>
      i === claimRows.length - 1 ? rowW(r) + dot : rowW(r),
    ),
  );

  const words: PlacedWord[] = [];
  claimRows.forEach((row, li) => {
    let x = 0;
    for (const w of row) {
      words.push({ text: w, line: li, x, rest: false, order: li });
      x += em(w) + space;
    }
  });

  const restWords = split(rest);
  const measure = Math.max(claimW * 1.3, ...restWords.map((w) => em(w)));
  const greedy: string[][] = [];
  for (const w of restWords) {
    const cur = greedy[greedy.length - 1];
    if (cur && em([...cur, w].join(" ")) <= measure) cur.push(w);
    else greedy.push([w]);
  }
  const restRows =
    greedy.length > 1 ? balanced(restWords, greedy.length) : greedy;
  let line = claimRows.length - 1;
  let order = 0;
  for (const row of restRows) {
    line += 1;
    let cursor = 0;
    for (const w of row) {
      words.push({ text: w, line, x: cursor, rest: true, order: order++ });
      cursor += em(w) + space;
    }
  }
  const lineCount = line + 1;
  const blockW = Math.max(claimW, ...words.map((w) => w.x + em(w.text)));

  const c = ctx2d();
  const fm = c.measureText("Hxg");
  const asc = fm.fontBoundingBoxAscent / MEASURE_PX;
  const desc = fm.fontBoundingBoxDescent / MEASURE_PX;
  const cap = c.measureText("H").actualBoundingBoxAscent / MEASURE_PX;
  const baseline = (1 - asc - desc) / 2 + asc;

  const zoomF = Math.min(
    (W * 0.9) / claimW,
    (H * 0.84) / ((claimRows.length - 1) * PITCH + 1),
  );
  const finalF = Math.min(
    (W * 0.84) / blockW,
    (H * 0.74) / ((lineCount - 1) * PITCH + 1),
    zoomF / 1.45,
  );

  return {
    words,
    lineCount,
    claimLines: claimRows.length,
    claimW,
    blockW,
    dotX: rowW(claimRows[claimRows.length - 1]),
    baseline,
    cap,
    zoomF,
    finalF,
  };
}

export function OutOfContext({
  claim = "Stop making\nlaunch videos",
  rest = "by hand.",
  accent,
  background,
  speed = 1,
  theme = "dark",
}: OutOfContextProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const hi = accent ?? c.accent;
  const stage =
    background === "transparent" ? "transparent" : (background ?? c.bg);
  const ready = useFontsReady();

  const layout = useMemo(
    () => (ready ? buildLayout(claim, rest, W, H) : null),
    [ready, claim, rest, W, H],
  );

  if (!layout) {
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );
  }

  const room = durationInFrames * speed - MIN_HOLD;
  const k = Math.max(0.55, Math.min(1, room / MOTION_END));
  const t = (frame * speed) / k;

  const R = layout.zoomF;
  const sEnd = layout.finalF / layout.zoomF;
  const { baseline, cap } = layout;

  const visual = (lines: number, width: number) => ({
    x: (width / 2) * R,
    y: ((baseline - cap + (lines - 1) * PITCH + baseline) / 2) * R,
  });
  const f0 = visual(layout.claimLines, layout.claimW);
  const f1 = visual(layout.lineCount, layout.blockW);

  const p = interpolate(t, [PULL_AT, PULL_AT + PULL_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_CAM,
  });
  const creep = interpolate(t, [IN_LEN, PULL_AT], [0, 0.018], CLAMP);
  const s = Math.exp(Math.log(sEnd) * p) * (1 + creep * (1 - p));
  const fx = f0.x + (f1.x - f0.x) * p;
  const fy = f0.y + (f1.y - f0.y) * p;
  const camera = `translate(${(W / 2).toFixed(2)}px, ${(H / 2).toFixed(2)}px) scale(${s.toFixed(5)}) translate(${(-fx).toFixed(2)}px, ${(-fy).toFixed(2)}px)`;

  const clipTop = (baseline - 1.0) * R;
  const clipH = 1.3 * R;
  const travel = 1.15 * R;

  const lineIn = (li: number) =>
    interpolate(t, [li * IN_STAGGER, li * IN_STAGGER + IN_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  const restIn = (i: number) => {
    const at = PULL_AT + PULL_LEN * REST_AT + i * REST_STAGGER;
    return interpolate(t, [at, at + REST_LEN], [0, 1], {
      ...CLAMP,
      easing: EASE_OUT,
    });
  };

  const drop = interpolate(t, [DROP_AT, DROP_AT + DROP_LEN], [0, 1], {
    ...CLAMP,
    easing: EASE_DROP,
  });

  const glyphStyle = {
    position: "absolute" as const,
    top: 0,
    height: R,
    fontFamily: outfit.fontFamily,
    fontWeight: WGHT,
    fontSize: R,
    lineHeight: `${R}px`,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre" as const,
  };

  const lines = Array.from({ length: layout.lineCount }, (_, li) => li);
  const lastClaim = layout.claimLines - 1;

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: camera,
        }}
      >
        {lines.map((li) => {
          const q = li < layout.claimLines ? lineIn(li) : 1;
          return (
            <div
              key={li}
              style={{
                position: "absolute",
                left: -0.2 * R,
                top: li * PITCH * R + clipTop,
                width: (layout.blockW + 0.6) * R,
                height: clipH,
                overflow: "hidden",
              }}
            >
              {layout.words
                .filter((w) => w.line === li)
                .map((w) => {
                  const r = w.rest ? restIn(w.order) : q;
                  return (
                    <div
                      key={`${w.rest ? "r" : "c"}-${w.order}-${w.x.toFixed(3)}`}
                      style={{
                        ...glyphStyle,
                        left: (w.x + 0.2) * R,
                        top: -clipTop,
                        color: w.rest ? hi : c.ink,
                        transform: `translateY(${((1 - r) * travel).toFixed(2)}px)`,
                      }}
                    >
                      {w.text}
                    </div>
                  );
                })}
              {li === lastClaim && drop < 1 ? (
                <div
                  style={{
                    ...glyphStyle,
                    left: (layout.dotX + 0.2) * R,
                    top: -clipTop,
                    color: c.ink,
                    opacity: 1 - drop,
                    transform: `translateY(${((1 - q) * travel + drop * 0.5 * R).toFixed(2)}px)`,
                  }}
                >
                  .
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
