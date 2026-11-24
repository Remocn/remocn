"use client";

import type { ReactNode } from "react";
import { Easing } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { useGlide } from "@/lib/remocn/glide";
import {
  type ResolvedTimeline,
  resolve,
  type Timing,
  useTimeline,
} from "@/lib/remocn/timeline";
import { type CursorGravityElementId, cursorGravityTimeline } from "./timeline";

export interface CursorGravityProps {
  /** Custom content in a 300 × 88 reference-pixel slot. */
  children?: ReactNode;
  label?: string;
  /** Strength of the elastic neck and recoil, 0–1.5. */
  tension?: number;
  cursorColor?: string;
  color?: string;
  textColor?: string;
  backgroundColor?: string;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the cursor's entry, approach, each tug, the
   * release, the wobble, the let-go and the exit, by the ids in `./timeline`.
   * Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<CursorGravityElementId>;
}

export const cursorGravityLength = 151;
const DURATION = 180;
const finite = (value: number, fallback: number) =>
  Number.isFinite(value) ? value : fallback;
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const progress = (frame: number, start: number, end: number) =>
  clamp((frame - start) / (end - start));
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const pullEase = Easing.bezier(0.12, 0.8, 0.22, 1);
/** The schedule without `timing`, for poses read outside the component. */
const DEFAULT_TIMELINE = resolve(cursorGravityTimeline({}, { length: 0 }));
type GravityTimeline = ResolvedTimeline<CursorGravityElementId>;

/** Complete transition plus a one-second hold, in frames at 30 fps. */
export function getCursorGravityDuration({
  speed = 1,
}: Pick<CursorGravityProps, "speed"> = {}) {
  const rate = Math.max(0, finite(speed, 1));
  return rate === 0 ? 1 : Math.max(1, Math.ceil(DURATION / rate));
}

/** A pull advances sharply, pauses under load, then recoils before the next tug. */
function pullDistance(t: number, strength: number, tl: GravityTimeline) {
  const a = tl.get("tug:0");
  const b = tl.get("tug:1");
  const c = tl.get("tug:2");
  // A tug moved later holds the load of the one before until it starts.
  const keys = [
    [a.start, 0],
    [a.start + a.beat("grab"), 116],
    [a.start + a.beat("hold"), 116],
    [a.end, 116 - 30 * strength],
    ...(b.start !== a.end ? [[b.start, 116 - 30 * strength]] : []),
    [b.start + b.beat("grab"), 292],
    [b.start + b.beat("hold"), 292],
    [b.end, 292 - 42 * strength],
    ...(c.start !== b.end ? [[c.start, 292 - 42 * strength]] : []),
    [c.end, 772],
  ];
  if (t <= keys[0][0]) return 0;
  for (let i = 1; i < keys.length; i++) {
    const [start, a] = keys[i - 1];
    const [end, b] = keys[i];
    if (t <= end)
      return mix(a, b, (b > a ? pullEase : ease)(progress(t, start, end)));
  }
  return 772;
}

