"use client";

import { loadFont } from "@remotion/google-fonts/InstrumentSans";
import {
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
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
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround, gshParams } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const face = loadFont("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

export interface CaretDollyProps {
  prompt?: string;
  focus?: string;
  chipLabel?: string;
  modelLabel?: string;
  accent?: string;
  ink?: string;
  background?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const LIGHT_GROUND: Partial<GradientParams> = {
  kind: "mist",
  background: "#efebe5",
  colors: ["#ffffff", "#f8f4ee", "#f0dccb", "#e2cbb9"],
  blur: 0.7,
  warp: 0.4,
  seed: 3,
  grain: 0.2,
};

const THEMES = {
  dark: {
    ink: "#f6f1ec",
    muted: "rgba(246,241,236,0.56)",
    faint: "rgba(246,241,236,0.12)",
    accent: "#ff7d3f",
    ground: "hearth" as GshPresetId | undefined,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 4,
    scrim: "5,3,3",
    scrimAlpha: 0.6,
    card: "#16120f",
    border: "rgba(255,236,222,0.09)",
    shadow: "0 40px 90px -24px rgba(0,0,0,0.7)",
    send: "rgba(246,241,236,0.12)",
    sendArmed: "#f6f1ec",
    sendGlyph: "#16120f",
    cursorFill: "#ffffff",
    cursorStroke: "#15141d",
  },
  light: {
    ink: "#1b1612",
    muted: "rgba(27,22,18,0.54)",
    faint: "rgba(27,22,18,0.1)",
    accent: "#e0561c",
    ground: undefined as GshPresetId | undefined,
    groundParams: LIGHT_GROUND as Partial<GradientParams> | undefined,
    groundOffset: 2,
    scrim: "239,235,229",
    scrimAlpha: 0.35,
    card: "#ffffff",
    border: "rgba(40,24,10,0.07)",
    shadow:
      "0 1px 3px rgba(40,24,10,0.06), 0 36px 80px -24px rgba(40,24,10,0.24)",
    send: "rgba(27,22,18,0.07)",
    sendArmed: "#1b1612",
    sendGlyph: "#ffffff",
    cursorFill: "#1b1612",
    cursorStroke: "#ffffff",
  },
};

const BEAT = {
  typeA: 2,
  punch: 24,
  punchLen: 12,
  focusLen: 22,
  pull: 60,
  pullLen: 24,
  post: 72,
  postLen: 30,
  cursor: 82,
  press: 108,
};

const TRACK = -0.012;
const FONT_PX = 200;
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const LIGHT_IN = Easing.bezier(0.32, 0.72, 0, 1);
const CHAR = Easing.bezier(0.65, 0, 0.35, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Measure = (s: string) => number;

function buildMeasure(_version: number): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string) => {
    if (cache[s] === undefined) {
      if (!ctx) return s.length * 0.52;
      ctx.font = `400 ${FONT_PX}px "${face.fontFamily}"`;
      cache[s] =
        ctx.measureText(s).width / FONT_PX + TRACK * Array.from(s).length;
    }
    return cache[s];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("caret-dolly: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      face.waitUntilDone(),
      document.fonts.load(`400 100px "${face.fontFamily}"`),
    ])
      .catch(() => undefined)
      .then(() => {
        bump();
        if (!released.current) {
          released.current = true;
          continueRender(handle);
        }
      });
    return () => {
      live = false;
      document.fonts.removeEventListener("loadingdone", bump);
    };
  }, [handle]);
  return useMemo(() => buildMeasure(version), [version]);
}

function Icon({
  size,
  color,
  children,
}: {
  size: number;
  color: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", flexShrink: 0 }}
      aria-hidden
    >
      {children}
    </svg>
  );
}

interface Layout {
  T: number;
  LH: number;
  cardX: number;
  cardY: number;
  cardW: number;
  cardH: number;
  pad: number;
  u: number;
  lines: { start: number; end: number }[];
  charX: (i: number) => number;
  lineOf: (i: number) => number;
  lineY: (li: number) => number;
  sendX: number;
  sendY: number;
  sendD: number;
}

