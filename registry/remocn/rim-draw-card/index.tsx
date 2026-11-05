"use client";

import { loadFont as loadMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadHanken } from "@remotion/google-fonts/HankenGrotesk";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const hanken = loadHanken("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadMono("normal", { weights: ["400"], subsets: ["latin"] });

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const DRAW = Easing.bezier(0.22, 1, 0.36, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const PRESS = { mass: 0.5, damping: 14, stiffness: 260 };

const B = {
  words: -8,
  stroke: 18,
  strokeLen: 30,
  erase: 20,
  slide: 18,
  chip: 24,
  tail: 32,
  tailLen: 16,
  body: 36,
  pan: 36,
  title: 42,
  field: 48,
  footer: 54,
  type: 60,
  chips: 66,
  preview: 78,
  press: 96,
  saved: 99,
  end: 138,
};

export const RIM_DRAW_CARD_DURATION = B.end;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export interface RimDrawCardProps {
  theme?: "dark" | "light";
  accent?: string;
  primary?: string;
  line?: string;
  command?: string;
  title?: string;
  subtitle?: string;
  label?: string;
  instructions?: string;
  action?: string;
  limit?: number;
  done?: string;
  uses?: string[];
  preview?: string;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

function Icon({
  d,
  size,
  color,
  width = 1.5,
}: {
  d: string;
  size: number;
  color: string;
  width?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const CHECK = "m5 12.5 4.5 4.5L19 7.5";

export function RimDrawCard({
  theme = "dark",
  accent,
  primary,
  line = "Just tell it once.",
  command = "/brand-voice",
  title = "Brand voice",
  subtitle = "Used every time you write launch copy.",
  label = "Instructions",
  instructions = "Short, calm sentences. Name the feature first, then what it saves you.",
  action = "Save skill",
  limit = 600,
  done = "Saved",
  uses = ["Launch posts", "Changelog", "Release emails"],
  preview = "Scenes now render three times faster. Ship the reel tonight.",
  ground,
  groundParams,
}: RimDrawCardProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;

  const acc = accent ?? (dark ? "#9cc2ff" : "#2a5cff");
  const prim = primary ?? (dark ? "#3B5BFD" : "#1f4fff");
  const ink = dark ? "#f2f6ff" : "#0f1320";
  const cardInk = dark ? "#eef2fa" : "#121624";
  const muted = dark ? "rgba(222,230,246,0.58)" : "rgba(18,22,36,0.56)";
  const hair = dark ? "rgba(255,255,255,0.09)" : "rgba(16,22,48,0.11)";

  const cw = portrait ? 880 : 680;
  const u = portrait ? 1.76 : 1.18;
  const ch = (portrait ? 622 : 368) * u;
  const r = 16 * u;
  const pad = 24 * u;
  const lead = stageW * 0.75;
  const fontSize = portrait ? 92 : 50;

  const len1 = cw + lead - r;
  const total = len1 + 2 * Math.PI * r + 2 * (ch - 2 * r) + (cw - 2 * r);
  const tailEnd = lead + r;
  const pathD = `M ${cw + lead} 0 L ${r} 0 A ${r} ${r} 0 0 0 0 ${r} L 0 ${ch - r} A ${r} ${r} 0 0 0 ${r} ${ch} L ${cw - r} ${ch} A ${r} ${r} 0 0 0 ${cw} ${ch - r} L ${cw} ${r} A ${r} ${r} 0 0 0 ${cw - r} 0`;

  const head = ramp(frame, B.stroke, B.strokeLen, DRAW) * total;
  const tail = ramp(frame, B.tail, B.tailLen, MOVE) * tailEnd;
  const drawn = ramp(frame, B.stroke + B.strokeLen - 6, 6, MOVE);
  const settle = ramp(frame, B.body + 6, 24, MOVE);
  const visible = Math.max(0, head - tail);
  const hotLen = Math.min(visible, 90 * u);

  const bodyIn = ramp(frame, B.body, 12, DRAW);
  const chipIn = spring({ frame: frame - B.chip, fps, config: CHIP });
  const chipHot = ramp(frame, B.chip, 6) * (1 - 0.7 * bodyIn);

  const pan = spring({ frame: frame - B.pan, fps, config: HEAVY });
  const slide = spring({ frame: frame - B.slide, fps, config: HEAVY });
  const offX = portrait ? 0 : mix(300, 0, pan);
  const offY = portrait ? mix(300, 0, pan) : 0;
  const lineX = portrait ? 0 : mix(0, -330, slide);
  const lineY = portrait ? mix(0, -560, slide) : 0;

  const brighten = ramp(frame, B.body - 4, 24, SWAY);
  const push = 1 + 0.035 * ramp(frame, B.pan, B.end - B.pan, SWAY);

  const typed = Math.round(
    interpolate(
      frame,
      [B.type, B.type + instructions.length / 2.2],
      [0, instructions.length],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );
  const caret =
    frame >= B.field + 6 &&
    frame < B.press &&
    (typed < instructions.length || Math.floor(frame / 8) % 2 === 0);
  const focus = ramp(frame, B.type - 6, 8) * (1 - ramp(frame, B.press, 8));
  const press =
    spring({ frame: frame - B.press, fps, config: PRESS }) -
    spring({ frame: frame - B.press - 4, fps, config: PRESS });
  const savedIn = spring({ frame: frame - B.saved, fps, config: CHIP });
  const savedOn = frame >= B.saved;

  const item = (start: number) => {
    const p = ramp(frame, start, 12);
    return {
      opacity: p,
      transform: `translateY(${mix(10 * u, 0, p)}px)`,
      filter: p < 1 ? `blur(${(1 - p) * 4}px)` : undefined,
    };
  };

  const letters = Array.from(line);
  const n = letters.length;

  const resolvedGround: GshPresetId =
    ground ?? (dark ? "film-blue" : "paper-crease");

  const surface = dark
    ? "linear-gradient(180deg, #131722 0%, #0d1018 100%)"
    : "#ffffff";

  return (
    <AbsoluteFill style={{ fontFamily: hanken.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={groundParams}
        timeOffset={5}
        timeScale={0.55}
      />
      <AbsoluteFill
        style={{
          background: dark ? "#02050c" : "#f4f3f0",
          opacity: mix(dark ? 0.58 : 0.55, dark ? 0.12 : 0.3, brighten),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: stageW,
          height: stageH,
          transform: `scale(${sc})`,
          transformOrigin: "0 0",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${push})`,
            transformOrigin: "50% 50%",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: `translate(-50%, -50%) translate(${lineX}px, ${lineY}px)`,
              display: "flex",
              whiteSpace: "pre",
              fontSize,
              fontWeight: 300,
              letterSpacing: "-0.035em",
              lineHeight: 1.1,
              color: ink,
            }}
          >
            {letters.map((ch_, i) => {
              const rise = ramp(frame, B.words + Math.floor(i / 3), 14);
              const k = n - 1 - i;
              const gone = ramp(frame, B.erase + k * 0.72, 7, MOVE);
              return (
                <span
                  key={`${ch_}-${i.toString()}`}
                  style={{
                    display: "inline-block",
                    opacity: rise * (1 - gone),
                    transform: `translateY(${mix(0.5, 0, rise)}em) translateX(${gone * 0.18}em)`,
                    filter:
                      rise < 1 || gone > 0
                        ? `blur(${(1 - rise) * 6 + gone * 10}px)`
                        : undefined,
                  }}
                >
                  {ch_}
                </span>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: stageW / 2 - cw / 2 + offX,
              top: stageH / 2 - ch / 2 + offY,
              width: cw,
              height: ch,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: r,
                background: surface,
                boxShadow: dark
                  ? `0 0 0 1px rgba(255,255,255,0.08), 0 ${28 * u}px ${70 * u}px -${10 * u}px rgba(0,2,10,0.6)`
                  : `0 0 0 1px rgba(16,22,48,0.07), 0 1px 3px rgba(16,22,48,0.06), 0 ${26 * u}px ${60 * u}px -${14 * u}px rgba(16,22,48,0.22)`,
                opacity: bodyIn,
                transform: `scale(${mix(0.985, 1, bodyIn)})`,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: pad,
                display: "flex",
                flexDirection: "column",
                color: cardInk,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10 * u,
                    height: 30 * u,
                    padding: `0 ${10 * u}px`,
                    borderRadius: 7 * u,
                    fontFamily: mono.fontFamily,
                    fontSize: 15 * u,
                    color: dark
                      ? `color-mix(in oklab, ${acc} 80%, white)`
                      : acc,
                    background: `color-mix(in oklab, ${acc} ${Math.round((dark ? 12 : 9) + 10 * chipHot)}%, transparent)`,
                    opacity: ramp(frame, B.chip, 4),
                    transform: `scale(${mix(0.7, 1, chipIn)})`,
                    transformOrigin: "0% 50%",
                  }}
                >
                  {command}
                </div>
              </div>

              <div
                style={{
                  ...item(B.title),
                  display: "flex",
                  alignItems: "center",
                  gap: 10 * u,
                  marginTop: 22 * u,
                }}
              >
                <div
                  style={{
                    fontSize: 30 * u,
                    letterSpacing: "-0.025em",
                    lineHeight: 1.15,
                  }}
                >
                  {title}
                </div>
              </div>
              <div
                style={{
                  ...item(B.title + 3),
                  fontSize: 18 * u,
                  color: muted,
                  marginTop: 6 * u,
                  textWrap: "pretty",
                }}
              >
                {subtitle}
              </div>

              <div
                style={{
                  ...item(B.field),
                  fontSize: 16 * u,
                  color: muted,
                  marginTop: 22 * u,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  ...item(B.field + 2),
                  marginTop: 8 * u,
                  position: "relative",
                  height: (portrait ? 112 : 96) * u,
                  borderRadius: 10 * u,
                  border: `1px solid ${focus > 0 ? `color-mix(in oklab, ${acc} ${Math.round(focus * 60)}%, ${hair})` : hair}`,
                  boxShadow: `0 0 0 ${3 * u * focus}px color-mix(in oklab, ${acc} ${Math.round(focus * 16)}%, transparent)`,
                  background: dark ? "rgba(255,255,255,0.035)" : "#fbfcff",
                  padding: `${12 * u}px ${14 * u}px`,
                  fontSize: 18 * u,
                  lineHeight: 1.45,
                  color: typed > 0 ? cardInk : muted,
                }}
              >
                {typed > 0
                  ? instructions.slice(0, typed)
                  : "Describe how this skill should write"}
                <span
                  style={{
                    display: "inline-block",
                    width: 2 * u,
                    height: 20 * u,
                    marginLeft: 2 * u,
                    verticalAlign: "-0.18em",
                    background: acc,
                    opacity: caret ? 1 : 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    right: 12 * u,
                    bottom: 9 * u,
                    fontFamily: mono.fontFamily,
                    fontSize: 14 * u,
                    lineHeight: 1,
                    color: muted,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {`${typed} / ${limit}`}
                </div>
              </div>

              {portrait ? (
                <>
                  <div
                    style={{
                      ...item(B.chips - 4),
                      fontSize: 16 * u,
                      color: muted,
                      marginTop: 24 * u,
                    }}
                  >
                    Use it for
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8 * u,
                      marginTop: 10 * u,
                    }}
                  >
                    {uses.map((c, i) => {
                      const s = spring({
                        frame: frame - B.chips - i * 3,
                        fps,
                        config: CHIP,
                      });
                      return (
                        <div
                          key={c}
                          style={{
                            padding: `${7 * u}px ${12 * u}px`,
                            borderRadius: 99,
                            border: `1px solid ${hair}`,
                            background: dark
                              ? "rgba(255,255,255,0.04)"
                              : "#f6f7fb",
                            fontSize: 16 * u,
                            opacity: ramp(frame, B.chips + i * 3, 4),
                            transform: `scale(${mix(0.6, 1, s)})`,
                          }}
                        >
                          {c}
                        </div>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      ...item(B.preview),
                      fontSize: 16 * u,
                      color: muted,
                      marginTop: 24 * u,
                    }}
                  >
                    Preview
                  </div>
                  <div
                    style={{
                      ...item(B.preview + 3),
                      marginTop: 10 * u,
                      display: "flex",
                      gap: 12 * u,
                      padding: `${14 * u}px ${16 * u}px`,
                      borderRadius: 10 * u,
                      background: `color-mix(in oklab, ${acc} ${dark ? 9 : 7}%, transparent)`,
                      fontSize: 18 * u,
                      lineHeight: 1.45,
                    }}
                  >
                    <div
                      style={{
                        width: 3 * u,
                        borderRadius: 2 * u,
                        background: acc,
                        flexShrink: 0,
                      }}
                    />
                    {preview}
                  </div>
                </>
              ) : null}

              <div
                style={{
                  ...item(B.footer),
                  marginTop: "auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  fontSize: 17 * u,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: 10 * u }}
                >
                  <div
                    style={{
                      padding: `${8 * u}px ${12 * u}px`,
                      color: muted,
                    }}
                  >
                    Cancel
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6 * u,
                      padding: `${8 * u}px ${16 * u}px`,
                      borderRadius: 8 * u,
                      background: prim,
                      color: "#fff",
                      transform: `scale(${1 - 0.04 * press})`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 2px rgba(0,0,0,0.2)`,
                    }}
                  >
                    <div
                      style={{
                        width: savedOn ? 18 * u : 0,
                        overflow: "hidden",
                        transform: `scale(${savedIn})`,
                        display: "flex",
                      }}
                    >
                      <Icon d={CHECK} size={18 * u} color="#fff" width={2.2} />
                    </div>
                    {savedOn ? done : action}
                  </div>
                </div>
              </div>
            </div>

            <svg
              width={cw + lead + 40}
              height={ch + 40}
              viewBox={`-20 -20 ${cw + lead + 40} ${ch + 40}`}
              style={{
                position: "absolute",
                left: -20,
                top: -20,
                overflow: "visible",
                pointerEvents: "none",
              }}
              aria-hidden
            >
              <defs>
                <filter
                  id="rim-glow"
                  x="-20%"
                  y="-20%"
                  width="140%"
                  height="140%"
                >
                  <feGaussianBlur stdDeviation={5 * u} />
                </filter>
              </defs>
              <g opacity={visible > 0.5 ? 1 : 0}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={acc}
                  strokeWidth={7 * u}
                  strokeLinecap="round"
                  strokeDasharray={`${visible} ${total * 2}`}
                  strokeDashoffset={-tail}
                  filter="url(#rim-glow)"
                  opacity={mix(dark ? 0.5 : 0.3, 0, settle)}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={dark ? `color-mix(in oklab, ${acc} 70%, white)` : acc}
                  strokeWidth={mix(1.8, 1.1, settle)}
                  strokeLinecap="round"
                  strokeDasharray={`${visible} ${total * 2}`}
                  strokeDashoffset={-tail}
                  opacity={mix(1, 0, settle)}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke={dark ? "#ffffff" : acc}
                  strokeWidth={3 * u}
                  strokeLinecap="round"
                  strokeDasharray={`${hotLen} ${total * 2}`}
                  strokeDashoffset={-(head - hotLen)}
                  filter="url(#rim-glow)"
                  opacity={1 - drawn}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeDasharray={`${hotLen * 0.5} ${total * 2}`}
                  strokeDashoffset={-(head - hotLen * 0.5)}
                  opacity={(1 - drawn) * (dark ? 1 : 0.9)}
                />
              </g>
            </svg>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default RimDrawCard;
