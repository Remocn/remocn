"use client";

import { loadFont as loadInstrument } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadJetBrains } from "@remotion/google-fonts/JetBrainsMono";
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

const instrument = loadInstrument("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const jetbrains = loadJetBrains("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const FILL = Easing.bezier(0.83, 0, 0.17, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const B = {
  zone: -8,
  title: -2,
  fly: 6,
  hover: 30,
  drop: 54,
  collapse: 60,
  info: 72,
  progress: 78,
  done: 114,
  end: 162,
};

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function FileTile({
  kind,
  accent,
  w,
}: {
  kind: string;
  accent: string;
  w: number;
}) {
  const h = w * 1.26;
  const fold = w * 0.27;
  return (
    <div style={{ position: "relative", width: w, height: h }}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
        aria-hidden
      >
        <defs>
          <linearGradient id="du-paper" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#eceef6" />
          </linearGradient>
        </defs>
        <path
          d={`M ${w * 0.1} 0 H ${w - fold} L ${w} ${fold} V ${h - w * 0.1} Q ${w} ${h} ${w * 0.9} ${h} H ${w * 0.1} Q 0 ${h} 0 ${h - w * 0.1} V ${w * 0.1} Q 0 0 ${w * 0.1} 0 Z`}
          fill="url(#du-paper)"
          stroke="rgba(20,24,48,0.1)"
        />
        <path
          d={`M ${w - fold} 0 V ${fold * 0.72} Q ${w - fold} ${fold} ${w - fold * 0.72} ${fold} H ${w} Z`}
          fill="#d7dbea"
        />
        {[0.3, 0.4, 0.5, 0.6].map((y, i) => (
          <rect
            key={y}
            x={w * 0.16}
            y={h * y}
            width={w * (i === 3 ? 0.36 : i === 0 ? 0.4 : 0.62)}
            height={w * 0.045}
            rx={w * 0.022}
            fill={i === 0 ? "#b9bfd6" : "#d9dce8"}
          />
        ))}
      </svg>
      <div
        style={{
          position: "absolute",
          left: w * 0.12,
          bottom: w * 0.12,
          height: w * 0.24,
          padding: `0 ${w * 0.08}px`,
          borderRadius: w * 0.06,
          background: accent,
          color: "#fff",
          fontFamily: jetbrains.fontFamily,
          fontSize: w * 0.15,
          display: "flex",
          alignItems: "center",
          letterSpacing: "0.04em",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
        }}
      >
        {kind}
      </div>
    </div>
  );
}

export interface DropUploadProps {
  theme?: "dark" | "light";
  accent?: string;
  title?: string;
  fileName?: string;
  fileKind?: string;
  fileSize?: string;
  hint?: string;
  history?: { name: string; kind: string; size: string; ago: string }[];
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

export function DropUpload({
  theme = "dark",
  accent = "#3B5BFD",
  title = "Drop in your launch notes",
  fileName = "launch-notes.md",
  fileKind = "MD",
  fileSize = "2.4 MB",
  hint = "MD, PDF or ZIP · up to 50 MB",
  history = [
    {
      name: "changelog-2.0.pdf",
      kind: "PDF",
      size: "1.1 MB",
      ago: "4 min ago",
    },
    { name: "press-kit.zip", kind: "ZIP", size: "18.6 MB", ago: "12 min ago" },
  ],
  ground,
  groundParams,
}: DropUploadProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 760 : 1280;
  const stageH = portrait ? 1351 : 720;
  const sc = width / stageW;

  const ink = dark ? "#f1f2fb" : "#151824";
  const soft = dark ? "rgba(225,228,250,0.7)" : "rgba(21,24,36,0.66)";
  const muted = dark ? "rgba(225,228,250,0.46)" : "rgba(21,24,36,0.44)";
  const dash = dark ? "rgba(225,228,250,0.34)" : "rgba(21,24,36,0.26)";
  const base = dark ? "#11141f" : "#ffffff";
  const rowShadow = (k: number) =>
    dark
      ? `0 0 0 1px rgba(255,255,255,${0.08 * k}), 0 40px 90px -24px rgba(0,2,14,${0.7 * k})`
      : `0 0 0 1px rgba(20,24,48,${0.07 * k}), 0 1px 3px rgba(20,24,48,${0.06 * k}), 0 36px 80px -24px rgba(20,30,70,${0.22 * k})`;
  const accentMix = (pct: number, base: string) =>
    `color-mix(in oklab, ${accent} ${pct}%, ${base})`;

  const zoneW = portrait ? 564 : 760;
  const zoneH = portrait ? 440 : 320;
  const rowW = portrait ? 564 : 760;
  const rowH = 104;
  const cx = stageW / 2;
  const cy = portrait ? 640 : 412;
  const titleSize = portrait ? 50 : 60;
  const titleGap = portrait ? 56 : 44;

  const zoneIn = spring({ frame: frame - B.zone, fps, config: HEAVY });
  const titleIn = ramp(frame, B.title, 15);
  const collapse = spring({ frame: frame - B.collapse, fps, config: MORPH });
  const highlight =
    ramp(frame, B.hover - 8, 12) * (1 - ramp(frame, B.collapse, 8, EXIT));
  const breathe =
    Math.sin(((frame - B.hover) / 22) * Math.PI * 2) * 0.012 * highlight;
  const dropHit = spring({ frame: frame - B.drop - 6, fps, config: CHIP });
  const dropPunch =
    0.03 *
    Math.sin(Math.PI * Math.min(1, dropHit)) *
    (1 - ramp(frame, B.drop + 14, 6));

  const solid = ramp(frame, B.collapse - 2, 14);
  const tint = accentMix(Math.round(12 * highlight), "transparent");
  const radius = mix(24, 20, collapse);
  const zW = mix(zoneW, rowW, collapse);
  const zH = mix(zoneH, rowH, collapse);
  const zL = cx - zW / 2;
  const zT = cy - zH / 2;

  const startX = portrait ? cx + 260 : cx + 560;
  const startY = portrait ? cy + 600 : cy + 360;
  const ctrlX = portrait ? cx + 300 : cx + 300;
  const ctrlY = portrait ? cy - 200 : cy - 300;
  const hoverX = cx + 30;
  const hoverY = cy - (portrait ? 84 : 66);
  const flyT = (f: number) =>
    spring({ frame: f - B.fly, fps, config: CARD, durationInFrames: 26 });
  const bez = (t: number, a: number, c: number, b: number) =>
    (1 - t) * (1 - t) * a + 2 * (1 - t) * t * c + t * t * b;
  const p = flyT(frame);
  const pPrev = flyT(frame - 1);
  let tx = bez(p, startX, ctrlX, hoverX);
  let ty = bez(p, startY, ctrlY, hoverY);
  const speed = Math.hypot(
    tx - bez(pPrev, startX, ctrlX, hoverX),
    ty - bez(pPrev, startY, ctrlY, hoverY),
  );
  const hoverAmt = ramp(frame, B.hover - 4, 10) * (1 - ramp(frame, B.drop, 8));
  tx += Math.sin((frame - B.hover) / 7) * 5 * hoverAmt;
  ty += Math.cos((frame - B.hover) / 9) * 5 * hoverAmt;
  let rot = mix(28, -7, p) + Math.sin((frame - B.hover) / 10) * 2.5 * hoverAmt;
  let lift = mix(1.2, 0.74, p);
  const drop = ramp(frame, B.drop, 8, EXIT);
  lift *= mix(1, 0.84, drop);
  ty += 16 * drop;
  rot = mix(rot, -3, drop);
  const tileW = 112;
  const iconW = 48;
  const iconX = cx - rowW / 2 + 26 + iconW / 2;
  const iconY = cy;
  const toRow = spring({ frame: frame - B.collapse - 2, fps, config: MORPH });
  tx = mix(tx, iconX, toRow);
  ty = mix(ty, iconY, toRow);
  rot = mix(rot, 0, toRow);
  const tileScale = mix(lift, iconW / tileW, toRow);
  const tileBlur = Math.min(6, speed * 0.1);
  const shadowAmt = (1 - drop * 0.7) * (1 - toRow);

  const zoneContent = 1 - ramp(frame, B.collapse - 2, 8, EXIT);
  const info = ramp(frame, B.info, 12);
  const prog = interpolate(frame, [B.progress, B.done - 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: FILL,
  });
  const done = spring({ frame: frame - B.done, fps, config: CHIP });
  const doneIn = ramp(frame, B.done, 6);
  const pct = Math.round(prog * 100);

  const camIn = spring({ frame: frame + 8, fps, config: HEAVY });
  const rowFocus = spring({ frame: frame - B.collapse, fps, config: HEAVY });
  const rotX = mix(18, 4, camIn) - 2.5 * rowFocus;
  const rotY = mix(14, 4, camIn) - 4 * rowFocus;
  const push =
    mix(0.9, 1, camIn) +
    0.025 * ramp(frame, 0, B.end, Easing.linear) +
    (portrait ? 0.06 : 0.26) * rowFocus;
  const titleTop0 = cy - zoneH / 2 - titleGap - titleSize * 1.05;
  const titleTop1 = cy - rowH / 2 - (portrait ? 44 : 34) - titleSize * 1.05;
  const titleTop = mix(titleTop0, titleTop1, rowFocus);
  const histH = 84;
  const histGap = 14;
  const shown = portrait ? history : [];
  const listBottom = cy + rowH / 2 + shown.length * (histH + histGap);
  const groupMid = (titleTop1 + listBottom) / 2;
  const camY = rowFocus * (groupMid - cy) * 0.9;

  const resolvedGround: GshPresetId =
    ground ?? (dark ? "earthshine" : "paper-crease");
  const resolvedParams =
    groundParams ??
    (dark
      ? undefined
      : {
          colors: ["#9db8e6", "#d4e1f4", "#eef2f8", "#2c4f9e"],
          background: "#f1f3f6",
        });

  return (
    <AbsoluteFill
      style={{ fontFamily: instrument.fontFamily, overflow: "hidden" }}
    >
      <GshGround
        preset={resolvedGround}
        params={resolvedParams}
        timeOffset={2}
        timeScale={0.5}
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
          perspective: 2000,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transformOrigin: `${cx}px ${cy}px`,
            transform: `translateY(${-camY * push}px) scale(${push}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 40,
              right: 40,
              top: titleTop,
              height: titleSize * 1.25,
              overflow: "hidden",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: titleSize,
                lineHeight: 1.15,
                letterSpacing: "-0.035em",
                fontWeight: 400,
                color: ink,
                transform: `translateY(${mix(105, 0, titleIn)}%)`,
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: zL,
              top: zT,
              width: zW,
              height: zH,
              borderRadius: radius,
              background: `linear-gradient(${tint}, ${tint}), color-mix(in oklab, ${base} ${Math.round(mix(dark ? 58 : 52, 100, solid))}%, transparent)`,
              boxShadow: rowShadow(solid),
              opacity: ramp(frame, -6, 8),
              transform: `translateY(${mix(60, 0, zoneIn)}px) scale(${mix(0.94, 1, zoneIn) * (1 + breathe + dropPunch)})`,
              overflow: "hidden",
            }}
          >
            <svg
              width={zW}
              height={zH}
              style={{ position: "absolute", inset: 0, opacity: zoneContent }}
              aria-hidden
            >
              <rect
                x={0.75}
                y={0.75}
                width={Math.max(0, zW - 1.5)}
                height={Math.max(0, zH - 1.5)}
                rx={radius - 0.75}
                fill="none"
                stroke={
                  highlight > 0.02
                    ? accentMix(Math.round(85 * highlight), dash)
                    : dash
                }
                strokeWidth={1.5}
                strokeDasharray="9 7"
                strokeDashoffset={-frame * 0.7 * (0.25 + highlight)}
              />
            </svg>
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                opacity: zoneContent,
                transform: `translateY(${36 * highlight}px) scale(${mix(0.94, 1, zoneContent)})`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${mix(1, 0.6, highlight)})`,
                  opacity: 1 - highlight,
                }}
              >
                <svg viewBox="0 0 24 24" width={34} height={34} aria-hidden>
                  <path
                    d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"
                    fill="none"
                    stroke={soft}
                    strokeWidth={1.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div
                style={{
                  position: "relative",
                  height: 28,
                  width: zW - 60,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    fontSize: 21,
                    color: ink,
                    letterSpacing: "-0.01em",
                    opacity: 1 - highlight,
                    transform: `translateY(${-8 * highlight}px)`,
                  }}
                >
                  Drag and drop a file, or{" "}
                  <span
                    style={{
                      color: dark ? accentMix(50, "#ffffff") : accent,
                      textDecoration: "underline",
                      textUnderlineOffset: 4,
                      textDecorationThickness: 1,
                    }}
                  >
                    browse
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    fontSize: 21,
                    color: dark ? "#ffffff" : accent,
                    opacity: highlight,
                    transform: `translateY(${8 * (1 - highlight)}px)`,
                  }}
                >
                  Release to upload
                </div>
              </div>
              <div
                style={{
                  fontFamily: jetbrains.fontFamily,
                  fontSize: 17,
                  color: muted,
                }}
              >
                {hint}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: 26 + iconW + 20,
                right: 26,
                top: 0,
                height: rowH,
                opacity: info,
                display: frame >= B.info ? "block" : "none",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 64,
                  top: 24,
                  display: "flex",
                  alignItems: "baseline",
                  gap: 12,
                  transform: `translateY(${mix(12, 0, info)}px)`,
                }}
              >
                <span
                  style={{ fontSize: 21, color: ink, letterSpacing: "-0.01em" }}
                >
                  {fileName}
                </span>
                <span
                  style={{
                    fontFamily: jetbrains.fontFamily,
                    fontSize: 17,
                    color: muted,
                  }}
                >
                  {fileSize}
                </span>
                <div style={{ flex: 1 }} />
                <span
                  style={{
                    position: "relative",
                    fontSize: 17,
                    color: soft,
                    width: 110,
                    textAlign: "right",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      right: 0,
                      opacity: 1 - doneIn,
                    }}
                  >
                    Uploading
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      right: 0,
                      color: dark ? accentMix(45, "#ffffff") : accent,
                      opacity: doneIn,
                      transform: `translateY(${mix(8, 0, doneIn)}px)`,
                    }}
                  >
                    Uploaded
                  </span>
                </span>
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 64,
                  top: 64,
                  height: 6,
                  borderRadius: 3,
                  background: dark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(20,24,48,0.07)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${prog * 100}%`,
                    height: "100%",
                    borderRadius: 3,
                    background: accent,
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: (rowH - 40) / 2,
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    fontFamily: jetbrains.fontFamily,
                    fontSize: 17,
                    color: muted,
                    opacity: 1 - doneIn,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {pct}%
                </span>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    background: accent,
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)",
                    transform: `scale(${done})`,
                    opacity: doneIn,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg viewBox="0 0 24 24" width={22} height={22} aria-hidden>
                    <path
                      d="m6 12.5 4 4 8-9"
                      fill="none"
                      stroke="#fff"
                      strokeWidth={2.2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={20}
                      strokeDashoffset={20 * (1 - ramp(frame, B.done + 2, 8))}
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {shown.map((h, i) => {
            const at = B.info + 2 + i * 5;
            const k = spring({ frame: frame - at, fps, config: CARD });
            return (
              <div
                key={h.name}
                style={{
                  position: "absolute",
                  left: cx - rowW / 2,
                  top: cy + rowH / 2 + histGap + i * (histH + histGap),
                  width: rowW,
                  height: histH,
                  borderRadius: 20,
                  background: base,
                  boxShadow: rowShadow(0.55),
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "0 26px 0 32px",
                  opacity: ramp(frame, at, 8),
                  transform: `translateY(${mix(28, 0, k)}px)`,
                }}
              >
                <FileTile kind={h.kind} accent={accent} w={38} />
                <span
                  style={{ fontSize: 21, color: ink, letterSpacing: "-0.01em" }}
                >
                  {h.name}
                </span>
                <span
                  style={{
                    fontFamily: jetbrains.fontFamily,
                    fontSize: 17,
                    color: muted,
                  }}
                >
                  {h.size}
                </span>
                <div style={{ flex: 1 }} />
                <span style={{ fontSize: 17, color: muted }}>{h.ago}</span>
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: tx - tileW / 2,
              top: ty - (tileW * 1.26) / 2,
              transform: `rotate(${rot}deg) scale(${tileScale})`,
              filter: [
                tileBlur > 0.3 ? `blur(${tileBlur}px)` : "",
                `drop-shadow(0 ${mix(4, 34, shadowAmt)}px ${mix(6, 36, shadowAmt)}px rgba(4,6,30,${dark ? 0.55 : 0.22}))`,
              ].join(" "),
              opacity: ramp(frame, B.fly, 4),
            }}
          >
            <FileTile kind={fileKind} accent={accent} w={tileW} />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export default DropUpload;
