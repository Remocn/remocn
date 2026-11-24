"use client";

import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadNewsreader } from "@remotion/google-fonts/Newsreader";
import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  DEFAULT_EDITS,
  DEFAULT_TEXT,
  join,
  plan,
  type Seg,
  type SelectReplaceElementId,
  type Step,
  selectReplaceTimeline,
} from "./timeline";

const geist = loadGeist("normal", { weights: ["500"], subsets: ["latin"] });
const serif = loadNewsreader("italic", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface SelectReplaceEdit {
  /** Text to select; the first match in the current line is used. */
  from: string;
  /** Text typed in its place. */
  to: string;
}

export interface SelectReplaceProps {
  text?: string;
  edits?: SelectReplaceEdit[];
  /** Frames the selection holds before it is typed over. */
  hold?: number;
  /** Weight of the line; typed words stay in the italic serif. */
  fontWeight?: number;
  accent?: string;
  /** Text color of the line; overrides the theme ink. */
  ink?: string;
  /** Background fill; "transparent" drops it. */
  background?: string;
  /** Typeface for the line; typed words keep the italic serif. Load it yourself; Geist by default. */
  fontFamily?: string;
  /** Size of the line, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  theme?: "dark" | "light";
  speed?: number;
  /**
   * Moves, trims or stretches the intro, the selections and the typing, by
   * the ids in `./timeline`. Frames on the scene timeline, after `delay` and
   * `speed`.
   */
  timing?: Timing<SelectReplaceElementId>;
}

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);

const WEIGHT = 500;
const TRACK = -0.032;
// Typed words are set in Newsreader italic, a touch larger so its x-height
// meets Geist's, and tracked a hair tight.
const SERIF_SCALE = 1.1;
const SERIF_TRACK = -0.012;
const BLINK = 30;

// gradients.sh "mesh" palette (#ecdcf2 #8796ee #2e45b7 #0e1645). The selection
// is a panel of it; what gets typed into the selection keeps it as a fill.
const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    onSelect: "#FFFFFF",
    band: ["#2E45B7", "", "#8796EE"],
    // White glyphs ride the band: its pale end runs past the edge.
    bandEnd: 150,
    bandLight: "#ECDCF2",
    bandLightAlpha: 32,
    ink: ["#ECDCF2", "#8796EE", ""],
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    onSelect: "#0E1645",
    band: ["#ECDCF2", "#C9CDF6", "#8796EE"],
    bandEnd: 100,
    bandLight: "#FFFFFF",
    bandLightAlpha: 55,
    ink: ["", "#2E45B7", "#0E1645"],
  },
} as const;

function useMeasurer(fontFamily: string, fontWeight: number) {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("select-replace: measuring"));
  const released = useRef(false);
  const sansFont = `${fontWeight} 100px "${fontFamily}"`;
  const serifFont = `italic 400 100px "${serif.fontFamily}"`;

  useEffect(() => {
    let live = true;
    Promise.all([
      geist.waitUntilDone(),
      serif.waitUntilDone(),
      document.fonts.load(sansFont),
      document.fonts.load(serifFont),
    ])
      .catch(() => undefined)
      .then(() => {
        if (!live) return;
        setReady(true);
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
    };
  }, [sansFont, serifFont, handle]);

  const ctx = useMemo(
    () => (ready ? document.createElement("canvas").getContext("2d") : null),
    [ready],
  );
  /** Width of a styled line in em of the base size. */
  const measure = useCallback(
    (segs: Seg[]) =>
      segs.reduce((acc, s) => {
        const n = [...s.text].length;
        if (!ctx) return acc + n * 0.55;
        ctx.font = s.serif ? serifFont : sansFont;
        const w = ctx.measureText(s.text).width / 100;
        return (
          acc + (s.serif ? (w + SERIF_TRACK * n) * SERIF_SCALE : w + TRACK * n)
        );
      }, 0),
    [ctx, sansFont, serifFont],
  );
  return ready ? measure : null;
}

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

/** The foreground at `scale`, around the frame's center; nothing extra at 1. */
function ScaleLayer({
  scale,
  children,
}: {
  scale: number;
  children: React.ReactNode;
}) {
  if (scale === 1) return children;
  return (
    <AbsoluteFill style={{ transform: `scale(${scale})` }}>
      {children}
    </AbsoluteFill>
  );
}

