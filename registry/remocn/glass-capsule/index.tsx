"use client";

import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadSerif } from "@remotion/google-fonts/InstrumentSerif";
import type React from "react";
import { Fragment, useEffect, useId, useMemo, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const SANS = loadSans("normal", { weights: ["500"], subsets: ["latin"] });
const SERIF = loadSerif("italic", { weights: ["400"], subsets: ["latin"] });

/* Lines are Instrument Sans 500; the focus word is Instrument Serif italic. */
const SANS_TRACK = -0.035;
const SERIF_TRACK = -0.01;
const SANS_FONT = (px: number) => `500 ${px}px "${SANS.fontFamily}"`;
const SERIF_FONT = (px: number) => `italic 400 ${px}px "${SERIF.fontFamily}"`;

/* gradients.sh "silk" palette, as the clip-text fill the focus word lights up into. */
const SILK = ["#3b3fd8", "#f3d6c0", "#8a7bff"] as const;

function silkFill(theme: "dark" | "light", d: number) {
  const [c0, c1, c2] = SILK;
  const o = (d * 18).toFixed(1);
  return theme === "dark"
    ? `linear-gradient(100deg, ${c2} ${o}%, ${c1} ${(52 + d * 10).toFixed(1)}%, ${c2} ${(104 + d * 10).toFixed(1)}%)`
    : `linear-gradient(100deg, ${c0} ${o}%, ${c2} ${(56 + d * 10).toFixed(1)}%, ${c0} ${(108 + d * 10).toFixed(1)}%)`;
}

export interface GlassCapsuleProps {
  lines?: string[];
  focus?: string;
  accent?: string;
  speed?: number;
  theme?: "dark" | "light";
}

const EASE_IO = Easing.bezier(0.65, 0, 0.35, 1);
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_GLIDE = Easing.bezier(0.33, 0, 0.12, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const THEMES = {
  dark: {
    bg: "#0A0A0B",
    fg: "#F3F2EF",
    inner: "#0A0A0B",
    tint: "rgba(255,255,255,0.03)",
    rimHi: 0.9,
    rimLo: 0.24,
    shadow: "rgba(0,0,0,0.75)",
    edgeLine: "rgba(255,255,255,0.06)",
    innerShade: "rgba(0,0,0,0.45)",
    sheen: 0.12,
    grain: 0.06,
  },
  light: {
    bg: "#F5F4F0",
    fg: "#121214",
    inner: "#F5F4F0",
    tint: "rgba(255,255,255,0.08)",
    rimHi: 1,
    rimLo: 0.5,
    shadow: "rgba(60,52,40,0.26)",
    edgeLine: "rgba(18,18,20,0.08)",
    innerShade: "rgba(60,52,40,0.16)",
    sheen: 0.5,
    grain: 0.045,
  },
} as const;

type Palette = (typeof THEMES)[keyof typeof THEMES];

let measureCtx: CanvasRenderingContext2D | null = null;

/** (ascent - descent) in em of the face's line metrics, for baseline matching. */
function emLift(serif: boolean, ready: boolean) {
  if (!ready || typeof document === "undefined") return 0;
  if (!measureCtx)
    measureCtx = document.createElement("canvas").getContext("2d");
  if (!measureCtx) return 0;
  measureCtx.font = serif ? SERIF_FONT(100) : SANS_FONT(100);
  const m = measureCtx.measureText("Hg");
  return (m.fontBoundingBoxAscent - m.fontBoundingBoxDescent) / 100;
}

/** Advance width in em of `s` (tracking included); a rough table until fonts load. */
function emWidth(s: string, serif: boolean, ready: boolean) {
  const track = serif ? SERIF_TRACK : SANS_TRACK;
  if (ready && typeof document !== "undefined") {
    if (!measureCtx)
      measureCtx = document.createElement("canvas").getContext("2d");
    if (measureCtx) {
      measureCtx.font = serif ? SERIF_FONT(100) : SANS_FONT(100);
      return measureCtx.measureText(s).width / 100 + track * [...s].length;
    }
  }
  let w = 0;
  for (const ch of s) {
    if (ch === " ") w += 0.24;
    else if ("iljtfr,.;:!'|".includes(ch)) w += 0.28;
    else if ("mwMW".includes(ch)) w += 0.8;
    else if (ch >= "A" && ch <= "Z") w += 0.64;
    else w += serif ? 0.44 : 0.54;
    w += track;
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
          seed={29}
          stitchTiles="stitch"
        />
        <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0.9 0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function lensMap(w: number, h: number, edge: number) {
  const r = h / 2;
  const iw = Math.max(1, w - edge * 2);
  const ih = Math.max(1, h - edge * 2);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'><defs><linearGradient id='x'><stop offset='0' stop-color='#000'/><stop offset='1' stop-color='#f00'/></linearGradient><linearGradient id='y' x2='0' y2='1'><stop offset='0' stop-color='#000'/><stop offset='1' stop-color='#0f0'/></linearGradient><filter id='b' x='-50%' y='-50%' width='200%' height='200%'><feGaussianBlur stdDeviation='${edge * 0.5}'/></filter></defs><rect width='${w}' height='${h}' rx='${r}' fill='url(#x)'/><rect width='${w}' height='${h}' rx='${r}' fill='url(#y)' style='mix-blend-mode:screen'/><rect x='${edge}' y='${edge}' width='${iw}' height='${ih}' rx='${Math.max(0, r - edge)}' fill='rgb(128,128,0)' filter='url(#b)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function splitFocus(lines: string[], focus: string) {
  const clean = (w: string) => w.replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
  const target = clean(focus);
  for (let li = lines.length - 1; li >= 0; li--) {
    const words = lines[li].split(" ");
    const wi = words.findIndex((w) => clean(w) === target);
    if (wi >= 0) {
      const word = words[wi];
      const before = [...words.slice(0, wi), ""].join(" ");
      const after =
        wi < words.length - 1 ? ["", ...words.slice(wi + 1)].join(" ") : "";
      return { line: li, before, word, after };
    }
  }
  const li = lines.length - 1;
  const words = lines[li].split(" ");
  const last = words[words.length - 1];
  return {
    line: li,
    before: [...words.slice(0, -1), ""].join(" "),
    word: last,
    after: "",
  };
}

interface Seg {
  before: string;
  word: string;
  after: string;
}

/** The focus line laid out around its word: `left: 0` is the word's centre. */
function AnchoredLine({
  seg,
  color,
  wordStyle,
  wordNode,
  style,
  room,
  beforeW,
  wordW,
}: {
  wordNode: React.ReactNode;
  seg: Seg;
  color: string;
  wordStyle: React.CSSProperties;
  style: React.CSSProperties;
  room: number;
  beforeW: number;
  wordW: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: -(beforeW + wordW / 2),
        top: 0,
        display: "flex",
        color,
      }}
    >
      <span style={{ ...style, transform: `translateX(${-room}px)` }}>
        {seg.before}
      </span>
      <span style={wordStyle}>{wordNode}</span>
      <span style={{ ...style, transform: `translateX(${room}px)` }}>
        {seg.after}
      </span>
    </div>
  );
}

function Capsule({
  t,
  seg,
  lw,
  lh,
  lineH,
  offset,
  mag,
  disp,
  wordStyle,
  wordNode,
  textStyle,
  p,
  u,
  enter,
  room,
  beforeW,
  wordW,
}: {
  wordNode: React.ReactNode;
  room: number;
  beforeW: number;
  wordW: number;
  t: number;
  seg: Seg;
  lw: number;
  lh: number;
  lineH: number;
  offset: number;
  mag: number;
  disp: number;
  wordStyle: React.CSSProperties;
  textStyle: React.CSSProperties;
  p: Palette;
  u: number;
  enter: number;
}) {
  const fid = `cap${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const radius = lh / 2;
  const edge = lh * 0.26;
  const M = Math.ceil(disp + 8 * u);
  const map = lensMap(Math.round(lw), Math.round(lh), edge);
  const rimX = 24 + interpolate(t, [10, 80], [0, 14], CLAMP);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: (lineH - lh) / 2,
        width: lw,
        height: lh,
        transform: `translateX(${-lw / 2 + offset}px)`,
        opacity: enter,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter
            id={fid}
            x={0}
            y={0}
            width={lw + M * 2}
            height={lh + M * 2}
            filterUnits="userSpaceOnUse"
            primitiveUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feImage
              href={map}
              x={M}
              y={M}
              width={lw}
              height={lh}
              preserveAspectRatio="none"
              result="map"
            />
            {[
              ["r", 1, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"],
              ["g", 0.94, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"],
              ["b", 0.88, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"],
            ].map(([k, s, m]) => (
              <Fragment key={k as string}>
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="map"
                  scale={disp * (s as number)}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result={`d${k}`}
                />
                <feColorMatrix
                  in={`d${k}`}
                  type="matrix"
                  values={m as string}
                  result={`c${k}`}
                />
              </Fragment>
            ))}
            <feComposite
              in="cr"
              in2="cg"
              operator="arithmetic"
              k2={1}
              k3={1}
              result="rg"
            />
            <feComposite in="rg" in2="cb" operator="arithmetic" k2={1} k3={1} />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          boxShadow: `0 0 0 1px ${p.edgeLine}, 0 ${20 * u}px ${40 * u}px -${12 * u}px ${p.shadow}, 0 ${4 * u}px ${10 * u}px -${3 * u}px ${p.shadow}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          overflow: "hidden",
          isolation: "isolate",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -M,
            top: -M,
            width: lw + M * 2,
            height: lh + M * 2,
            filter: `url(#${fid})`,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: p.inner,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `scale(${mag})`,
              transformOrigin: "50% 50%",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: M + lw / 2 - offset,
                top: M + (lh - lineH) / 2,
              }}
            >
              <AnchoredLine
                seg={seg}
                color={p.fg}
                wordStyle={wordStyle}
                wordNode={wordNode}
                style={textStyle}
                room={room}
                beforeW={beforeW}
                wordW={wordW}
              />
            </div>
          </div>
        </div>
        <div style={{ position: "absolute", inset: 0, background: p.tint }} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow: `inset 0 ${-8 * u}px ${18 * u}px -${6 * u}px ${p.innerShade}, inset 0 0 ${10 * u}px ${p.innerShade}`,
          }}
        />
        <div
          style={{
            position: "absolute",
            left: radius * 0.4,
            right: radius * 0.4,
            top: 2 * u,
            height: lh * 0.4,
            borderRadius: `${radius}px ${radius}px ${radius * 0.6}px ${radius * 0.6}px`,
            background: `linear-gradient(180deg, rgba(255,255,255,${p.sheen}), rgba(255,255,255,0.02) 60%, rgba(255,255,255,0) 100%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            padding: 1.5 * u,
            background: `radial-gradient(ellipse 40% 70% at ${rimX}% 0%, rgba(255,255,255,${p.rimHi}), transparent 100%), radial-gradient(ellipse 36% 60% at ${100 - rimX}% 100%, rgba(255,255,255,${p.rimLo}), transparent 100%), rgba(255,255,255,${p.rimLo * 0.3})`,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: radius,
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,${p.rimLo * 0.5})`,
          }}
        />
      </div>
    </div>
  );
}

