"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import {
  type CSSProperties,
  useEffect,
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

const geist = loadFont("normal", {
  weights: ["300"],
  subsets: ["latin"],
});

export interface HeadlineToLineProps {
  words?: string[];
  accentIndex?: number;
  continuation?: string;
  accent?: string;
  ink?: string;
  background?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    ink: "#eef2ff",
    accent: "#8fb4ff",
    caret: "#b9cdff",
    ground: "earthshine" as GshPresetId,
    groundOffset: 4,
    scrim: "2,4,10",
    scrimAlpha: 0.5,
  },
  light: {
    ink: "#14161c",
    accent: "#3B5BFD",
    caret: "#3B5BFD",
    ground: "paper-crease" as GshPresetId,
    groundOffset: 2,
    scrim: "238,236,232",
    scrimAlpha: 0.55,
  },
} as const;

const FONT_PX = 200;
const TRACK_BIG = -0.045;
const TRACK_SMALL = -0.02;
const POP_SCALE = 0.12;

const BEAT = {
  wordStep: 6,
  enter: 12,
  pop: 24,
  shrink: 48,
  shrinkLen: 18,
  wordLag: 1,
  type: 66,
  charsPerFrame: 1,
  rise: 42,
  riseLen: 42,
};

const ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const LIGHT_IN = Easing.bezier(0.32, 0.72, 0, 1);
const CAMERA = Easing.bezier(0.87, 0, 0.13, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Measure = (s: string, track: number) => number;

function buildMeasure(_version: number): Measure {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string, track: number) => {
    const key = `${track}|${s}`;
    if (cache[key] === undefined) {
      if (!ctx) return s.length * 0.55;
      ctx.font = `300 ${FONT_PX}px "${geist.fontFamily}"`;
      cache[key] =
        ctx.measureText(s).width / FONT_PX + track * Array.from(s).length;
    }
    return cache[key];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("headline-to-line: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      geist.waitUntilDone(),
      document.fonts.load(`300 100px "${geist.fontFamily}"`),
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

interface Slot {
  x: number;
  y: number;
  line: number;
}

interface Line {
  start: number;
  end: number;
  width: number;
}

function wrapWords(
  words: string[],
  room: number,
  w: (s: string) => number,
): string[][] {
  const lines: string[][] = [];
  let cur: string[] = [];
  for (const word of words) {
    if (cur.length > 0 && w([...cur, word].join(" ")) > room) {
      lines.push(cur);
      cur = [];
    }
    cur.push(word);
  }
  if (cur.length > 0) lines.push(cur);
  return lines;
}

export function HeadlineToLine({
  words = ["Your", "launch", "video"],
  accentIndex = 1,
  continuation = ", built from blocks you own",
  accent,
  ink,
  background,
  theme = "dark",
  ground,
  groundParams,
}: HeadlineToLineProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? c.ground;
  const bg = background ?? gshParams(preset, groundParams).background;
  const m = useMeasure();
  const t = frame;

  const rise = interpolate(t, [BEAT.rise, BEAT.rise + BEAT.riseLen], [0, 1], {
    ...CLAMP,
    easing: LIGHT_IN,
  });
  const portrait = H > W * 1.1;
  const push = interpolate(frame, [0, durationInFrames], [1, 1.03], CLAMP);
  const groundShift = (1 - rise) * (portrait ? 0.16 : 0.26);
  const scrimA = c.scrimAlpha * (1 - 0.45 * rise);

  let content: React.ReactNode = <div />;
  if (m && words.length > 0) {
    const head = words.join(" ");
    const full = head + continuation;
    const marginX = W * (portrait ? 0.08 : 0.07);
    const room = W - marginX * 2;
    const cx = W / 2;
    const cy = H * (portrait ? 0.46 : 0.47);

    const wb = (s: string) => m(s, TRACK_BIG);
    const ws = (s: string) => m(s, TRACK_SMALL);
    const longest = Math.max(...words.map((w) => wb(w)));
    const oneLine = (room * 0.92) / wb(head);
    const minOne = portrait ? W * 0.2 : H * 0.15;
    const cap = portrait ? W * 0.27 : H * 0.28;
    const B =
      oneLine >= minOne
        ? Math.min(cap, oneLine)
        : Math.min(cap, room / longest);
    const bigLines =
      oneLine >= minOne ? [words] : wrapWords(words, room / B, wb);
    const bigLH = B * 1.02;
    const multi = bigLines.length > 1;
    const bigSlots: Slot[] = [];
    bigLines.forEach((line, li) => {
      const lw = wb(line.join(" ")) * B;
      let x = cx - lw / 2;
      const y = cy + (li - (bigLines.length - 1) / 2) * bigLH;
      line.forEach((word, wi) => {
        const ww = wb(word) * B;
        bigSlots.push({ x: x + ww / 2, y, line: li });
        x += ww + (wi < line.length - 1 ? wb(" ") * B : 0);
      });
    });

    const s = Math.max(H * 0.026, portrait ? W * 0.068 : H * 0.068);
    const tokens = full.split(" ");
    const lines: Line[] = [];
    let pos = 0;
    let cur = "";
    let curStart = 0;
    for (const tok of tokens) {
      const next = cur.length > 0 ? `${cur} ${tok}` : tok;
      if (cur.length > 0 && ws(next) * s > room) {
        lines.push({
          start: curStart,
          end: curStart + cur.length,
          width: ws(cur) * s,
        });
        curStart = pos;
        cur = tok;
      } else {
        cur = next;
      }
      pos += tok.length + 1;
    }
    lines.push({
      start: curStart,
      end: curStart + cur.length,
      width: ws(cur) * s,
    });
    const smallLH = s * 1.3;
    const lineX = (i: number) => cx - lines[i].width / 2;
    const lineY = (i: number) => cy + (i - (lines.length - 1) / 2) * smallLH;
    const lineOf = (ch: number) => {
      for (let i = 0; i < lines.length; i++) {
        if (ch <= lines[i].end) return i;
      }
      return lines.length - 1;
    };
    const charX = (ch: number) => {
      const li = lineOf(ch);
      return lineX(li) + ws(full.slice(lines[li].start, ch)) * s;
    };

    const smallSlots: Slot[] = [];
    let at = 0;
    for (const word of words) {
      const li = lineOf(at);
      const x0 = charX(at);
      smallSlots.push({ x: x0 + (ws(word) * s) / 2, y: lineY(li), line: li });
      at += word.length + 1;
    }

    const k1 = s / B;
    const centroid = (sl: Slot[]): Slot => ({
      line: 0,
      x: sl.reduce((a, q) => a + q.x, 0) / sl.length,
      y: sl.reduce((a, q) => a + q.y, 0) / sl.length,
    });
    const bigC = centroid(bigSlots);
    const smallC = centroid(smallSlots);
    const validAccent = accentIndex >= 0 && accentIndex < words.length;
    const accentW = validAccent ? wb(words[accentIndex]) * B : 0;
    const shrinkP = (i: number, tt: number) => {
      const at0 = BEAT.shrink + i * (multi ? BEAT.wordLag * 3 : BEAT.wordLag);
      return interpolate(tt, [at0, at0 + BEAT.shrinkLen], [0, 1], {
        ...CLAMP,
        easing: CAMERA,
      });
    };
    const popSpring = spring({
      frame: t - BEAT.pop,
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    const popNow = validAccent ? popSpring * (1 - shrinkP(accentIndex, t)) : 0;
    const popShift = (i: number) => {
      if (!validAccent || i === accentIndex) return 0;
      if (bigSlots[i].line !== bigSlots[accentIndex].line) return 0;
      const extra = POP_SCALE * popNow * accentW * 0.5 + B * 0.03 * popNow;
      return i < accentIndex ? -extra : extra;
    };
    const wordNodes = words.map((word, i) => {
      const enterAt = i * BEAT.wordStep - 4;
      const e = interpolate(t, [enterAt, enterAt + BEAT.enter], [0, 1], {
        ...CLAMP,
        easing: ENTER,
      });
      const p = shrinkP(i, t);
      const pPrev = shrinkP(i, t - 1);
      const k = Math.exp(Math.log(k1) * p);
      const relX =
        (bigSlots[i].x - bigC.x) * (1 - p) +
        ((smallSlots[i].x - smallC.x) / k1) * p;
      const relY =
        (bigSlots[i].y - bigC.y) * (1 - p) +
        ((smallSlots[i].y - smallC.y) / k1) * p;
      const x = multi
        ? bigSlots[i].x + (smallSlots[i].x - bigSlots[i].x) * p
        : bigC.x + (smallC.x - bigC.x) * p + (relX + popShift(i)) * k;
      const y = multi
        ? bigSlots[i].y + (smallSlots[i].y - bigSlots[i].y) * p
        : bigC.y + (smallC.y - bigC.y) * p + relY * k;
      const speed = Math.abs(p - pPrev);
      const blurScreen = Math.min(6, speed * 36) + (1 - e) * 6;

      const isAccent = i === accentIndex;
      const popAmt = isAccent ? popNow : 0;
      const lifted = -0.14 * popAmt;
      const popScale = 1 + POP_SCALE * popAmt;
      const tint = isAccent
        ? interpolate(t - BEAT.pop, [0, 6], [0, 1], {
            ...CLAMP,
            easing: LIGHT_IN,
          })
        : 0;
      const color =
        tint > 0
          ? `color-mix(in oklab, ${hi} ${(tint * 100).toFixed(1)}%, ${inkC})`
          : inkC;

      const style: CSSProperties = {
        position: "absolute",
        left: 0,
        top: 0,
        fontSize: B,
        lineHeight: 1,
        whiteSpace: "pre",
        fontFamily: geist.fontFamily,
        fontWeight: 300,
        letterSpacing: `${TRACK_BIG + (TRACK_SMALL - TRACK_BIG) * p}em`,
        color,
        transform: `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) translate(-50%, -50%) scale(${k.toFixed(5)})`,
        clipPath: "inset(-80% -30% -0.26em -30%)",
      };
      return (
        <div key={`w${i}`} style={style}>
          <div
            style={{
              transform: `translateY(${((1 - e) * 0.62 + lifted).toFixed(4)}em) scale(${popScale.toFixed(4)})`,
              transformOrigin: "50% 80%",
              opacity: e,
              filter:
                blurScreen > 0.05
                  ? `blur(${(blurScreen / k).toFixed(2)}px)`
                  : undefined,
            }}
          >
            {word}
          </div>
        </div>
      );
    });

    const landed =
      BEAT.shrink +
      BEAT.shrinkLen +
      (words.length - 1) * BEAT.wordLag * (multi ? 3 : 1);
    const typeAt = Math.max(BEAT.type, landed);
    const typed = Math.max(
      0,
      Math.min(
        continuation.length,
        Math.floor((t - typeAt) * BEAT.charsPerFrame),
      ),
    );
    const typeEnd =
      typeAt + Math.ceil(continuation.length / BEAT.charsPerFrame);
    const headLen = head.length;
    const caretCh = headLen + typed;
    const textNodes = lines.map((ln, li) => {
      const from = Math.max(ln.start, headLen);
      const to = Math.min(ln.end, caretCh);
      if (to <= from) return null;
      return (
        <div
          key={`l${li}`}
          style={{
            position: "absolute",
            left: charX(from),
            top: lineY(li) - s / 2,
            fontSize: s,
            lineHeight: 1,
            whiteSpace: "pre",
            fontFamily: geist.fontFamily,
            fontWeight: 300,
            letterSpacing: `${TRACK_SMALL}em`,
            color: inkC,
          }}
        >
          {full.slice(from, to)}
        </div>
      );
    });

    const caretIn = interpolate(t, [landed - 6, landed], [0, 1], CLAMP);
    const blinkOn =
      t < typeEnd + 6 || Math.floor((t - typeEnd - 6) / 15) % 2 === 1;
    const caretLine = lineOf(caretCh);
    const caretX = charX(caretCh) + s * 0.06;
    const caret = (
      <div
        style={{
          position: "absolute",
          left: caretX,
          top: lineY(caretLine) - s * 0.56,
          width: Math.max(2, s * 0.05),
          height: s * 1.12,
          borderRadius: s,
          background: c.caret,
          opacity: caretIn * (blinkOn ? 1 : 0),
        }}
      />
    );

    content = (
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `scale(${push.toFixed(5)})`,
        }}
      >
        {wordNodes}
        {textNodes}
        {caret}
      </div>
    );
  }

  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translateY(${(groundShift * 100).toFixed(3)}%) scale(${(1.08 - 0.04 * rise).toFixed(4)})`,
        }}
      >
        <GshGround
          preset={preset}
          params={groundParams}
          timeOffset={c.groundOffset}
          timeScale={0.25}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 46% at 50% ${portrait ? 46 : 47}%, rgba(${c.scrim},${scrimA.toFixed(3)}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      {content}
    </AbsoluteFill>
  );
}

export default HeadlineToLine;
