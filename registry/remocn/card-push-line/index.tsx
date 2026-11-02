"use client";

import { loadFont } from "@remotion/google-fonts/Geist";
import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import {
  type CSSProperties,
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

const sans = loadFont("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

export interface CardPushLineProps {
  line?: string;
  command?: string;
  prompt?: string;
  placeholder?: string;
  modelLabel?: string;
  chipLabel?: string;
  attachName?: string;
  attachMeta?: string;
  accent?: string;
  ink?: string;
  background?: string;
  theme?: "dark" | "light";
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

const THEMES = {
  dark: {
    ink: "#eef3ff",
    muted: "rgba(238,243,255,0.46)",
    faint: "rgba(238,243,255,0.1)",
    accent: "#4f7dff",
    cmdInk: "#a9c4ff",
    cmdBg: "rgba(79,125,255,0.2)",
    rim: "168,198,255",
    ground: "film-blue" as GshPresetId,
    groundParams: undefined as Partial<GradientParams> | undefined,
    groundOffset: 3,
    scrim: "2,5,12",
    scrimAlpha: 0.5,
    card: "linear-gradient(180deg, #121722 0%, #0c1018 100%)",
    border: "rgba(255,255,255,0.08)",
    shadow: "0 40px 90px -24px rgba(0,3,12,0.7)",
    send: "rgba(238,243,255,0.12)",
    tile: "rgba(238,243,255,0.035)",
  },
  light: {
    ink: "#14161c",
    muted: "rgba(20,22,28,0.45)",
    faint: "rgba(20,22,28,0.09)",
    accent: "#3B5BFD",
    cmdInk: "#2f4fe0",
    cmdBg: "rgba(59,91,253,0.1)",
    rim: "59,91,253",
    ground: "glasswork" as GshPresetId,
    groundParams: {
      colors: ["#a9c9ec", "#4f8fd6", "#2b5fbe", "#cfe0f2"],
      background: "#eef1f5",
    } as Partial<GradientParams> | undefined,
    groundOffset: 2,
    scrim: "238,241,245",
    scrimAlpha: 0.5,
    card: "#ffffff",
    border: "rgba(17,24,40,0.07)",
    shadow:
      "0 1px 3px rgba(17,24,40,0.06), 0 36px 80px -24px rgba(17,30,60,0.24)",
    send: "rgba(20,22,28,0.08)",
    tile: "rgba(20,22,28,0.025)",
  },
};

const BEAT = {
  wordStep: 3,
  enter: 12,
  card: 36,
  cmd: 60,
  chip: 72,
  prompt: 76,
  arm: 108,
};

const TRACK = -0.03;
const FONT_PX = 200;
const ENTER = Easing.bezier(0.22, 1, 0.36, 1);
const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

type Measure = (s: string, font: string, track: number) => number;

function buildMeasure(_version: number): Measure {
  const ctx = document.createElement("canvas").getContext("2d");
  const cache: Record<string, number> = {};
  return (s: string, font: string, track: number) => {
    const key = `${font}|${track}|${s}`;
    if (cache[key] === undefined) {
      if (!ctx) return s.length * 0.55;
      ctx.font = font.replace("@", `${FONT_PX}px`);
      cache[key] =
        ctx.measureText(s).width / FONT_PX + track * Array.from(s).length;
    }
    return cache[key];
  };
}

function useMeasure() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("card-push-line: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      sans.waitUntilDone(),
      mono.waitUntilDone(),
      document.fonts.load(`300 100px "${sans.fontFamily}"`),
      document.fonts.load(`400 100px "${sans.fontFamily}"`),
      document.fonts.load(`400 100px "${mono.fontFamily}"`),
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

function wrap(words: string[], room: number, w: (s: string) => number) {
  const lines: string[] = [];
  let cur = "";
  for (const word of words) {
    const next = cur.length > 0 ? `${cur} ${word}` : word;
    if (cur.length > 0 && w(next) > room) {
      lines.push(cur);
      cur = word;
    } else {
      cur = next;
    }
  }
  if (cur.length > 0) lines.push(cur);
  return lines;
}

export function CardPushLine({
  line = "You can just write it",
  command = "/launch-video",
  prompt = "a teaser for the 2.0 release",
  placeholder = "Describe your launch…",
  modelLabel = "Remocn 1",
  chipLabel = "Brand kit",
  attachName = "release-notes-2.0.md",
  attachMeta = "Markdown · 18 KB",
  accent,
  ink,
  background,
  theme = "dark",
  ground,
  groundParams,
}: CardPushLineProps) {
  const frame = useCurrentFrame();
  const { width: W, height: H, fps, durationInFrames } = useVideoConfig();
  const c = THEMES[theme];
  const inkC = ink ?? c.ink;
  const hi = accent ?? c.accent;
  const preset = ground ?? c.ground;
  const gParams = groundParams ?? (ground ? undefined : c.groundParams);
  const bg = background ?? gshParams(preset, gParams).background;
  const m = useMeasure();
  const portrait = H > W * 1.1;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const f = frame;

  let content: ReactNode = <div />;
  if (m) {
    const lineFont = `300 @ "${sans.fontFamily}"`;
    const uiFont = `400 @ "${sans.fontFamily}"`;
    const monoFont = `400 @ "${mono.fontFamily}"`;
    const room = W * (portrait ? 0.84 : 0.7);
    const words = line.split(" ").filter(Boolean);
    const wl = (s: string) => m(s, lineFont, TRACK);
    let L = Math.min(portrait ? W * 0.12 : H * 0.15, room / wl(line));
    let sLines = [line];
    if (portrait && L < W * 0.095) {
      L = Math.min(W * 0.12, room / Math.max(...words.map(wl)));
      sLines = wrap(words, room / L, wl);
    }
    const LLH = L * 1.08;
    const blockW = Math.max(...sLines.map((s) => wl(s) * L));
    const restRight = W / 2 + blockW / 2;

    const CW = portrait ? W * 0.78 : W * 0.62;
    const T = portrait ? W * 0.046 : Math.max(H * 0.048, CW * 0.042);
    const u = T / 24;
    const pad = 24 * u;
    const PLH = T * 1.45;
    const cmdT = T * 0.86;
    const chipPadX = 8 * u;
    const chipW = m(command, monoFont, 0) * cmdT + chipPadX * 2;
    const promptRoom = CW - pad * 2;
    const firstIndent = chipW + 8 * u;
    const pw = (s: string) => m(s, uiFont, -0.01) * T;
    const pWords = prompt.split(" ").filter(Boolean);
    const pLines: { text: string; x: number }[] = [];
    {
      let cur = "";
      let indent = firstIndent;
      for (const word of pWords) {
        const next = cur.length > 0 ? `${cur} ${word}` : word;
        if (cur.length > 0 && indent + pw(next) > promptRoom) {
          pLines.push({ text: cur, x: indent });
          cur = word;
          indent = 0;
        } else {
          cur = next;
        }
      }
      pLines.push({ text: cur, x: indent });
    }
    const barH = 36 * u;
    const attH = 52 * u;
    const top0 = pad + attH + 14 * u;
    const CH = Math.max(
      top0 + pLines.length * PLH + 24 * u + barH + pad * 0.8,
      portrait ? H * 0.2 : H * 0.32,
    );
    const restLeft = (W - CW) / 2;
    const startLeft = W * 1.04;
    const cardSp = (ff: number) =>
      spring({
        frame: ff - BEAT.card,
        fps,
        config: { mass: 0.8, damping: 18, stiffness: 110 },
      });
    const cardLeft = (ff: number) =>
      restLeft + (startLeft - restLeft) * (1 - cardSp(ff));
    const gap = W * 0.03;

    let off = 0;
    let vel = 0;
    let lastV = 0;
    for (let k = BEAT.card; k <= f; k++) {
      const limit = cardLeft(k) - gap - restRight;
      const free = off + vel;
      const next = Math.min(free, limit);
      lastV = next - off;
      vel = limit < free ? lastV : lastV * 0.93;
      off = next;
    }
    const lineSpeed = Math.abs(lastV);
    const cardV = Math.abs(cardLeft(f) - cardLeft(f - 1));
    const lineBlur = Math.min(10, lineSpeed * 0.12);
    const cardBlur = Math.min(10, cardV * 0.1);
    const rim = Math.min(1, cardV / 18);

    const sentence = (
      <div
        style={{
          position: "absolute",
          inset: 0,
          WebkitMaskImage: `linear-gradient(90deg, transparent 0px, #000 ${(W * 0.1).toFixed(0)}px)`,
          maskImage: `linear-gradient(90deg, transparent 0px, #000 ${(W * 0.1).toFixed(0)}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            transform: `translateX(${off.toFixed(2)}px)`,
            filter: lineBlur > 0.2 ? `url(#lb${uid})` : undefined,
          }}
        >
          {sLines.map((s, li) => {
            const lw = wl(s) * L;
            const y = H / 2 + (li - (sLines.length - 1) / 2) * LLH;
            const before = sLines
              .slice(0, li)
              .reduce((a, q) => a + q.split(" ").length, 0);
            return (
              <div
                key={`sl${li}`}
                style={{
                  position: "absolute",
                  left: W / 2 - lw / 2,
                  top: y - L / 2,
                  display: "flex",
                  whiteSpace: "pre",
                  fontFamily: sans.fontFamily,
                  fontWeight: 300,
                  fontSize: L,
                  lineHeight: 1,
                  letterSpacing: `${TRACK}em`,
                  color: inkC,
                }}
              >
                {s.split(" ").map((w, wi) => {
                  const at = (before + wi) * BEAT.wordStep - 4;
                  const e = interpolate(f, [at, at + BEAT.enter], [0, 1], {
                    ...CLAMP,
                    easing: ENTER,
                  });
                  return (
                    <span
                      key={`w${wi}`}
                      style={{
                        display: "inline-block",
                        clipPath: "inset(-40% -20% -0.24em -20%)",
                        marginRight:
                          wi < s.split(" ").length - 1 ? "0.25em" : 0,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transform: `translateY(${((1 - e) * 0.7).toFixed(4)}em)`,
                          opacity: e,
                          filter:
                            e < 1
                              ? `blur(${((1 - e) * 6).toFixed(2)}px)`
                              : undefined,
                        }}
                      >
                        {w}
                      </span>
                    </span>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );

    const cmdRate = Math.max(1.2, command.length / 11);
    const promptRate = Math.max(1.2, prompt.length / 28);
    const cmdTyped = Math.max(
      0,
      Math.min(command.length, Math.floor((f - BEAT.cmd) * cmdRate)),
    );
    const pTyped = Math.max(
      0,
      Math.min(prompt.length, Math.floor((f - BEAT.prompt) * promptRate)),
    );
    const promptEnd = BEAT.prompt + prompt.length / promptRate;
    const chipPop = spring({
      frame: f - BEAT.chip,
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    const chipOn = f >= BEAT.chip;
    const phOp = interpolate(f, [BEAT.cmd - 4, BEAT.cmd], [1, 0], CLAMP);
    const armP = spring({
      frame: f - BEAT.arm,
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    const armed = f >= BEAT.arm;
    const attIn = spring({
      frame: f - (BEAT.card + 8),
      fps,
      config: { mass: 0.5, damping: 12, stiffness: 200 },
    });
    const toolIn = [0, 1, 2, 3, 4].map((i) =>
      spring({
        frame: f - (BEAT.card + 12 + i * 2),
        fps,
        config: { mass: 0.5, damping: 12, stiffness: 200 },
      }),
    );

    let left = pTyped;
    const promptNodes = pLines.map((pl, li) => {
      const take = Math.max(0, Math.min(pl.text.length, left));
      left -= pl.text.length + 1;
      if (take <= 0) return null;
      return (
        <div
          key={`p${li}`}
          style={{
            position: "absolute",
            left: pad + pl.x,
            top: top0 + li * PLH + (PLH - T) / 2,
            fontFamily: sans.fontFamily,
            fontWeight: 400,
            fontSize: T,
            lineHeight: 1,
            letterSpacing: "-0.01em",
            whiteSpace: "pre",
            color: inkC,
          }}
        >
          {pl.text.slice(0, take)}
        </div>
      );
    });
    let caretX =
      pad + chipPadX + m(command.slice(0, cmdTyped), monoFont, 0) * cmdT;
    let caretLi = 0;
    if (f >= BEAT.prompt && pTyped > 0) {
      let rem = pTyped;
      for (let li = 0; li < pLines.length; li++) {
        const len = pLines[li].text.length;
        if (rem <= len || li === pLines.length - 1) {
          caretX =
            pad +
            pLines[li].x +
            pw(pLines[li].text.slice(0, Math.min(rem, len)));
          caretLi = li;
          break;
        }
        rem -= len + 1;
      }
    } else if (f >= BEAT.chip) {
      caretX = pad + firstIndent;
    }
    const typing =
      (f >= BEAT.cmd && f < BEAT.cmd + command.length / cmdRate + 2) ||
      (f >= BEAT.prompt && f < promptEnd + 2);
    const caretOn =
      f >= BEAT.card + 18 && (typing || Math.floor(f / 14) % 2 === 0);
    const caretShow = f < BEAT.arm ? 1 : 0;

    const chipStyle: CSSProperties = {
      position: "absolute",
      left: pad,
      top: top0 + (PLH - (cmdT + 10 * u)) / 2,
      height: cmdT + 10 * u,
      width: chipW,
      borderRadius: 8 * u,
      background: chipOn ? c.cmdBg : "transparent",
      transform: `scale(${(chipOn ? 0.9 + 0.1 * chipPop : 1).toFixed(4)})`,
      transformOrigin: "0% 50%",
      display: "flex",
      alignItems: "center",
      paddingLeft: chipPadX,
      fontFamily: mono.fontFamily,
      fontWeight: 400,
      fontSize: cmdT,
      lineHeight: 1,
      whiteSpace: "pre",
      color: c.cmdInk,
    };
    const ctrlD = 32 * u;
    const labelF = 15 * u;
    const push = interpolate(f, [0, durationInFrames], [1, 1.03], CLAMP);
    const tiltY = -9 * (1 - Math.min(1, cardSp(f)));

    const card = (
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          filter: cardBlur > 0.2 ? `url(#cb${uid})` : undefined,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: cardLeft(f),
            top: H / 2 - CH / 2,
            width: CW,
            height: CH,
            borderRadius: 24 * u,
            background: c.card,
            boxShadow: `inset 0 0 0 1px ${c.border}, inset ${(1.5 * u).toFixed(2)}px 0 0 rgba(${c.rim},${(0.9 * rim).toFixed(3)}), ${c.shadow}`,
            transform: `perspective(${(W * 1.6).toFixed(0)}px) rotateY(${tiltY.toFixed(3)}deg)`,
            transformOrigin: "0% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: pad,
              top: pad,
              height: attH,
              display: "flex",
              alignItems: "center",
              gap: 10 * u,
              padding: `0 ${16 * u}px 0 ${8 * u}px`,
              borderRadius: 12 * u,
              background: c.tile,
              boxShadow: `inset 0 0 0 1px ${c.faint}`,
              whiteSpace: "pre",
              opacity: Math.min(1, attIn * 1.5),
              transform: `scale(${(0.92 + 0.08 * attIn).toFixed(4)})`,
              transformOrigin: "0% 50%",
            }}
          >
            <div
              style={{
                width: 36 * u,
                height: 36 * u,
                borderRadius: 8 * u,
                background: c.cmdBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon size={20 * u} color={c.cmdInk}>
                <path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8z" />
                <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
              </Icon>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 3 * u,
                fontFamily: sans.fontFamily,
                fontWeight: 400,
                lineHeight: 1.1,
              }}
            >
              <div
                style={{
                  fontSize: labelF,
                  color: inkC,
                  letterSpacing: "-0.005em",
                }}
              >
                {attachName}
              </div>
              <div style={{ fontSize: 13 * u, color: c.muted }}>
                {attachMeta}
              </div>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              left: pad,
              top: top0 + (PLH - T) / 2,
              fontFamily: sans.fontFamily,
              fontWeight: 400,
              fontSize: T,
              lineHeight: 1,
              letterSpacing: "-0.01em",
              whiteSpace: "pre",
              color: c.muted,
              opacity: phOp,
            }}
          >
            {placeholder}
          </div>
          {cmdTyped > 0 ? (
            <div style={chipStyle}>{command.slice(0, cmdTyped)}</div>
          ) : null}
          {promptNodes}
          <div
            style={{
              position: "absolute",
              left: caretX + T * 0.04,
              top: top0 + caretLi * PLH + (PLH - T * 1.2) / 2,
              width: Math.max(1.5, T * 0.06),
              height: T * 1.2,
              borderRadius: T,
              background: inkC,
              opacity: caretOn ? caretShow : 0,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: pad * 0.8,
              right: pad * 0.8,
              bottom: pad * 0.8,
              height: barH,
              display: "flex",
              alignItems: "center",
              gap: 8 * u,
              fontFamily: sans.fontFamily,
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
                <circle cx="12" cy="12" r="8.5" />
                <path d="M12 3.5v17M3.5 12h8.5" />
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
                width: 34 * u,
                height: 34 * u,
                borderRadius: 34 * u,
                flexShrink: 0,
                background: armed ? hi : c.send,
                boxShadow: armed
                  ? "inset 0 1px 0 rgba(255,255,255,0.22)"
                  : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: `scale(${(toolIn[4] * (armed ? 0.9 + 0.1 * armP : 1)).toFixed(4)})`,
              }}
            >
              <Icon size={18 * u} color={armed ? "#ffffff" : c.muted}>
                <path d="M12 19V5M6 11l6-6 6 6" />
              </Icon>
            </div>
          </div>
        </div>
      </div>
    );

    content = (
      <>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <filter id={`lb${uid}`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={`${lineBlur.toFixed(2)} 0`} />
          </filter>
          <filter id={`cb${uid}`} x="-5%" y="-5%" width="110%" height="110%">
            <feGaussianBlur stdDeviation={`${cardBlur.toFixed(2)} 0`} />
          </filter>
        </svg>
        <AbsoluteFill style={{ transform: `scale(${push.toFixed(5)})` }}>
          {sentence}
          {card}
        </AbsoluteFill>
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
          background: `radial-gradient(${portrait ? "90% 50%" : "70% 64%"} at 50% 50%, rgba(${c.scrim},${c.scrimAlpha}) 0%, rgba(${c.scrim},0) 100%)`,
        }}
      />
      {content}
    </AbsoluteFill>
  );
}

export default CardPushLine;