export function SelectReplace(props: SelectReplaceProps) {
  const {
    text = DEFAULT_TEXT,
    edits = DEFAULT_EDITS,
    fontWeight = WEIGHT,
    accent = "#3B5BFD",
    ink: textInk,
    background,
    fontFamily = geist.fontFamily,
    scale = 1,
    delay = 0,
    theme = "dark",
    speed = 1,
    timing,
  } = props;
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    selectReplaceTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const t = THEMES[theme];
  const stage = background === "transparent" ? undefined : (background ?? t.bg);
  const measure = useMeasurer(fontFamily, fontWeight);
  // What each edit replaces comes from the plan; when it happens, from the
  // timeline.
  const planned = useMemo(() => plan(text, edits).steps, [text, edits]);
  const steps: Step[] = planned.map((s) => {
    const sel = tl.get(`select:${s.index}`);
    const ty = tl.get(`type:${s.index}`);
    return {
      ...s,
      start: sel.start,
      selectAt: sel.start + sel.beat("caretIn"),
      deleteAt: ty.start,
      keys: s.keys.map((_, i) => ty.start + ty.beat(`key:${i}`)),
      end: ty.end,
    };
  });
  const introEl = tl.get("intro");

  if (!measure)
    return (
      <div style={{ position: "absolute", inset: 0, background: stage }} />
    );

  const typed = (s: Step, n: number): Seg[] => [
    { text: [...s.to].slice(0, n).join(""), serif: true },
  ];

  // Every distinct line state, in time order, for size and re-centering.
  const states: { at: number; recenter: number; line: Seg[] }[] = [
    { at: 0, recenter: 0, line: [{ text, serif: false }] },
  ];
  for (const s of steps) {
    const recenter = tl.get(`type:${s.index}`).beat("recenter");
    states.push({ at: s.deleteAt, recenter, line: join(s.before, s.after) });
    s.keys.forEach((k, i) => {
      states.push({
        at: k,
        recenter,
        line: join(s.before, typed(s, i + 1), s.after),
      });
    });
  }
  const widest = Math.max(...states.map((s) => measure(s.line)));
  const size = Math.min(height * 0.2, (width * 0.84) / widest);
  const em = (v: number) => v * size;

  // Current line, caret and selection.
  let line: Seg[] = states[0].line;
  let caretAt: Seg[] | null = null;
  let selection: { a: number; b: number; full: number } | null = null;
  let lastMove = Number.NEGATIVE_INFINITY;
  for (const s of steps) {
    if (frame < s.start) break;
    lastMove = s.start;
    caretAt = s.before;
    if (frame >= s.selectAt && frame < s.deleteAt) {
      const sel = tl.get(`select:${s.index}`);
      const p = interpolate(
        frame,
        [s.selectAt, s.selectAt + sel.beat("select")],
        [0, 1],
        {
          ...CLAMP,
          easing: EASE_IO,
        },
      );
      const n = Math.ceil(p * [...s.from].length);
      selection = {
        a: measure(s.before),
        b: measure(
          join(s.before, [
            { text: [...s.from].slice(0, n).join(""), serif: false },
          ]),
        ),
        full: measure([{ text: s.from, serif: false }]),
      };
      lastMove = Math.min(frame, s.selectAt + sel.beat("select"));
    }
    if (frame >= s.deleteAt) {
      const n = s.keys.filter((k) => frame >= k).length;
      line = join(s.before, typed(s, n), s.after);
      caretAt = join(s.before, typed(s, n));
      lastMove = n > 0 ? s.keys[n - 1] : s.deleteAt;
    }
  }

  // Line re-centers by easing between each state's centered position.
  const leftFor = (l: Seg[]) => (width - em(measure(l))) / 2;
  // `settled` lands every started re-centering at once: the place the line
  // is heading for, and exactly `left` once it is there.
  const leftAt = (settled: boolean) => {
    let x = leftFor(states[0].line);
    for (let i = 1; i < states.length; i++) {
      const p = settled
        ? frame >= states[i].at
          ? 1
          : 0
        : interpolate(
            frame,
            [states[i].at, states[i].at + states[i].recenter],
            [0, 1],
            {
              ...CLAMP,
              easing: EASE_OUT,
            },
          );
      x += (leftFor(states[i].line) - leftFor(states[i - 1].line)) * p;
    }
    return x;
  };
  const left = leftAt(false);
  // Layout rounds a box to whole pixels, so a line eased by `left` clicks
  // sideways pixel by pixel. Everything is laid out where the line is
  // heading and the wrapper carries the rest of the way as a transform.
  const anchor = leftAt(true);
  const shift = left - anchor;

  const cy = height / 2;
  const lineTop = cy - em(0.5);
  const intro = interpolate(frame, [introEl.start, introEl.end], [0, 1], {
    ...CLAMP,
    easing: EASE_OUT,
  });
  // The palette turns a few degrees over the shot; never more than that.
  const drift = interpolate(frame, [0, 170], [0, 1], CLAMP);

  const caretW = Math.max(2, em(0.03));
  const barTop = lineTop + em(0.06);
  const barH = em(1.04);
  const knob = em(0.05);
  const caretOn =
    caretAt !== null && !selection && (frame - lastMove) % BLINK < BLINK * 0.55;

  const bar = (x: number, key: string, knobAt?: "top" | "bottom") => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: x - caretW / 2,
        top: barTop,
        width: caretW,
        height: barH,
        background: accent,
        borderRadius: caretW / 2,
      }}
    >
      {knobAt ? (
        <div
          style={{
            position: "absolute",
            left: caretW / 2 - knob,
            top: knobAt === "top" ? -knob * 1.6 : barH - knob * 0.4,
            width: knob * 2,
            height: knob * 2,
            borderRadius: knob,
            background: accent,
          }}
        />
      ) : null}
    </div>
  );

  const band = t.band.map((c) => c || accent);
  const ink = t.ink.map((c) => c || accent);
  // One gradient field across the whole finished line, so every typed word
  // shows its own slice of the same light.
  const lineW = em(widest);
  const inkFill = (segLeft: number): React.CSSProperties => ({
    color: "transparent",
    backgroundImage: `linear-gradient(${100 + 10 * drift}deg, ${ink[0]} 0%, ${ink[1]} 48%, ${ink[2]} 100%)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: `${lineW}px 100%`,
    backgroundPosition: `${(width - lineW) / 2 - segLeft}px 0px`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
  });

  const lineStyle: React.CSSProperties = {
    position: "absolute",
    left: anchor,
    top: lineTop,
    fontFamily,
    fontWeight,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${TRACK}em`,
    whiteSpace: "pre",
    color: textInk ?? t.fg,
    fontKerning: "normal",
  };

  // Selected glyphs flip to the on-selection color: overlay the selected run
  // clipped to the band.
  const runs = (segs: Seg[], color?: string) => {
    let x = left;
    return segs.map((s, i) => {
      const segLeft = x;
      x += em(measure([s]));
      if (!s.serif) {
        return (
          <span
            key={`${String(i)}-${s.text}`}
            style={color ? { color } : undefined}
          >
            {s.text}
          </span>
        );
      }
      return (
        <span
          key={`${String(i)}-${s.text}`}
          style={{
            display: "inline-block",
            fontFamily: serif.fontFamily,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: `${SERIF_SCALE}em`,
            lineHeight: `${1 / SERIF_SCALE}`,
            letterSpacing: `${SERIF_TRACK}em`,
            // Room for ascenders, descenders and the italic overhang inside
            // the clipped background; the negative margin keeps the layout.
            padding: "0.3em 0.12em",
            margin: "-0.3em -0.12em",
            ...inkFill(segLeft - em(0.12 * SERIF_SCALE)),
          }}
        >
          {s.text}
        </span>
      );
    });
  };

  return (
    <AbsoluteFill style={{ background: stage, overflow: "hidden" }}>
      <ScaleLayer scale={scale}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.15 + 0.85 * intro,
            transform: `${
              Math.abs(shift) > 1e-3 ? `translateX(${shift}px) ` : ""
            }translateY(${em(0.12) * (1 - intro)}px)${glide(midway(intro))}`,
          }}
        >
          {selection ? (
            <div
              style={{
                position: "absolute",
                left: anchor + em(selection.a),
                top: barTop,
                width: Math.max(0, em(selection.b - selection.a)),
                height: barH,
                backgroundImage: `radial-gradient(60% 90% at ${22 + 10 * drift}% 0%, color-mix(in oklab, ${t.bandLight} ${t.bandLightAlpha}%, transparent) 0%, transparent 70%), linear-gradient(in oklab ${96 + 8 * drift}deg, ${band[0]} 0%, ${band[1]} 55%, ${band[2]} ${t.bandEnd}%)`,
                // Sized to the whole word, so the gradient is revealed, not stretched.
                backgroundSize: `${em(selection.full)}px 100%`,
                backgroundRepeat: "no-repeat",
              }}
            />
          ) : null}
          <div style={lineStyle}>{runs(line)}</div>
          {selection ? (
            <div
              style={{
                ...lineStyle,
                clipPath: `inset(0 ${Math.max(0, em(measure(line)) - em(selection.b))}px 0 ${em(selection.a)}px)`,
              }}
            >
              {runs(line, t.onSelect)}
            </div>
          ) : null}
          {selection
            ? [
                bar(anchor + em(selection.a), "a", "top"),
                bar(anchor + em(selection.b), "b", "bottom"),
              ]
            : null}
          {caretOn && caretAt !== null
            ? bar(
                anchor +
                  em(measure(caretAt)) +
                  // Clear the italic overhang when the caret follows a typed word.
                  (caretAt[caretAt.length - 1]?.serif ? em(0.06) : 0),
                "caret",
              )
            : null}
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}