export function CaretDolly({
  prompt = "Make a launch video for our new app with a bold title, product shots and a calm ending",
  focus = "launch video",
  chipLabel = "Video",
  modelLabel = "Remocn 1",
  accent,
  ink,
  background,
  theme = "dark",
  ground,
  groundParams,
}: CaretDollyProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? (groundParams ? undefined : c.ground);
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = background ?? gshParams(preset, gParams).background;
  const m = useMeasure();
  const portrait = H > W * 1.1;
  const filterId = `cd${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const found = prompt.indexOf(focus);
  const fs = found >= 0 && focus.length > 0 ? found : 0;
  const fe = found >= 0 && focus.length > 0 ? found + focus.length : 0;
  const focusLen = fe - fs;
  const postLen = prompt.length - fe;
  const rateA = Math.max(0.6, fs / 18);
  const rateF = Math.max(0.5, focusLen / BEAT.focusLen);
  const rateP = Math.max(2, postLen / BEAT.postLen);
  const punchEnd = BEAT.punch + BEAT.punchLen;
  const pullEnd = BEAT.pull + BEAT.pullLen;
  const postEnd = BEAT.post + postLen / rateP;

  const typedA = (f: number) =>
    Math.max(0, Math.min(fs, (f - BEAT.typeA) * rateA));
  const typedF = (f: number) =>
    Math.max(0, Math.min(focusLen, (f - punchEnd) * rateF));
  const typedP = (f: number) =>
    Math.max(0, Math.min(postLen, (f - BEAT.post) * rateP));

  const layout = ((): Layout | null => {
    if (!m) return null;
    const cardW = portrait ? W * 0.86 : Math.min(W * 0.66, H * 1.25);
    const T = portrait ? W * 0.05 : Math.max(H * 0.032, cardW * 0.031);
    const u = T / 22;
    const LH = T * 1.45;
    const pad = 22 * u;
    const room = cardW - pad * 2;
    const words = prompt.split(" ");
    const lines: { start: number; end: number }[] = [];
    let pos = 0;
    let cur = "";
    let curStart = 0;
    for (const w of words) {
      const next = cur.length > 0 ? `${cur} ${w}` : w;
      if (cur.length > 0 && m(next) * T > room) {
        lines.push({ start: curStart, end: curStart + cur.length });
        curStart = pos;
        cur = w;
      } else {
        cur = next;
      }
      pos += w.length + 1;
    }
    lines.push({ start: curStart, end: curStart + cur.length });
    const barH = 36 * u;
    const cardH = pad + lines.length * LH + 22 * u + barH + pad * 0.8;
    const cardX = (W - cardW) / 2;
    const cardY = H / 2 - cardH / 2;
    const lineOf = (i: number) => {
      for (let li = 0; li < lines.length; li++) {
        if (i <= lines[li].end) return li;
      }
      return lines.length - 1;
    };
    const charX = (i: number) => {
      const li = lineOf(i);
      return cardX + pad + m(prompt.slice(lines[li].start, i)) * T;
    };
    const lineY = (li: number) => cardY + pad + li * LH + LH / 2;
    const sendD = 34 * u;
    return {
      T,
      LH,
      cardX,
      cardY,
      cardW,
      cardH,
      pad,
      u,
      lines,
      charX,
      lineOf,
      lineY,
      sendX: cardX + cardW - pad * 0.8 - sendD / 2,
      sendY: cardY + cardH - pad * 0.8 - barH / 2,
      sendD,
    };
  })();

  const cams = (() => {
    if (!layout) return [];
    const { T, charX, lineOf, lineY } = layout;
    const C = { x: W / 2, y: H / 2 };
    const A = portrait ? W * 0.11 : H * 0.1;
    const giant = portrait ? W * 0.27 : Math.min(H * 0.36, W * 0.27);
    const sA = A / T;
    const sG = giant / T;
    const xAt = (ci: number) => {
      const lo = Math.floor(ci);
      const hiI = Math.min(prompt.length, lo + 1);
      const fr = ci - lo;
      if (lineOf(lo) !== lineOf(hiI)) return charX(lo);
      return charX(lo) + (charX(hiI) - charX(lo)) * CHAR(fr);
    };
    const goalA = (f: number) => {
      const ci = typedA(f);
      const li = lineOf(Math.floor(ci));
      return {
        x: (charX(layout.lines[li].start) + xAt(ci)) / 2,
        y: lineY(li),
      };
    };
    const goalG = (f: number) => {
      const ci = fs + typedF(f);
      const at = Math.floor(ci);
      let ws = at;
      while (ws > fs && prompt[ws - 1] !== " ") ws--;
      if (prompt[at] === " " && at > fs && ci - at < 0.5) {
        ws = at;
        while (ws > fs && prompt[ws - 1] !== " ") ws--;
      }
      const li = lineOf(at);
      return { x: (charX(ws) + xAt(ci)) / 2, y: lineY(li) };
    };
    const K = { x: charX(fs), y: lineY(lineOf(fs)) };
    const Fp = { x: charX(fe), y: lineY(lineOf(Math.max(fs, fe - 1))) };
    const out: { x: number; y: number; s: number }[] = [];
    let fx = goalA(0).x;
    let fy = goalA(0).y;
    let scrStart = { x: 0, y: 0 };
    let scrPull = { x: 0, y: 0 };
    const total = Math.max(durationInFrames, pullEnd + 1);
    for (let f = 0; f < total; f++) {
      if (f < BEAT.punch) {
        const g = goalA(f);
        fx += (g.x - fx) * 0.32;
        fy += (g.y - fy) * 0.32;
        out.push({ x: fx, y: fy, s: sA });
        scrStart = { x: C.x + (K.x - fx) * sA, y: C.y + (K.y - fy) * sA };
      } else if (f < punchEnd) {
        const p = CAMERA((f - BEAT.punch) / BEAT.punchLen);
        const s = Math.exp(Math.log(sA) + (Math.log(sG) - Math.log(sA)) * p);
        const sx = scrStart.x + (C.x - scrStart.x) * p;
        const sy = scrStart.y + (C.y - scrStart.y) * p;
        fx = K.x - (sx - C.x) / s;
        fy = K.y - (sy - C.y) / s;
        out.push({ x: fx, y: fy, s });
      } else if (f < BEAT.pull) {
        const g = goalG(f);
        fx += (g.x - fx) * 0.3;
        fy += (g.y - fy) * 0.3;
        out.push({ x: fx, y: fy, s: sG });
        scrPull = { x: C.x + (Fp.x - fx) * sG, y: C.y + (Fp.y - fy) * sG };
      } else if (f < pullEnd) {
        const p = CAMERA((f - BEAT.pull) / BEAT.pullLen);
        const s = Math.exp(Math.log(sG) * (1 - p));
        const sx = scrPull.x + (Fp.x - scrPull.x) * p;
        const sy = scrPull.y + (Fp.y - scrPull.y) * p;
        out.push({ x: Fp.x - (sx - C.x) / s, y: Fp.y - (sy - C.y) / s, s });
      } else {
        out.push({ x: C.x, y: C.y, s: 1 });
      }
    }
    return out;
  })();

  let content: ReactNode = <div />;
  if (layout && cams.length > 0) {
    const L = layout;
    const f = frame;
    const cam = cams[Math.min(cams.length - 1, f)];
    const prev = cams[Math.max(0, Math.min(cams.length - 1, f - 1))];
    const push =
      f >= pullEnd
        ? interpolate(f, [pullEnd, durationInFrames], [1, 1.03], CLAMP)
        : 1;
    const s = cam.s * push;
    const zoomV = Math.abs(Math.log(cam.s) - Math.log(prev.s));
    const panV = Math.abs(cam.x - prev.x) * cam.s;
    const zoomBlur = Math.min(7, zoomV * 26);
    const bx = Math.min(12, zoomBlur + panV * 0.05);
    const by = zoomBlur;

    const preOp =
      f < BEAT.punch
        ? 1
        : f < BEAT.pull
          ? interpolate(f, [BEAT.punch, BEAT.punch + 5], [1, 0], CLAMP)
          : interpolate(f, [BEAT.pull + 8, pullEnd], [0, 1], {
              ...CLAMP,
              easing: LIGHT_IN,
            });
    const shown =
      f < punchEnd
        ? Math.floor(typedA(f))
        : fs + Math.floor(typedF(f)) + Math.floor(typedP(f));
    const caretIdx = Math.min(prompt.length, shown);

    const segs: ReactNode[] = [];
    L.lines.forEach((ln, li) => {
      const ranges: [number, number, number][] = [
        [ln.start, Math.min(ln.end, fs), preOp],
        [Math.max(ln.start, fs), Math.min(ln.end, fe), 1],
        [Math.max(ln.start, fe), ln.end, 1],
      ];
      ranges.forEach(([a, b, op], ri) => {
        const to = Math.min(b, shown);
        if (to <= a || op <= 0.001) return;
        segs.push(
          <div
            key={`s${li}-${ri}`}
            style={{
              position: "absolute",
              left: L.charX(a),
              top: L.lineY(li) - L.T / 2,
              fontSize: L.T,
              lineHeight: 1,
              whiteSpace: "pre",
              fontFamily: face.fontFamily,
              fontWeight: 400,
              letterSpacing: `${TRACK}em`,
              color: inkC,
              opacity: op,
            }}
          >
            {prompt.slice(a, to)}
          </div>,
        );
      });
    });

    const typing =
      (f >= BEAT.typeA && f < BEAT.typeA + fs / rateA + 2) ||
      (f >= punchEnd && f < punchEnd + focusLen / rateF + 2) ||
      (f >= BEAT.post && f < postEnd + 2);
    const blinkOn = typing || Math.floor(f / 14) % 2 === 0;
    const caretFade =
      f >= postEnd + 4
        ? interpolate(f, [BEAT.press - 6, BEAT.press], [1, 0], CLAMP)
        : 1;
    const caretH = L.T * 1.18;
    const caretW = Math.max(L.T * 0.05, 1.6 / s);
    const caretLine = L.lineOf(Math.max(0, caretIdx === 0 ? 0 : caretIdx));
    const caret = (
      <div
        style={{
          position: "absolute",
          left: L.charX(caretIdx) + L.T * 0.04,
          top: L.lineY(caretLine) - caretH / 2,
          width: caretW,
          height: caretH,
          borderRadius: caretW,
          background: inkC,
          opacity: (blinkOn ? 1 : 0) * caretFade,
        }}
      />
    );

    const surfaceIn = interpolate(f, [BEAT.pull + 6, pullEnd], [0, 1], {
      ...CLAMP,
      easing: LIGHT_IN,
    });
    const u = L.u;
    const pop = (at: number) =>
      spring({
        frame: f - at,
        fps,
        config: { mass: 0.5, damping: 12, stiffness: 200 },
      });
    const toolIn = [0, 1, 2, 3, 4].map((i) => pop(pullEnd - 8 + i * 2));
    const armed = interpolate(f, [postEnd, postEnd + 4], [0, 1], CLAMP);
    const PRESS = { mass: 0.5, damping: 14, stiffness: 260 };
    const dip =
      spring({ frame: f - BEAT.press + 2, fps, config: PRESS }) -
      spring({ frame: f - BEAT.press - 3, fps, config: PRESS });
    const isPressed = f >= BEAT.press;
    const sendScale = 1 - 0.06 * dip;
    const sendBg = isPressed
      ? hi
      : `color-mix(in oklab, ${c.sendArmed} ${(armed * 100).toFixed(1)}%, ${c.send})`;
    const glyph = isPressed
      ? "#ffffff"
      : `color-mix(in oklab, ${c.sendGlyph} ${(armed * 100).toFixed(1)}%, ${c.muted})`;
    const stopIn = spring({
      frame: f - BEAT.press - 3,
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    const arrowOut = interpolate(f - BEAT.press, [1, 5], [1, 0], CLAMP);
    const spin = interpolate(f - BEAT.press, [4, 12], [0, 1], {
      ...CLAMP,
      easing: LIGHT_IN,
    });
    const labelF = 15 * u;
    const ctrlD = 32 * u;

    const card = (
      <div
        style={{
          position: "absolute",
          left: L.cardX,
          top: L.cardY,
          width: L.cardW,
          height: L.cardH,
          borderRadius: 22 * u,
          background: c.card,
          boxShadow: `inset 0 0 0 1px ${c.border}, ${c.shadow}`,
          opacity: surfaceIn,
          transform: `scale(${(0.97 + 0.03 * surfaceIn).toFixed(4)})`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: L.pad * 0.8,
            right: L.pad * 0.8,
            bottom: L.pad * 0.8,
            height: 36 * u,
            display: "flex",
            alignItems: "center",
            gap: 8 * u,
            fontFamily: face.fontFamily,
            fontWeight: 400,
            fontSize: labelF,
            color: c.muted,
          }}
        >
          <div
            style={{
              width: ctrlD,
              height: ctrlD,
              borderRadius: ctrlD,
              boxShadow: `inset 0 0 0 1px ${c.faint}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transform: `scale(${toolIn[0].toFixed(4)})`,
            }}
          >
            <Icon size={18 * u} color={c.muted}>
              <path d="M12 5v14M5 12h14" />
            </Icon>
          </div>
          <div
            style={{
              height: ctrlD,
              padding: `0 ${12 * u}px 0 ${10 * u}px`,
              borderRadius: ctrlD,
              boxShadow: `inset 0 0 0 1px ${c.faint}`,
              display: "flex",
              alignItems: "center",
              gap: 6 * u,
              whiteSpace: "pre",
              transform: `scale(${toolIn[1].toFixed(4)})`,
              transformOrigin: "0% 50%",
            }}
          >
            <Icon size={16 * u} color={c.muted}>
              <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
              <path d="M3.5 9.5h17M8 5v4.5M12 5v4.5M16 5v4.5" />
            </Icon>
            {chipLabel}
          </div>
          <div style={{ flex: 1 }} />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4 * u,
              whiteSpace: "pre",
              opacity: Math.min(1, toolIn[2]),
            }}
          >
            {modelLabel}
            <Icon size={14 * u} color={c.muted}>
              <path d="M7 10l5 5 5-5" />
            </Icon>
          </div>
          <div
            style={{
              position: "relative",
              width: L.sendD,
              height: L.sendD,
              flexShrink: 0,
              transform: `scale(${(toolIn[4] * sendScale).toFixed(4)})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: L.sendD,
                background: sendBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  opacity: arrowOut,
                  transform: `translateY(${(-6 * u * (1 - arrowOut)).toFixed(3)}px)`,
                }}
              >
                <Icon size={18 * u} color={glyph}>
                  <path d="M12 19V5M6 11l6-6 6 6" />
                </Icon>
              </div>
              {isPressed ? (
                <div
                  style={{
                    position: "absolute",
                    width: 11 * u,
                    height: 11 * u,
                    borderRadius: 2.5 * u,
                    background: "#ffffff",
                    transform: `scale(${stopIn.toFixed(4)})`,
                  }}
                />
              ) : null}
            </div>
            {isPressed ? (
              <svg
                viewBox="0 0 40 40"
                width={L.sendD + 7 * u}
                height={L.sendD + 7 * u}
                style={{
                  position: "absolute",
                  left: -3.5 * u,
                  top: -3.5 * u,
                  opacity: spin,
                  transform: `rotate(${((f - BEAT.press) * 9).toFixed(2)}deg)`,
                }}
                aria-hidden
              >
                <circle
                  cx="20"
                  cy="20"
                  r="18.5"
                  fill="none"
                  stroke={hi}
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  strokeDasharray="30 200"
                />
              </svg>
            ) : null}
          </div>
        </div>
      </div>
    );

    const world = (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${(W / 2).toFixed(2)}px, ${(H / 2).toFixed(2)}px) scale(${s.toFixed(5)}) translate(${(-cam.x).toFixed(3)}px, ${(-cam.y).toFixed(3)}px)`,
        }}
      >
        {card}
        {segs}
        {caret}
      </div>
    );

    const curSize = portrait ? W * 0.05 : H * 0.05;
    const cursorP = spring({
      frame: f - BEAT.cursor,
      fps,
      config: { mass: 0.8, damping: 20, stiffness: 140 },
    });
    const cursorPy = spring({
      frame: f - BEAT.cursor - 3,
      fps,
      config: { mass: 0.8, damping: 20, stiffness: 140 },
    });
    const tx = W / 2 + (L.sendX + L.sendD * 0.12 - W / 2) * s;
    const ty = H / 2 + (L.sendY + L.sendD * 0.18 - H / 2) * s;
    const sx0 = W * (portrait ? 0.96 : 0.9);
    const sy0 = H * 1.06;
    const away = spring({
      frame: f - BEAT.press - 8,
      fps,
      config: { mass: 0.8, damping: 20, stiffness: 140 },
    });
    const curX = sx0 + (tx - sx0) * cursorP + curSize * 1.1 * away;
    const curY = sy0 + (ty - sy0) * cursorPy + curSize * 1.3 * away;
    const click = dip;
    const cursor =
      f >= BEAT.cursor ? (
        <svg
          viewBox="0 0 24 24"
          width={curSize}
          height={curSize}
          style={{
            position: "absolute",
            left: curX - curSize * 0.17,
            top: curY - curSize * 0.1,
            transform: `scale(${(1 - 0.12 * click).toFixed(4)})`,
            transformOrigin: "17% 10%",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.28))",
          }}
          aria-hidden
        >
          <path
            d="M4.5 2.5v16.2l4.4-4.1 2.9 6.6 2.7-1.2-2.9-6.5h6.1z"
            fill={c.cursorFill}
            stroke={c.cursorStroke}
            strokeWidth={1.3}
            strokeLinejoin="round"
          />
        </svg>
      ) : null;

    content = (
      <>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur
              stdDeviation={`${bx.toFixed(2)} ${by.toFixed(2)}`}
            />
          </filter>
        </svg>
        <AbsoluteFill
          style={{ filter: bx > 0.2 ? `url(#${filterId})` : undefined }}
        >
          {world}
        </AbsoluteFill>
        {cursor}
      </>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <GshGround
        preset={preset}
        params={gParams}
        timeOffset={c.groundOffset}
        timeScale={0.6}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(${portrait ? "90% 46%" : "64% 60%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      {content}
    </AbsoluteFill>
  );
}

export default CaretDolly;
