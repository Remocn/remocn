"use client";

import { loadFont as loadFigtree } from "@remotion/google-fonts/Figtree";
import type React from "react";
import type { CSSProperties } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  interpolateColors,
  spring,
} from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const figtree = loadFigtree("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const LIGHT = Easing.bezier(0.22, 1, 0.36, 1);
const EXIT = Easing.bezier(0.55, 0, 1, 0.45);
const SWAY = Easing.bezier(0.45, 0, 0.55, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const TILE = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const GLIDE = { mass: 0.8, damping: 22, stiffness: 150 };

const B = {
  pop: -8,
  unfurl: [6, 10, 14],
  disc: 18,
  hops: [42, 62, 78],
  retract: 94,
  punch: 106,
  caption: 100,
  end: 150,
};

export const TOOLBAR_UNFURL_DURATION = B.end;

const CLAMP = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], { ...CLAMP, easing });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const ICONS = {
  select:
    "M9 3.75H7.75a4 4 0 0 0-4 4V9M3.75 13.25v1M14.5 3.75h1.75a4 4 0 0 1 4 4V9M9 20.25H7.75a4 4 0 0 1-4-4V15M12 11.5l7.5 2.9-3.3 1.2-1.3 3.4z",
  text: "M5.5 6.5V4.75h13V6.5M12 4.75v14.5M9.25 19.25h5.5",
  draw: "M15.25 4.75l4 4L8.5 19.5H4.5v-4zM13 7l4 4",
  comment:
    "M5.25 5h13.5a1.75 1.75 0 0 1 1.75 1.75v8.5A1.75 1.75 0 0 1 18.75 17H12l-4.25 3.25V17h-2.5A1.75 1.75 0 0 1 3.5 15.25v-8.5A1.75 1.75 0 0 1 5.25 5z",
};

type ToolId = keyof typeof ICONS;
const ORDER: ToolId[] = ["select", "text", "draw", "comment"];