/** Pure, resolution-aware pose. The right edge is the real composition boundary. */
export function getCursorGravityState(
  frame: number,
  {
    width = 1280,
    height = 720,
    tension = 1,
    timeline: tl = DEFAULT_TIMELINE,
  }: {
    width?: number;
    height?: number;
    tension?: number;
    /** The resolved schedule; the one without `timing` by default. */
    timeline?: GravityTimeline;
  } = {},
) {
  const enter = tl.get("enter");
  const approachEl = tl.get("approach");
  const tug0 = tl.get("tug:0");
  const tug1 = tl.get("tug:1");
  const tug2 = tl.get("tug:2");
  const releaseEl = tl.get("release");
  const wobbleEl = tl.get("wobble");
  const letgo = tl.get("letgo");
  const leaveEl = tl.get("leave");
  const w = Math.max(1, finite(width, 1280));
  const h = Math.max(1, finite(height, 720));
  const unit = Math.min(w / 1280, h / 720);
  const t = Math.max(0, finite(frame, 0));
  const strength = Math.max(0, Math.min(1.5, finite(tension, 1)));
  const centerY = h * 0.5;
  const finalLeft = w / 2 - 150 * unit;
  const finalRight = w / 2 + 150 * unit;
  const edgeTip = w - 24 * unit;
  const distance = pullDistance(t, strength, tl) / 772;
  const extraction = distance * (edgeTip - (finalLeft - 14 * unit));
  // The back of the button resists the first two tugs beyond the frame edge.
  const releaseTime = progress(t, releaseEl.start, releaseEl.end);
  // Closed-form damped spring stays continuous at fractional frames too.
  const springRelease =
    1 -
    Math.exp(-7 * releaseTime) *
      (Math.cos(10 * releaseTime) + 0.7 * Math.sin(10 * releaseTime));
  const release = mix(
    springRelease,
    1,
    ease(
      progress(t, releaseEl.start + releaseEl.beat("settleAt"), releaseEl.end),
    ),
  );
  const front = mix(w + 12 * unit, finalLeft, distance);
  const right = mix(w + 312 * unit - distance * 70 * unit, finalRight, release);
  const buttonWidth = Math.max(220 * unit, right - front);
  const strain = clamp((buttonWidth / (300 * unit) - 1) / 1.3) * strength;
  const w0 = wobbleEl.start;
  const wobble =
    t < w0
      ? 0
      : Math.sin((t - w0) * 0.48) *
        Math.exp(-(t - w0) * 0.14) *
        5 *
        unit *
        strength *
        (1 - progress(t, w0 + wobbleEl.beat("fadeAt"), wobbleEl.end));
  const y = centerY + wobble;
  const entry = ease(progress(t, enter.start, enter.end));
  const approach = ease(progress(t, approachEl.start, approachEl.end));
  const leave = ease(progress(t, leaveEl.start, leaveEl.end));
  const entered = enter.end;
  const arrived = approachEl.end;
  const holdTip = mix(w * 0.28, edgeTip - 80 * unit, entry);
  const pullTip = edgeTip - extraction;
  const cursorX =
    t < arrived
      ? mix(holdTip, edgeTip, approach)
      : mix(pullTip, w * 0.25, leave);
  const cursorY =
    t < entered
      ? mix(h + 110 * unit, centerY + 70 * unit, entry)
      : t < arrived
        ? mix(centerY + 70 * unit, centerY, approach)
        : mix(centerY, h + 110 * unit, leave);
  // Triangle points toward the edge while pulling; turns toward its exit afterward.
  const cursorAngle = t < arrived ? mix(-32, 0, approach) : mix(0, 115, leave);
  const effortPulse = (
    start: number,
    peak: number,
    hold: number,
    end: number,
  ) => ease(progress(t, start, peak)) * (1 - ease(progress(t, hold, end)));
  const pulseOf = (e: typeof tug0) =>
    effortPulse(
      e.start,
      e.start + e.beat("peak"),
      e.start + e.beat("ease"),
      e.start + e.beat("relax"),
    );
  const cursorEffort =
    strength * (0.8 * pulseOf(tug0) + pulseOf(tug1) + 1.15 * pulseOf(tug2));
  return {
    frame: t,
    unit,
    front,
    right: front + buttonWidth,
    buttonWidth,
    centerY: y,
    strain,
    neckHeight: 88 * unit * (1 - 0.58 * strain),
    bodyHeight: 88 * unit * (1 - 0.17 * strain),
    cursorX,
    cursorY,
    cursorAngle,
    cursorEffort,
    attached: t >= tug0.start && t <= letgo.start + letgo.beat("detach"),
    tetherOpacity:
      progress(
        t,
        tug0.start + tug0.beat("tetherAt"),
        tug0.start + tug0.beat("tether"),
      ) *
      (1 - progress(t, letgo.start, letgo.end)),
  };
}

/** The tip stays fixed; the rear bows backward as each tug builds effort. */
export function getGravityCursorPath(effort: number) {
  const load = Math.max(0, Math.min(1.725, finite(effort, 0)));
  const shoulder = -62 - 30 * load;
  const rear = -70 - 40 * load;
  const halfHeight = 26 - 4 * load;
  return `M -5 -4 Q 3 0 -5 4
    C -24 ${11.333 - load * 3} ${shoulder + 19} ${halfHeight - 7.333} ${shoulder} ${halfHeight}
    Q ${rear} ${halfHeight + 4} ${rear} ${halfHeight - 6}
    C ${rear} 4 ${rear - 18 * load} 8 ${rear - 18 * load} 0
    C ${rear - 18 * load} -8 ${rear} -4 ${rear} ${-halfHeight + 6}
    Q ${rear} ${-halfHeight - 4} ${shoulder} ${-halfHeight}
    C ${shoulder + 19} ${-halfHeight + 7.333} -24 ${-11.333 + load * 3} -5 -4 Z`;
}

