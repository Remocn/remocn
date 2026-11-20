"use client";

import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";
import { loadFont as loadOnest } from "@remotion/google-fonts/Onest";
import type React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useGlide } from "@/lib/remocn/glide";
import type { GradientParams } from "@/lib/remocn/gsh/gradient-engine";
import { GshGround } from "@/lib/remocn/gsh/gsh-ground";
import type { GshPresetId } from "@/lib/remocn/gsh/presets";

const onest = loadOnest("normal", {
  weights: ["300", "400"],
  subsets: ["latin"],
});
const mono = loadGeistMono("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const ENTER = Easing.bezier(0.32, 0.72, 0, 1);
const MOVE = Easing.bezier(0.65, 0, 0.35, 1);
const CAM = Easing.bezier(0.87, 0, 0.13, 1);
const HEAVY = { mass: 1, damping: 26, stiffness: 120 };
const CARD = { mass: 0.8, damping: 18, stiffness: 160 };
const CHIP = { mass: 0.5, damping: 12, stiffness: 200 };
const MORPH = { damping: 200 };

const B = {
  enter: -8,
  rows: 0,
  title: 6,
  zoom: 24,
  cursor: 42,
  click: 66,
  open: 70,
  type: 78,
  commit: 120,
  flood: 122,
  label: 130,
  pull: 132,
  end: 168,
};

const ramp = (f: number, start: number, dur: number, easing = ENTER) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const midway = (p: number) => p > 5e-4 && p < 1 - 5e-4;

function Chevron({ dir, color }: { dir: "l" | "r"; color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      aria-hidden
      style={{ display: "block" }}
    >
      <path
        d={dir === "l" ? "m14.5 6-6 6 6 6" : "m9.5 6 6 6-6 6"}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Pointer({ size, dark }: { size: number; dark: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{
        display: "block",
        filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.3))",
      }}
      aria-hidden
    >
      <path
        d="M5 3.2v16.2l4.3-4.1 2.8 6.3 2.6-1.1-2.8-6.2h6z"
        fill={dark ? "#ffffff" : "#16110d"}
        stroke={dark ? "#16110d" : "#ffffff"}
        strokeWidth={1.3}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export interface CalendarPickProps {
  theme?: "dark" | "light";
  accent?: string;
  title?: string;
  month?: string;
  year?: string;
  firstWeekday?: number;
  daysInMonth?: number;
  today?: number;
  pickDay?: number;
  timeRange?: string;
  eventLabel?: string;
  busyDays?: number[];
  /** Label of the button in the calendar header. */
  todayLabel?: string;
  /** Placeholder in the opened day before the time is typed. */
  placeholder?: string;
  /** Text color of the title, month and day numbers; overrides the theme. */
  ink?: string;
  /** Solid fill in place of the gradient ground; "transparent" drops it. */
  background?: string;
  /** Typeface for the copy. Load it yourself; Onest by default. */
  fontFamily?: string;
  /** Size of the calendar, around the frame's center. */
  scale?: number;
  /** Frames to hold the first frame before anything moves. */
  delay?: number;
  /** Playback multiplier. */
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

export function CalendarPick({
  theme = "dark",
  accent = "#F26A2E",
  title = "Launch day, booked.",
  month = "June",
  year = "2026",
  firstWeekday = 0,
  daysInMonth = 30,
  today = 9,
  pickDay = 18,
  timeRange = "10:00 AM – 4:00 PM",
  eventLabel = "Launch",
  busyDays = [3, 11, 12, 22, 25, 29],
  todayLabel = "Today",
  placeholder = "Add time",
  ink: textColor,
  background,
  fontFamily = onest.fontFamily,
  scale = 1,
  delay = 0,
  speed = 1,
  ground,
  groundParams,
}: CalendarPickProps) {
  const glide = useGlide();
  const frame = Math.max(0, useCurrentFrame() - delay) * speed;
  const { width, height, fps } = useVideoConfig();
  const dark = theme === "dark";
  const portrait = height > width * 1.2;
  const stageW = portrait ? 1080 : 1280;
  const stageH = portrait ? 1920 : 720;
  const s = width / stageW;

  const ink = textColor ?? (dark ? "#f6f1ec" : "#1b1612");
  const soft = dark ? "rgba(246,241,236,0.7)" : "rgba(27,22,18,0.66)";
  const muted = dark ? "rgba(246,241,236,0.4)" : "rgba(27,22,18,0.38)";
  const hair = dark ? "rgba(255,255,255,0.08)" : "rgba(40,24,10,0.08)";
  const tile = dark ? "rgba(255,255,255,0.045)" : "rgba(60,36,16,0.04)";

  const W = 760;
  const padX = 30;
  const headH = 92;
  const weekH = 34;
  const colW = (W - padX * 2) / 7;
  const rowH = 84;
  const lead = ((firstWeekday % 7) + 7) % 7;
  const rows = Math.ceil((lead + daysInMonth) / 7);
  const H = headH + weekH + rows * rowH + 26;
  const gridTop = headH + weekH;
  const cellOf = (d: number) => {
    const i = lead + d - 1;
    return { col: i % 7, row: Math.floor(i / 7) };
  };
  const pick = cellOf(Math.max(1, Math.min(daysInMonth, pickDay)));
  const cellX = padX + pick.col * colW;
  const cellY = gridTop + pick.row * rowH;
  const inset = 5;

  // The camera at any frame, so a frame can tell whether it moves by comparing
  // with its neighbours.
  const camAt = (f: number) => {
    const enter = spring({ frame: f - B.enter, fps, config: CARD });
    const zoom = ramp(f, B.zoom, 36, CAM);
    const pullBack = spring({ frame: f - B.pull, fps, config: HEAVY });
    const Z =
      mix(mix(1, zMax, zoom), zRest, pullBack) *
      (1 + 0.025 * ramp(f, B.pull + 20, B.end - B.pull - 20, Easing.linear)) *
      (portrait ? 1.25 : 1);
    const focusX = mix(W / 2, cellX + colW * (0.5 + spanCols / 2), zoom);
    const focusY = mix(H / 2, cellY + rowH / 2, zoom);
    const fX = mix(
      focusX,
      mix(W / 2, cellX + colW / 2, portrait ? 0.05 : 0.7),
      pullBack,
    );
    const fY = mix(focusY, mix(H / 2, cellY + rowH / 2, 0.7), pullBack);
    return {
      Z,
      fX,
      fY,
      cardX: screenX - fX * Z - cardLeft,
      cardY: screenY - fY * Z + mix(160, 0, enter) - cardTop,
      rotX: mix(22, 0, enter) + mix(0, 7, zoom) * (1 - pullBack) + 3 * pullBack,
      rotZ: mix(-5, 0, enter) + mix(0, -1.5, zoom) * (1 - pullBack),
      rotY: mix(0, -8, zoom) * (1 - pullBack) - 4 * pullBack,
    };
  };
  const enterBlur = mix(10, 0, ramp(frame, B.enter, 15));
  const zMax = portrait ? 1.9 : 1.75;
  const zRest = portrait ? 1.06 : 1.5;
  const spanCols = Math.min(3, 6 - pick.col);
  const screenX = stageW / 2;
  const screenY = portrait ? 1180 : 372;
  // Where the card sits while the camera holds on the picked day, its longest
  // rest. Layout rounds a box to whole pixels, so a card steered by `left` and
  // `top` clicks along under the camera; it is laid out here and the camera
  // move is a transform.
  const zHold = zMax * (portrait ? 1.25 : 1);
  const cardLeft =
    screenX - mix(W / 2, cellX + colW * (0.5 + spanCols / 2), 1) * zHold;
  const cardTop = screenY - mix(H / 2, cellY + rowH / 2, 1) * zHold;
  const cam = camAt(frame);
  const { Z, fX, fY, cardX, cardY, rotX, rotY, rotZ } = cam;
  // The text sits up to about a card width from the focus, so a step in the
  // camera's scale or angle is weighed by that distance. Steps far under a
  // pixel still add up to one across a slow start, so any step counts.
  const camMoving = [frame - speed, frame + speed].some((f) => {
    const o = camAt(f);
    const reach = W * Z;
    return (
      Math.abs(o.cardX - cardX) > 1e-6 ||
      Math.abs(o.cardY - cardY) > 1e-6 ||
      Math.abs(o.Z - Z) * W > 1e-6 ||
      (Math.abs(o.rotX - rotX) +
        Math.abs(o.rotY - rotY) +
        Math.abs(o.rotZ - rotZ)) *
        (Math.PI / 180) *
        reach >
        1e-6
    );
  });

  // Text under the camera rests in a 3D turn, where the grid it would snap to
  // is gone, so it is marked only while something moves it; a mark at rest
  // would lean it there and redraw a frame the untouched code draws level.
  const underCamera = (moving: boolean) => (moving ? glide(true) : "");

  const cStart = { x: W + 120, y: H + 80 };
  const cEnd = { x: cellX + colW * 0.56, y: cellY + rowH * 0.5 };
  const cP = ramp(frame, B.cursor, 24, MOVE);
  const cPrev = ramp(frame - 1, B.cursor, 24, MOVE);
  const exitP = ramp(frame, B.commit, 18, MOVE);
  const cursorAt = (p: number, e: number) => ({
    x: mix(cStart.x, cEnd.x, p) + 46 * e,
    y: mix(cStart.y, cEnd.y, p) - Math.sin(Math.PI * p) * 46 + 52 * e,
  });
  const cNow = cursorAt(cP, exitP);
  // The pointer is laid out on the day it clicks and flies there by transform,
  // for the same reason as the card below.
  const cHold = cursorAt(1, 0);
  const cBlur = Math.min(3, Math.abs(cP - cPrev) * 900 * 0.03);
  const clickDip = spring({ frame: frame - B.click, fps, config: CHIP });
  const clickUp = spring({ frame: frame - B.click - 4, fps, config: CHIP });
  const press = 1 - 0.12 * clickDip + 0.12 * clickUp;
  const ripple = ramp(frame, B.click, 18, ENTER);

  const openP = spring({ frame: frame - B.open, fps, config: CARD });
  const closeP = spring({ frame: frame - B.commit, fps, config: MORPH });
  const inputW = mix(
    colW - inset * 2,
    colW * (spanCols + 1) - inset * 2,
    openP * (1 - closeP),
  );
  const inputOn = frame >= B.open && closeP < 0.98;
  const chars = Math.max(
    0,
    Math.min(timeRange.length, Math.floor((frame - B.type) / 2)),
  );
  const typed = timeRange.slice(0, chars);
  const caretOn =
    Math.floor(frame / 8) % 2 === 0 ||
    (frame >= B.type && chars < timeRange.length);
  const flood = spring({ frame: frame - B.flood, fps, config: CHIP });
  const labelIn = ramp(frame, B.label, 12);
  const titleIn = ramp(frame, B.title, 15);

  const surface = dark
    ? "linear-gradient(180deg, rgba(34,27,23,0.94) 0%, rgba(22,18,16,0.96) 100%)"
    : "linear-gradient(180deg, #ffffff 0%, #fdfbf9 100%)";
  const shadow = dark
    ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 2px 6px rgba(0,0,0,0.3), 0 30px 60px rgba(20,6,0,0.45), 0 80px 140px rgba(20,6,0,0.5)"
    : "inset 0 1px 0 #fff, 0 1px 2px rgba(80,40,10,0.06), 0 22px 50px rgba(120,60,20,0.1), 0 70px 130px rgba(160,80,30,0.16)";

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  const days: React.ReactNode[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const { col, row } = cellOf(d);
    const isPick = d === pickDay;
    const isToday = d === today;
    const weekend = col >= 5;
    const busy = busyDays.includes(d);
    const appear = ramp(frame, B.rows + row * 2 + col * 0.5, 12);
    const cellFlood = isPick ? flood : 0;
    const scale = isPick
      ? press * (1 + 0.06 * Math.sin(Math.PI * Math.min(1, cellFlood)))
      : 1;
    days.push(
      <div
        key={d}
        style={{
          position: "absolute",
          left: padX + col * colW + inset,
          top: gridTop + row * rowH + inset,
          width: colW - inset * 2,
          height: rowH - inset * 2,
          borderRadius: 14,
          background: weekend ? "transparent" : tile,
          opacity: appear,
          transform: `translateY(${mix(10, 0, appear)}px) scale(${scale})${underCamera(midway(appear))}`,
        }}
      >
        {isPick ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              background: `linear-gradient(180deg, color-mix(in oklab, ${accent} 86%, white) 0%, ${accent} 100%)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.35), 0 10px 24px color-mix(in oklab, ${accent} 40%, transparent)`,
              opacity: Math.min(1, cellFlood),
              transform: `scale(${mix(0.4, 1, Math.min(1, cellFlood))})`,
            }}
          />
        ) : null}
        {isToday ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 14,
              boxShadow: `inset 0 0 0 1.5px color-mix(in oklab, ${accent} 70%, transparent)`,
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            left: 12,
            top: 9,
            fontSize: 24,
            letterSpacing: "-0.02em",
            fontWeight: 400,
            color:
              cellFlood > 0.5
                ? "#ffffff"
                : weekend
                  ? muted
                  : isToday
                    ? accent
                    : ink,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {d}
        </div>
        {busy ? (
          <div
            style={{
              position: "absolute",
              left: 13,
              bottom: 12,
              display: "flex",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 16,
                height: 4,
                borderRadius: 2,
                background: `color-mix(in oklab, ${accent} 55%, transparent)`,
              }}
            />
            {d % 2 ? (
              <span
                style={{
                  width: 8,
                  height: 4,
                  borderRadius: 2,
                  background: muted,
                }}
              />
            ) : null}
          </div>
        ) : null}
        {isPick ? (
          <div
            style={{
              position: "absolute",
              left: 12,
              right: 8,
              bottom: 9,
              fontSize: 13,
              lineHeight: "16px",
              color: "#ffffff",
              opacity: labelIn,
              transform: `translateY(${mix(8, 0, labelIn)}px)`,
              whiteSpace: "nowrap",
            }}
          >
            {eventLabel}
            <div
              style={{
                fontFamily: mono.fontFamily,
                fontSize: 11,
                opacity: 0.85,
              }}
            >
              {timeRange.split(" ")[0]}
            </div>
          </div>
        ) : null}
      </div>,
    );
  }

  const resolvedGround: GshPresetId =
    ground ?? (dark ? "hearth" : "paper-crease");
  const resolvedParams =
    groundParams ??
    (dark
      ? undefined
      : {
          kind: "mist",
          colors: ["#ff9a5a", "#ffc79c", "#fbe9da", "#e0622a"],
          background: "#f7f3ee",
        });

  return (
    <AbsoluteFill style={{ fontFamily, overflow: "hidden" }}>
      {background === undefined ? (
        <GshGround
          preset={resolvedGround}
          params={resolvedParams}
          timeOffset={5}
          timeScale={0.6}
        />
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
            transform: `scale(${s})`,
            transformOrigin: "0 0",
            perspective: 2200,
          }}
        >
          {portrait ? (
            <div
              style={{
                position: "absolute",
                left: 90,
                right: 90,
                top: 260,
                overflow: "hidden",
                paddingBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 104,
                  lineHeight: 1.0,
                  letterSpacing: "-0.045em",
                  fontWeight: 300,
                  color: ink,
                  transform: `translateY(${mix(110, 0, titleIn)}%)${glide(midway(titleIn))}`,
                }}
              >
                {title}
              </div>
            </div>
          ) : null}
          <div
            style={{
              position: "absolute",
              left: cardLeft,
              top: cardTop,
              width: W,
              height: H,
              transformOrigin: "0 0",
              transform: `translate(${cardX}px, ${cardY}px) scale(${Z})`,
              opacity: ramp(frame, -6, 8),
              filter: enterBlur > 0.3 ? `blur(${enterBlur}px)` : undefined,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transformStyle: "preserve-3d",
                transformOrigin: `${fX}px ${fY}px`,
                transform: `rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)${underCamera(camMoving)}`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 28,
                  background: surface,
                  boxShadow: shadow,
                  border: `1px solid ${hair}`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: padX + 4,
                    top: 30,
                    fontSize: 34,
                    letterSpacing: "-0.03em",
                    fontWeight: 300,
                    color: ink,
                  }}
                >
                  {month}
                  <span style={{ color: muted, marginLeft: 10 }}>{year}</span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    right: padX,
                    top: 32,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      height: 36,
                      padding: "0 14px",
                      borderRadius: 10,
                      border: `1px solid ${hair}`,
                      display: "flex",
                      alignItems: "center",
                      fontSize: 15,
                      color: soft,
                    }}
                  >
                    {todayLabel}
                  </div>
                  {(["l", "r"] as const).map((dir) => (
                    <div
                      key={dir}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        border: `1px solid ${hair}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Chevron dir={dir} color={soft} />
                    </div>
                  ))}
                </div>
                {weekdays.map((wd, i) => (
                  <div
                    key={wd}
                    style={{
                      position: "absolute",
                      left: padX + i * colW + 17,
                      top: headH,
                      height: weekH,
                      fontFamily: mono.fontFamily,
                      fontSize: 13,
                      letterSpacing: "0.06em",
                      color: i >= 5 ? muted : soft,
                    }}
                  >
                    {wd}
                  </div>
                ))}
                {days}
                <div
                  style={{
                    position: "absolute",
                    left: cellX + colW * 0.56 - 30,
                    top: cellY + rowH * 0.5 - 30,
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    border: `1.5px solid ${accent}`,
                    opacity: frame >= B.click ? (1 - ripple) * 0.8 : 0,
                    transform: `scale(${mix(0.3, 1.4, ripple)})`,
                  }}
                />
                {inputOn ? (
                  <div
                    style={{
                      position: "absolute",
                      left: cellX + inset,
                      top: cellY + inset,
                      width: inputW,
                      height: rowH - inset * 2,
                      borderRadius: 14,
                      background: dark ? "#2a221d" : "#ffffff",
                      boxShadow: dark
                        ? `0 0 0 1.5px ${accent}, 0 0 0 5px color-mix(in oklab, ${accent} 22%, transparent), 0 14px 30px rgba(0,0,0,0.4)`
                        : `0 0 0 1.5px ${accent}, 0 0 0 5px color-mix(in oklab, ${accent} 16%, transparent), 0 14px 30px rgba(120,60,20,0.14)`,
                      overflow: "hidden",
                      opacity: Math.min(1, openP * 2),
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 12,
                        top: 9,
                        fontSize: 24,
                        letterSpacing: "-0.02em",
                        color: ink,
                      }}
                    >
                      {pickDay}
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        left: 58,
                        top: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        fontSize: 21,
                        color: ink,
                        whiteSpace: "pre",
                        opacity: ramp(frame, B.open + 4, 8),
                      }}
                    >
                      {chars === 0 ? (
                        <span style={{ color: muted }}>{placeholder}</span>
                      ) : (
                        typed
                      )}
                      <span
                        style={{
                          width: 2,
                          height: 24,
                          marginLeft: 2,
                          borderRadius: 1,
                          background: accent,
                          opacity: caretOn ? 1 : 0,
                        }}
                      />
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 0,
                        bottom: 0,
                        display: "flex",
                        alignItems: "center",
                        fontFamily: mono.fontFamily,
                        fontSize: 12,
                        color: muted,
                        opacity: ramp(frame, B.type + 30, 8),
                      }}
                    >
                      ↵
                    </div>
                  </div>
                ) : null}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: cHold.x,
                  top: cHold.y,
                  opacity:
                    ramp(frame, B.cursor, 4) *
                    (1 - ramp(frame, B.commit + 6, 9)),
                  transform: `translate(${cNow.x - cHold.x}px, ${cNow.y - cHold.y}px) scale(${press})`,
                  transformOrigin: "20% 15%",
                  filter: cBlur > 0.3 ? `blur(${cBlur}px)` : undefined,
                  display: frame >= B.cursor ? "block" : "none",
                }}
              >
                <Pointer size={26} dark={dark} />
              </div>
            </div>
          </div>
        </div>
      </ScaleLayer>
    </AbsoluteFill>
  );
}

export default CalendarPick;