export function GlassCapsule({
  lines = ["Launch films", "that move."],
  focus = "move",
  accent = "#3B5BFD",
  speed = 1,
  theme = "dark",
}: GlassCapsuleProps) {
  const t = useCurrentFrame() * speed;
  const { width, height, durationInFrames } = useVideoConfig();
  const p = THEMES[theme];
  const u = height / 720;

  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("glass-capsule: fonts"));
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (alive) setReady(true);
    };
    Promise.all([SANS.waitUntilDone(), SERIF.waitUntilDone()])
      .then(() =>
        typeof document !== "undefined" && document.fonts
          ? Promise.all([
              document.fonts.load(SANS_FONT(100)),
              document.fonts.load(SERIF_FONT(100)),
            ])
          : undefined,
      )
      .then(done, done);
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);

  const seg = splitFocus(lines, focus);
  const em = useMemo(() => {
    const lineEm = lines.map((l, i) =>
      i === seg.line
        ? emWidth(seg.before, false, ready) +
          emWidth(seg.word, true, ready) +
          emWidth(seg.after, false, ready)
        : emWidth(l, false, ready),
    );
    return {
      lines: lineEm,
      before: emWidth(seg.before, false, ready),
      word: emWidth(seg.word, true, ready),
      // Serif baseline offset vs the sans baseline, both on the same line-height.
      drop: (emLift(false, ready) - emLift(true, ready)) / 2,
    };
  }, [lines, seg.line, seg.before, seg.word, seg.after, ready]);

  const longest = Math.max(...em.lines, 0.1);
  const size = Math.min(
    176 * u,
    (width * 0.8) / longest,
    (height * 0.62) / (lines.length * 1.04),
  );
  const lineH = size * 1.06;
  const blockH = lines.length * lineH;
  const top = (height - blockH) / 2;

  const wordW = em.word * size;
  const beforeW = em.before * size;
  const lineW = em.lines[seg.line] * size;
  const wordCenter = (width - lineW) / 2 + beforeW + wordW / 2;
  const restMag = 1.1;
  const padX = (wordW * (restMag - 1)) / 2 + size * 0.24;
  const lw = wordW + padX * 2;
  const lh = size * 1.0;

  const glide = EASE_GLIDE(interpolate(t, [10, 74], [0, 1], CLAMP));
  const start = -(wordCenter + lw / 2 + 40 * u);
  const settle =
    t > 74
      ? Math.sin(((t - 74) / 16) * Math.PI) *
        Math.exp(-(t - 74) / 9) *
        5 *
        u *
        (t < 106 ? 1 : 0)
      : 0;
  const offset = start * (1 - glide) + settle;
  const travel = 1 - glide;
  const mag =
    1.05 + (restMag - 1.05) * EASE_IO(interpolate(t, [52, 80], [0, 1], CLAMP));
  const disp = (18 + 16 * travel) * u;
  const enter = interpolate(t, [8, 14], [0, 1], CLAMP);
  const lit = interpolate(t, [72, 90], [0, 1], { ...CLAMP, easing: EASE_OUT });
  const sheen = interpolate(
    t,
    [72, Math.max(73, durationInFrames)],
    [0, 1],
    CLAMP,
  );

  const room =
    Math.max(0, padX - size * 0.15) *
    EASE_IO(interpolate(t, [50, 80], [0, 1], CLAMP));
  const shiftLine = seg.after ? 0 : room / 2;
  const rise = (d: number) =>
    interpolate(t, [d, d + 20], [0, 1], { ...CLAMP, easing: EASE_OUT });

  const textStyle: React.CSSProperties = {
    fontFamily: SANS.fontFamily,
    fontWeight: 500,
    fontSize: size,
    letterSpacing: `${SANS_TRACK}em`,
    lineHeight: `${lineH}px`,
    height: lineH,
    whiteSpace: "pre",
  };
  // The word lights from ink into the silk gradient; the accent marks its full stop.
  const wordStyle: React.CSSProperties = {
    ...textStyle,
    fontFamily: SERIF.fontFamily,
    fontStyle: "italic",
    fontWeight: 400,
    letterSpacing: `${SERIF_TRACK}em`,
    paddingRight: size * 0.06,
    marginRight: -size * 0.06,
    display: "inline-block",
    transform: `translateY(${(em.drop * size).toFixed(2)}px)`,
    backgroundImage: silkFill(theme, sheen),
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: `color-mix(in oklab, ${p.fg} ${((1 - lit) * 100).toFixed(1)}%, transparent)`,
  };
  const stop = /[.!?…]$/.test(seg.word);
  const wordNode = (
    <>
      {stop ? seg.word.slice(0, -1) : seg.word}
      {stop ? (
        <span
          style={{
            WebkitTextFillColor: `color-mix(in oklab, ${accent} ${(lit * 100).toFixed(1)}%, ${p.fg})`,
          }}
        >
          {seg.word.slice(-1)}
        </span>
      ) : null}
    </>
  );

  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top,
          width,
          height: blockH,
        }}
      >
        {lines.map((line, i) => {
          const r = rise(i * 4);
          const isFocus = i === seg.line;
          return (
            <div
              key={`${i}-${line}`}
              style={{
                position: "absolute",
                left: 0,
                top: i * lineH,
                width,
                height: lineH,
                display: "flex",
                justifyContent: "center",
                color: p.fg,
                opacity: r,
                transform: `translateY(${(1 - r) * 26 * u}px)`,
              }}
            >
              {isFocus ? (
                <>
                  <span
                    style={{
                      ...textStyle,
                      transform: `translateX(${shiftLine - room}px)`,
                    }}
                  >
                    {seg.before}
                  </span>
                  <span
                    style={{
                      position: "relative",
                      zIndex: 1,
                      height: lineH,
                      transform: `translateX(${shiftLine}px)`,
                    }}
                  >
                    <span style={wordStyle}>{wordNode}</span>
                    <Capsule
                      t={t}
                      seg={seg}
                      lw={lw}
                      lh={lh}
                      lineH={lineH}
                      offset={offset}
                      mag={mag}
                      disp={disp}
                      wordStyle={wordStyle}
                      wordNode={wordNode}
                      textStyle={textStyle}
                      p={p}
                      u={u}
                      enter={enter}
                      room={room}
                      beforeW={beforeW}
                      wordW={wordW}
                    />
                  </span>
                  <span
                    style={{
                      ...textStyle,
                      transform: `translateX(${shiftLine + room}px)`,
                    }}
                  >
                    {seg.after}
                  </span>
                </>
              ) : (
                <span style={textStyle}>{line}</span>
              )}
            </div>
          );
        })}
      </div>
      <Grain opacity={p.grain} />
    </AbsoluteFill>
  );
}