/** Rounded rectangle with a narrow leading edge: the pull deforms the surface. */
export function getGravityButtonPath(
  state: ReturnType<typeof getCursorGravityState>,
) {
  const { buttonWidth: w, neckHeight, bodyHeight, unit } = state;
  const a = neckHeight / 2;
  const b = bodyHeight / 2;
  const r = Math.min(25 * unit, a * 0.9);
  const backRadius = 25 * unit;
  return `M ${r} ${-a}
    C ${w * 0.35} ${-a} ${w * 0.35} ${-b} ${w - backRadius} ${-b}
    Q ${w} ${-b} ${w} ${-b + backRadius}
    L ${w} ${b - backRadius} Q ${w} ${b} ${w - backRadius} ${b}
    C ${w * 0.35} ${b} ${w * 0.35} ${a} ${r} ${a}
    Q 0 ${a} 0 ${a - r} L 0 ${-a + r} Q 0 ${-a} ${r} ${-a} Z`;
}

export function CursorGravity(props: CursorGravityProps) {
  const {
    children,
    label = "Create something",
    tension = 1,
    cursorColor = "#fffaf0",
    color = "#fffaf0",
    textColor = "#32153c",
    backgroundColor = "#a800b7",
    speed = 1,
    className,
    timing,
  } = props;
  const glide = useGlide();
  const frame = useSceneFrame();
  const { width, height, fps, durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    cursorGravityTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const step = (30 / fps) * Math.max(0, finite(speed, 1));
  const t = frame * step;
  // Content travels with the material, without stretching the lettering.
  const contentAt = (tt: number) => {
    const s = getCursorGravityState(tt, {
      width,
      height,
      tension,
      timeline: tl,
    });
    const cu = s.unit * Math.min(1, s.buttonWidth / (300 * s.unit));
    return { s, cu, x: s.front + s.buttonWidth - 150 * cu, y: s.centerY };
  };
  const now = contentAt(t);
  const state = now.s;
  const { unit } = state;
  const contentUnit = now.cu;
  const contentX = now.x;
  // The pull is a sum of eases and a decaying wobble with no single
  // progress, so the label counts as moving when either neighbour frame
  // differs.
  const differs = (tt: number) => {
    const o = contentAt(tt);
    return (
      Math.abs(o.x - now.x) > 1e-3 ||
      Math.abs(o.y - now.y) > 1e-3 ||
      Math.abs(o.cu - now.cu) * 300 > 1e-3
    );
  };
  const contentMoving = differs(t + step) || differs(t - step);
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0 }}
      >
        <path
          d={getGravityButtonPath(state)}
          transform={`translate(${state.front} ${state.centerY})`}
          fill={color}
        />
        <path
          d={`M ${state.cursorX + 2 * unit} ${state.cursorY} Q ${mix(state.cursorX, state.front, 0.5)} ${state.centerY} ${state.front + 2 * unit} ${state.centerY}`}
          fill="none"
          stroke={cursorColor}
          strokeWidth={2 * unit}
          strokeLinecap="round"
          opacity={state.tetherOpacity}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 300,
          height: 88,
          // One transform rather than `translate` and `scale`: the mark that
          // gets the label its lean is read from `transform` only.
          transform: `translate(${contentX - 150 * contentUnit}px, ${state.centerY - 44 * contentUnit}px) scale(${contentUnit})${glide(contentMoving)}`,
          transformOrigin: "top left",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          color: textColor,
          fontWeight: 600,
          fontSize: 23,
        }}
      >
        {children ?? (
          <>
            <span
              style={{
                maxWidth: 220,
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {label}
            </span>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M5 12H19M13 6L19 12L13 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </div>
      <svg
        width={190 * unit}
        height={70 * unit}
        viewBox="-180 -35 190 70"
        role="img"
        aria-label="Rounded triangular cursor"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          translate: `${state.cursorX - 180 * unit}px ${state.cursorY - 35 * unit}px`,
          transform: `rotate(${state.cursorAngle}deg)`,
          transformOrigin: `${180 * unit}px ${35 * unit}px`,
        }}
      >
        <path d={getGravityCursorPath(state.cursorEffort)} fill={cursorColor} />
      </svg>
    </div>
  );
}
