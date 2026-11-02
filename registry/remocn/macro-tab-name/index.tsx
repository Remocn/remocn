"use client";

import { loadFont as loadInterTight } from "@remotion/google-fonts/InterTight";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const inter = loadInterTight("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const FOCUS = Easing.bezier(0.22, 1, 0.36, 1);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const GROW = { mass: 0.5, damping: 13, stiffness: 240 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const GLIDE = { mass: 0.8, damping: 22, stiffness: 150 };

const B = {
  focus: 0,
  type: 10,
  step: 3,
  space: 6,
  clicks: [1, 6],
  park: 12,
  morph: 60,
  resolve: 86,
  end: 108,
};

export const MACRO_TAB_NAME_DURATION = B.end;

const MEASURE_PX = 100;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

interface Metrics {
  width: (s: string) => number;
}

function buildMetrics(_version: number): Metrics {
  const ctx = document.createElement("canvas").getContext("2d");
  const font = `400 ${MEASURE_PX}px "${inter.fontFamily}"`;
  const cache: Record<string, number> = {};
  return {
    width: (s: string) => {
      if (cache[s] === undefined) {
        if (!ctx) return s.length * 0.52;
        ctx.font = font;
        cache[s] = ctx.measureText(s).width / MEASURE_PX;
      }
      return cache[s];
    },
  };
}

function useMetrics() {
  const [version, setVersion] = useState(0);
  const [handle] = useState(() => delayRender("macro-tab-name: measuring"));
  const released = useRef(false);
  useEffect(() => {
    let live = true;
    const bump = () => {
      if (live) setVersion((v) => v + 1);
    };
    document.fonts.addEventListener("loadingdone", bump);
    Promise.all([
      inter.waitUntilDone(),
      document.fonts.load(`400 ${MEASURE_PX}px "${inter.fontFamily}"`),
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
  return useMemo(() => buildMetrics(version), [version]);
}

function FileIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ display: "block" }}
      aria-hidden
    >
      <g
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 2.8h7.6L18.5 7.7v13.5H6z" />
        <path d="M13.3 2.8v5.2h5.2" />
      </g>
    </svg>
  );
}

function Cursor({ size }: { size: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{
        display: "block",
        filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))",
      }}
      aria-hidden
    >
      <path
        d="M5 3.2v15.6l4.3-4.1 2.7 6.1 2.6-1.1-2.7-6h6z"
        fill="#0d0f10"
        stroke="#fff"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface MacroTabNameProps {
  theme?: "dark" | "light";
  accent?: string;
  name?: string;
  neighbors?: string[];
  path?: string[];
  docMeta?: string;
  docBody?: string[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function MacroTabName({
  theme = "dark",
  accent = "#3B5BFD",
  name = "Launch Assets",
  neighbors = ["Changelog", "Pricing"],
  path = ["Marketing", "Launch week"],
  docMeta = "Edited 2 min ago · 14 files",
  docBody = [
    "Hero cut, 0:42 — 1080p and 4K masters",
    "Pricing table screenshots, light and dark",
    "Waitlist email header, 600 × 200",
    "Social cutdowns: 1:1, 4:5, 9:16",
  ],
  ground,
  groundParams,
}: MacroTabNameProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const m = useMetrics();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;

  const ink = dark ? "#f1f2f8" : "#15171d";
  const soft = dark ? "rgba(230,233,245,0.55)" : "rgba(21,23,29,0.5)";
  const xColor = dark ? "rgba(230,233,245,0.62)" : "rgba(21,23,29,0.5)";
  const chipBg = dark
    ? "linear-gradient(180deg, #2a2d3b 0%, #1f2230 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #fbfbfc 100%)";
  const chipShadow = dark
    ? "0 0 0 1px rgba(255,255,255,0.1), inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 10px rgba(0,0,0,0.35), 0 24px 48px rgba(0,0,12,0.45)"
    : "0 0 0 1px rgba(20,24,40,0.06), 0 2px 4px rgba(30,30,80,0.05), 0 14px 30px rgba(30,30,90,0.08), 0 40px 80px rgba(30,30,90,0.1)";
  const band = dark ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.45)";
  const bandLine = dark ? "rgba(255,255,255,0.07)" : "rgba(20,24,40,0.07)";

  const F = portrait ? 96 : 84;
  const chipH = F * 1.86;
  const padX = F * 0.46;
  const iconS = F * 0.86;
  const gap = F * 0.3;
  const xGap = F * 0.62;
  const xS = F * 0.44;
  const cx = stageW / 2;
  const cy = portrait ? stageH * 0.37 : stageH * 0.44;
  const bandTop = cy - chipH / 2 - F * 0.34;
  const bandBottom = cy + chipH / 2 + F * 0.34;
  const docW = portrait ? 880 : 1040;
  const docL = stageW / 2 - docW / 2;

  const chars = Array.from(name);
  const times: number[] = [];
  let t = B.type;
  for (let i = 0; i < chars.length; i++) {
    times.push(t);
    const jitter = Math.round((random(`mtn-${i}`) - 0.5) * 2);
    t += chars[i] === " " ? B.space : B.step + (i > 0 ? jitter : 0);
  }
  const typedEnd = t;
  const track = -0.018 * F;
  const prefix = chars.map(
    (_, i) => m.width(chars.slice(0, i).join("")) * F + i * track,
  );
  const full = m.width(name) * F + chars.length * track;
  const adv = chars.map((_, i) =>
    i === chars.length - 1 ? full - prefix[i] : prefix[i + 1] - prefix[i],
  );
  let textW = 0;
  for (let i = 0; i < chars.length; i++) {
    textW +=
      adv[i] * spring({ frame: frame - times[i] + 1, fps, config: GROW });
  }
  const typedCount = times.filter((ti) => frame >= ti).length;

  const caretW = Math.max(2, F * 0.04);
  const chipW = padX + iconS + gap + textW + caretW + xGap + xS + padX;
  const chipL = cx - chipW / 2;
  const textL = chipL + padX + iconS + gap;

  const focus = ramp(frame, B.focus, 16, FOCUS);
  const push =
    mix(1.14, 1, focus) * (1 + 0.04 * ramp(frame, 16, B.end - 16, SWAY));
  const blurAll = (1 - focus) * 7;

  const caretVis =
    frame < typedEnd + 4
      ? frame < B.type
        ? Math.floor(frame / 6) % 2 === 0
        : true
      : Math.floor((frame - typedEnd) / 6) % 2 === 0 && frame < B.morph - 2;

  const morphOut =
    ramp(frame, B.morph, 7, EXIT) * (1 - ramp(frame, B.resolve + 2, 8, FOCUS));
  const iconBack = spring({ frame: frame - B.resolve - 2, fps, config: CHIP });
  const ringIn = spring({ frame: frame - B.morph - 3, fps, config: CHIP });
  const ringOut = ramp(frame, B.resolve, 6, EXIT);
  const ringSweep = interpolate(
    frame,
    [B.morph + 3, B.resolve - 4],
    [0.18, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.65, 0, 0.35, 1),
    },
  );
  const ringSpin = (frame - B.morph) * 9;
  const iconScale =
    frame < B.resolve + 2 ? 1 - 0.45 * morphOut : mix(0.55, 1, iconBack);

  const lead = neighbors.slice(-2);
  const neighborW = lead.map(
    (s) => F * (0.86 + 0.3) + m.width(s) * F + padX * 2,
  );
  const nbGap = F * 0.22;
  let nx = chipL - nbGap;
  const neighborX = neighborW
    .slice()
    .reverse()
    .map((w) => {
      nx -= w;
      const x = nx;
      nx -= nbGap;
      return x;
    })
    .reverse();
  const plusX = chipL + chipW + F * 0.5;
  const titleK = ramp(frame, B.resolve + 4, 12, FOCUS);
  const docLines = portrait ? docBody : docBody.slice(0, 1);

  const curFrom = { x: cx + chipW * 0.62, y: cy + chipH * 1.9 };
  const curHit = { x: cx - F * 0.12, y: cy + F * 0.08 };
  const curRest = { x: cx + chipW * 0.36, y: cy + chipH * 0.78 };
  const arrive = spring({
    frame: frame + 12,
    fps,
    config: GLIDE,
    durationInFrames: 13,
  });
  const park = spring({ frame: frame - B.park, fps, config: GLIDE });
  const bow = (t: number, a: number, b: number) =>
    Math.sin(Math.PI * Math.min(1, Math.max(0, t))) * (b - a) * 0.18;
  const curX =
    frame < B.park
      ? mix(curFrom.x, curHit.x, arrive) + bow(arrive, curFrom.y, curHit.y)
      : mix(curHit.x, curRest.x, park);
  const curY =
    frame < B.park
      ? mix(curFrom.y, curHit.y, arrive) - bow(arrive, curFrom.x, curHit.x)
      : mix(curHit.y, curRest.y, park);
  const curPress = B.clicks.reduce(
    (acc, c) =>
      Math.max(
        acc,
        spring({ frame: frame - c + 2, fps, config: CHIP }) -
          spring({ frame: frame - c - 1, fps, config: CHIP }),
      ),
    0,
  );
  const curIn = ramp(frame, -12, 8);

  const resolvedGround: GshPresetId | undefined =
    ground ?? (dark ? undefined : "paper-crease");
  const resolvedParams: Partial<GradientParams> | undefined =
    groundParams ??
    (dark && !ground
      ? {
          kind: "mist",
          colors: ["#dbe3ff", "#6d84ff", "#2738b0", "#090d2e"],
          background: "#03040c",
          speed: 0.8,
          loopSeconds: 16,
          scale: 0.9,
          warp: 0.4,
          blur: 0.75,
          grain: 0.1,
          seed: 11,
        }
      : undefined);

  return (
    <AbsoluteFill style={{ fontFamily: inter.fontFamily, overflow: "hidden" }}>
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={4}
        timeScale={0.4}
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
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${push})`,
            transformOrigin: `${cx}px ${cy}px`,
            filter: blurAll > 0.05 ? `blur(${blurAll}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -40,
              right: -40,
              top: bandTop,
              height: bandBottom - bandTop,
              background: band,
              borderTop: `1px solid ${bandLine}`,
              borderBottom: `1px solid ${bandLine}`,
              filter: "blur(1.5px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: docL,
              top: bandTop - F * 1.45,
              height: F * 0.9,
              display: "flex",
              alignItems: "center",
              gap: F * 0.28,
              fontSize: F * 0.5,
              color: soft,
              whiteSpace: "nowrap",
              filter: "blur(5px)",
              opacity: 0.6,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={F * 0.5}
              height={F * 0.5}
              style={{ display: "block" }}
              aria-hidden
            >
              <path
                d="M14.5 6l-6 6 6 6"
                fill="none"
                stroke={soft}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              viewBox="0 0 24 24"
              width={F * 0.5}
              height={F * 0.5}
              style={{ display: "block", opacity: 0.5 }}
              aria-hidden
            >
              <path
                d="M9.5 6l6 6-6 6"
                fill="none"
                stroke={soft}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ marginLeft: F * 0.2 }}>
              {[...path, titleK > 0.5 ? name : "Untitled"].join("  /  ")}
            </span>
          </div>
          <div
            style={{
              position: "absolute",
              left: docL,
              top: bandBottom + F * 0.8,
              width: docW,
              color: ink,
              whiteSpace: "nowrap",
            }}
          >
            <div
              style={{
                position: "relative",
                height: F * 1.3,
                fontSize: F * 1.05,
                letterSpacing: "-0.02em",
                filter: "blur(2.5px)",
                opacity: 0.62,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 1 - titleK,
                  color: soft,
                }}
              >
                Untitled
              </div>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: titleK,
                  transform: `translateY(${(1 - titleK) * F * 0.18}px)`,
                }}
              >
                {name}
              </div>
            </div>
            <div
              style={{
                marginTop: F * 0.22,
                fontSize: F * 0.46,
                color: soft,
                filter: "blur(3.5px)",
                opacity: 0.7,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {docMeta}
            </div>
            {docLines.map((line, i) => (
              <div
                key={line}
                style={{
                  marginTop: i === 0 ? F * 0.7 : F * 0.36,
                  fontSize: F * 0.56,
                  color: soft,
                  filter: `blur(${4.5 + i * 1.2}px)`,
                  opacity: 0.6 - i * 0.08,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {line}
              </div>
            ))}
          </div>
          {lead.map((label, i) => (
            <div
              key={label}
              style={{
                position: "absolute",
                left: neighborX[i],
                top: cy - chipH / 2,
                width: neighborW[i],
                height: chipH,
                padding: `0 ${padX}px`,
                display: "flex",
                alignItems: "center",
                gap: F * 0.3,
                fontSize: F,
                color: soft,
                whiteSpace: "nowrap",
                filter: `blur(${i === lead.length - 1 ? 3.5 : 6}px)`,
                opacity: i === lead.length - 1 ? 0.75 : 0.5,
              }}
            >
              <FileIcon size={F * 0.86} color={soft} />
              <span>{label}</span>
            </div>
          ))}
          <div
            style={{
              position: "absolute",
              left: plusX,
              top: cy - F * 0.4,
              width: F * 0.8,
              height: F * 0.8,
              filter: "blur(3.5px)",
              opacity: 0.7,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={F * 0.8}
              height={F * 0.8}
              aria-hidden
            >
              <path
                d="M12 5v14M5 12h14"
                stroke={soft}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div
            style={{
              position: "absolute",
              left: chipL,
              top: cy - chipH / 2,
              width: chipW,
              height: chipH,
              borderRadius: F * 0.4,
              background: chipBg,
              boxShadow: chipShadow,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: chipL + padX,
              top: cy - iconS / 2,
              width: iconS,
              height: iconS,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 1 - morphOut,
                transform: `scale(${iconScale})`,
              }}
            >
              <FileIcon size={iconS} color={ink} />
            </div>
            {frame >= B.morph ? (
              <svg
                viewBox="0 0 24 24"
                width={iconS}
                height={iconS}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: Math.min(1, ringIn) * (1 - ringOut),
                  transform: `scale(${Math.max(0, ringIn) * (1 - 0.3 * ringOut)}) rotate(${ringSpin}deg)`,
                }}
                aria-hidden
              >
                <circle
                  cx={12}
                  cy={12}
                  r={8}
                  fill="none"
                  stroke={soft}
                  strokeOpacity={0.35}
                  strokeWidth={1.5}
                />
                <circle
                  cx={12}
                  cy={12}
                  r={8}
                  fill="none"
                  stroke={accent}
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeDasharray={`${ringSweep * 50.3} 60`}
                  transform="rotate(-90 12 12)"
                />
              </svg>
            ) : null}
          </div>
          <div
            style={{
              position: "absolute",
              left: textL,
              top: cy - chipH / 2,
              width: textW + caretW + F * 0.04,
              height: chipH,
            }}
          >
            {chars.map((ch, i) => {
              if (frame < times[i] || ch === " ") return null;
              const k = ramp(frame, times[i], 4, FOCUS);
              return (
                <span
                  key={`c${i.toString()}`}
                  style={{
                    position: "absolute",
                    left: prefix[i],
                    top: 0,
                    height: chipH,
                    lineHeight: `${chipH}px`,
                    fontSize: F,
                    letterSpacing: 0,
                    color: ink,
                    whiteSpace: "pre",
                    opacity: k,
                    filter: k < 0.99 ? `blur(${(1 - k) * 5}px)` : undefined,
                    transform: `translateY(${(1 - k) * F * 0.14}px)`,
                  }}
                >
                  {ch}
                </span>
              );
            })}
            <div
              style={{
                position: "absolute",
                left:
                  (typedCount > 0
                    ? prefix[typedCount - 1] + adv[typedCount - 1]
                    : 0) +
                  F * 0.02,
                top: chipH / 2 - F * 0.42,
                width: caretW,
                height: F * 0.84,
                borderRadius: caretW,
                background: accent,
                opacity: caretVis ? 1 : 0,
              }}
            />
          </div>
          <svg
            viewBox="0 0 24 24"
            width={xS}
            height={xS}
            style={{
              position: "absolute",
              left: chipL + chipW - padX - xS,
              top: cy - xS / 2,
            }}
            aria-hidden
          >
            <path
              d="M5 5l14 14M19 5L5 19"
              stroke={xColor}
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          </svg>

          <div
            style={{
              position: "absolute",
              left: curX,
              top: curY,
              opacity: curIn,
              transform: `scale(${1 - 0.04 * curPress})`,
              transformOrigin: "20% 15%",
            }}
          >
            <Cursor size={F * 0.72} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default MacroTabName;