function ToolIcon({
  id,
  size,
  color,
}: {
  id: ToolId;
  size: number;
  color: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ display: "block" }}
      aria-hidden
    >
      <path
        d={ICONS[id]}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface ToolbarUnfurlProps {
  theme?: "dark" | "light";
  accent?: string;
  lines?: string[];
  finalLine?: string;
  /** Weight of the captions. */
  fontWeight?: number;
  /** Show the cursor that clicks through the tools. */
  cursor?: boolean;
  /** Text color of the captions; overrides the theme. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the captions. Load it yourself; Figtree by default. */
  fontFamily?: string;
  /** Size of the foreground around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  speed?: number;
  ground?: GshPresetId;
  groundParams?: Partial<GradientParams>;
}

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

export function ToolbarUnfurl({
  theme = "dark",
  accent = "#3B5BFD",
  lines = [
    "Leave a note.",
    "Sketch the shot.",
    "Type on the frame.",
    "Select any layer.",
  ],
  finalLine = "Every tool, one tap away.",
  fontWeight = 300,
  cursor = true,
  ink,
  background,
  fontFamily = figtree.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  ground,
  groundParams,
}: ToolbarUnfurlProps) {
  const glide = useGlide();
  const frame = Math.max(0, useSceneFrame() - delay) * speed;
  const { width, height, fps } = useSceneConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const sc = width / stageW;

  const fg = ink ?? (dark ? "#f2f3f7" : "#13151b");
  const iconIdle = dark ? "rgba(236,238,245,0.82)" : "rgba(20,22,30,0.78)";
  const pillBg = dark ? "rgba(22,23,28,0.84)" : "rgba(255,255,255,0.9)";
  const pillShadow = dark
    ? "0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 32px rgba(0,0,0,0.45)"
    : "0 0 0 1px rgba(16,18,30,0.06), 0 1px 2px rgba(16,20,40,0.06), 0 14px 36px rgba(16,20,40,0.12)";

  const slot = portrait ? 176 : 96;
  const pad = portrait ? 16 : 9;
  const thick = slot + pad * 2;
  const disc = slot - (portrait ? 12 : 6);
  const outerR = portrait ? 56 : 30;
  const discR = outerR - pad - (slot - disc) / 2;
  const iconSize = portrait ? 64 : 34;
  const capSize = portrait ? 108 : 66;
  const N = ORDER.length;
  const last = N - 1;

  const centerX = stageW / 2;
  const centerY = portrait ? 1150 : 278;
  const captionTop = portrait ? 686 : centerY + 118;
  const caretW = portrait ? 92 : 50;

  const pop = spring({ frame: frame - B.pop, fps, config: CHIP });
  const unfurl = ORDER.slice(0, last).map((_, i) =>
    spring({ frame: frame - B.unfurl[i], fps, config: TILE }),
  );
  const retract = Math.min(
    1,
    spring({ frame: frame - B.retract, fps, config: HEAVY }),
  );

  const spanOut = Math.max(
    0,
    ...ORDER.slice(0, last).map((_, i) => (last - i) * slot * unfurl[i]),
  );
  const span = spanOut * (1 - retract);
  const pillLen = slot + pad * 2 + span;
  const extra = caretW * Math.max(0, retract);
  const caretIn = ramp(frame, B.retract + 8, 12, LIGHT);

  const pos = (i: number) => {
    const retracted = i * slot * (1 - retract);
    if (retract > 0) return -span / 2 + retracted;
    const off = i < last ? -(last - i) * slot * unfurl[i] : 0;
    return span / 2 + off;
  };

  const discK = B.hops.reduce(
    (acc, h) => acc + spring({ frame: frame - h, fps, config: CHIP }),
    0,
  );
  const discKPrev = B.hops.reduce(
    (acc, h) => acc + spring({ frame: frame - 1 - h, fps, config: CHIP }),
    0,
  );
  const discSlot = last - discK;
  const vel = Math.abs(discK - discKPrev);
  const discIn = spring({ frame: frame - B.disc, fps, config: CHIP });
  const discPos =
    retract > 0
      ? pos(0)
      : interpolate(
          discSlot,
          ORDER.map((_, i) => i),
          ORDER.map((_, i) => pos(i)),
          { extrapolateLeft: "extend", extrapolateRight: "extend" },
        );
  const stretch = 1 + Math.min(0.22, vel * 0.6);
  const squash = 1 - Math.min(0.1, vel * 0.3);
  const punch = spring({ frame: frame - B.punch, fps, config: CHIP });
  const punchS =
    frame >= B.punch ? 1 + 0.05 * Math.sin(Math.min(1, punch) * Math.PI) : 1;

  const toolPresence = (i: number) => {
    const anchor = retract > 0 ? 0 : last;
    if (i === anchor) return 1;
    return interpolate(
      Math.abs(pos(i) - pos(anchor)),
      [slot * 0.2, slot * 0.85],
      [0, 1],
      CLAMP,
    );
  };

  const along = (v: number) => `translate(${v}px, 0px)`;

  const lineStarts = [B.disc, ...B.hops];
  const capItems = lines.slice(0, N).map((text, i) => {
    const start = lineStarts[i];
    const nextStart = i < N - 1 ? lineStarts[i + 1] : B.retract;
    const enter = ramp(frame, start + (i === 0 ? 0 : 3), 12);
    const exit = ramp(frame, nextStart, 7, EXIT);
    return { text, enter, exit, key: `l${i.toString()}` };
  });
  const finalEnter = ramp(frame, B.caption, 14);

  const groupAt = (f: number) => {
    const lift = Math.min(
      1,
      spring({ frame: f - B.retract - 2, fps, config: HEAVY }),
    );
    return {
      lift,
      push: 1 + 0.04 * ramp(f, 0, B.end, SWAY),
      y: mix(0, portrait ? 0 : 24, lift),
    };
  };
  const { lift, push, y: groupY } = groupAt(frame);
  // The push scales about the toolbar; the caption sits a few hundred px off
  // that origin, so weigh the scale step by that distance.
  const groupMoving = [frame - speed, frame + speed].some((f) => {
    const g = groupAt(f);
    return (
      Math.abs(g.push - push) * stageH * 0.5 > 1e-3 ||
      Math.abs(g.y - groupY) > 1e-3
    );
  });
  const fold = 1 + 0.16 * lift;

  const cursorPts = [
    { f: -4, x: centerX + 260, y: centerY + 260 },
    { f: B.disc - 4, x: 0, y: 0, tool: last },
    { f: B.disc + 2, x: 0, y: 0, tool: last },
    ...B.hops.flatMap((h, i) => [
      { f: h - 5, x: 0, y: 0, tool: last - 1 - i },
      { f: h + 2, x: 0, y: 0, tool: last - 1 - i },
    ]),
    { f: B.retract + 14, x: centerX + 220, y: centerY + 230 },
  ];
  const resolvePt = (p: (typeof cursorPts)[number]) => {
    if (p.tool === undefined) return { x: p.x, y: p.y };
    const o = pos(p.tool);
    return { x: centerX + o + slot * 0.12, y: centerY + slot * 0.12 };
  };
  let cx = cursorPts[0].x;
  let cy = cursorPts[0].y;
  for (let i = 0; i < cursorPts.length - 1; i++) {
    const a = cursorPts[i];
    const b = cursorPts[i + 1];
    if (frame >= a.f) {
      const t = spring({
        frame: frame - a.f,
        fps,
        config: GLIDE,
        durationInFrames: Math.max(4, b.f - a.f),
      });
      const pa = resolvePt(a);
      const pb = resolvePt(b);
      const dx = pb.x - pa.x;
      const dy = pb.y - pa.y;
      const bow = Math.sin(Math.PI * Math.min(1, t)) * 0.16;
      cx = mix(pa.x, pb.x, t) - dy * bow;
      cy = mix(pa.y, pb.y, t) + dx * bow;
    }
  }
  // The cursor is laid out where it comes to rest and travels by transform:
  // layout rounds a box to whole pixels, so `left`/`top` clicked it along.
  const restPt = resolvePt(cursorPts[cursorPts.length - 1]);
  const cursorDx = cx - restPt.x;
  const cursorDy = cy - restPt.y;
  const cursorTravel =
    Math.abs(cursorDx) < 1e-3 && Math.abs(cursorDy) < 1e-3
      ? ""
      : `translate(${cursorDx}px, ${cursorDy}px) `;
  const clicks = [B.disc, ...B.hops];
  const pressAt = (c: number) =>
    Math.max(
      0,
      spring({ frame: frame - c + 2, fps, config: CHIP }) -
        spring({ frame: frame - c - 2, fps, config: CHIP }),
    );
  const press = clicks.reduce((acc, c) => Math.max(acc, pressAt(c)), 0);
  const cursorFade = 1 - ramp(frame, B.retract + 4, 10, EXIT);

  const resolvedGround: GshPresetId | undefined =
    ground ?? (groundParams ? undefined : dark ? "afterhours" : "glasswork");

  const pillStyle: CSSProperties = {
    left: centerX - pillLen / 2,
    top: centerY - thick / 2,
    width: pillLen + extra,
    height: thick,
  };

  const discColor = accent;

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {background === undefined ? (
        <>
          <GshGround
            preset={resolvedGround}
            params={groundParams}
            timeOffset={dark ? 9 : 5}
            timeScale={0.45}
            style={
              portrait
                ? { transform: "scaleY(1.55)", transformOrigin: "50% 0%" }
                : undefined
            }
          />
          <AbsoluteFill
            style={{
              background: dark
                ? "linear-gradient(180deg, rgba(8,9,12,0.62) 0%, rgba(8,9,12,0.42) 55%, rgba(8,9,12,0.3) 100%)"
                : "linear-gradient(180deg, rgba(248,248,250,0.5) 0%, rgba(248,248,250,0.15) 70%, rgba(248,248,250,0) 100%)",
            }}
          />
        </>
      ) : (
        <AbsoluteFill
          style={{
            background: background === "transparent" ? undefined : background,
          }}
        />
      )}
      <ScaleLayer scale={scale}>
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
              transform: `scale(${push}) translateY(${groupY}px)${glide(groupMoving)}`,
              transformOrigin: `50% ${(centerY / stageH) * 100}%`,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `translateX(${-extra / 2}px) scale(${fold})`,
                transformOrigin: `${centerX}px ${centerY}px`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  ...pillStyle,
                  borderRadius: outerR,
                  background: pillBg,
                  boxShadow: pillShadow,
                  backdropFilter: "blur(24px)",
                  transform: `scale(${mix(0.55, 1, pop) * punchS})`,
                  opacity: ramp(frame, B.pop, 6, LIGHT),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: centerX - disc / 2,
                  top: centerY - disc / 2,
                  width: disc,
                  height: disc,
                  borderRadius: discR,
                  background: discColor,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.22), 0 1px 2px rgba(0,0,0,${dark ? 0.35 : 0.14})`,
                  transform: `${along(discPos)} scale(${stretch * discIn * punchS}, ${squash * discIn * punchS})`,
                  opacity: Math.min(1, discIn * 1.4),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: stageW,
                  height: stageH,
                  clipPath: `inset(0 ${stageW - centerX - pillLen / 2 + 2}px 0 ${centerX - pillLen / 2 + 2}px round ${outerR}px)`,
                }}
              >
                {ORDER.map((id, i) => {
                  const near = Math.max(
                    0,
                    1 -
                      Math.abs((retract > 0 ? 0 : discSlot) - i) *
                        (retract > 0 ? 99 : 1.6),
                  );
                  const lit = (retract > 0 ? (i === 0 ? 1 : 0) : near) * discIn;
                  const c = interpolateColors(
                    lit,
                    [0, 1],
                    [iconIdle, "#ffffff"],
                  );
                  const hit =
                    last - i < clicks.length ? pressAt(clicks[last - i]) : 0;
                  return (
                    <div
                      key={id}
                      style={{
                        position: "absolute",
                        left: centerX - slot / 2,
                        top: centerY - slot / 2,
                        width: slot,
                        height: slot,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transform: `${along(pos(i))} scale(${mix(0.55, 1, pop) * (1 - 0.04 * hit)})`,
                        opacity: toolPresence(i),
                        zIndex: i === last ? 2 : 1,
                      }}
                    >
                      <ToolIcon id={id} size={iconSize} color={c} />
                    </div>
                  );
                })}
              </div>
              {caretIn > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    // Pinned to the closed pill's edge; the last of the
                    // retract rides in as a transform, not as `left`.
                    left: centerX + (pillLen - span) / 2 - pad,
                    top: centerY - slot / 2,
                    width: caretW,
                    height: slot,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: caretIn,
                    transform: `${span / 2 < 1e-3 ? "" : `translateX(${span / 2}px) `}translateY(${mix(-6, 0, caretIn)}px) scale(${punchS})`,
                  }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width={iconSize * 0.72}
                    height={iconSize * 0.72}
                    style={{ display: "block" }}
                    aria-hidden
                  >
                    <path
                      d="M7 10l5 5 5-5"
                      fill="none"
                      stroke={iconIdle}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : null}
            </div>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: captionTop,
                height: capSize * (portrait ? 2.5 : 1.3),
                textAlign: "center",
                fontSize: capSize,
                fontWeight,
                letterSpacing: "-0.035em",
                lineHeight: 1.15,
                textWrap: "balance",
                color: fg,
              }}
            >
              {capItems.map((c) =>
                c.enter > 0 && c.exit < 1 ? (
                  <div
                    key={c.key}
                    style={{
                      position: "absolute",
                      inset: 0,
                      overflow: "hidden",
                      padding: portrait ? "0 80px 0.12em" : "0 0 0.12em",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: portrait ? "flex-end" : "flex-start",
                    }}
                  >
                    <div
                      style={{
                        transform: `translateY(${mix(105, 0, c.enter) - 110 * c.exit}%)`,
                        filter:
                          c.enter < 1 || c.exit > 0
                            ? `blur(${(1 - c.enter) * 6 + c.exit * 6}px)`
                            : undefined,
                        opacity: 1 - c.exit,
                      }}
                    >
                      {c.text}
                    </div>
                  </div>
                ) : null,
              )}
              {finalEnter > 0 ? (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    overflow: "hidden",
                    padding: portrait ? "0 80px 0.12em" : "0 0 0.12em",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: portrait ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      transform: `translateY(${mix(100, 0, finalEnter)}%)`,
                      filter:
                        finalEnter < 1
                          ? `blur(${(1 - finalEnter) * 6}px)`
                          : undefined,
                    }}
                  >
                    {finalLine}
                  </div>
                </div>
              ) : null}
            </div>
            {cursor ? (
              <div
                style={{
                  position: "absolute",
                  left: restPt.x - 6,
                  top: restPt.y - 4,
                  opacity: cursorFade * ramp(frame, -4, 6, LIGHT),
                  transform: `${cursorTravel}scale(${1 - 0.04 * press})`,
                  transformOrigin: "20% 15%",
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  width={portrait ? 56 : 30}
                  height={portrait ? 56 : 30}
                  style={{
                    display: "block",
                    filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.35))",
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
              </div>
            ) : null}
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}

export default ToolbarUnfurl;
