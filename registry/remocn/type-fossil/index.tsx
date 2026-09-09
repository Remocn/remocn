"use client";

import { useId } from "react";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

export interface TypeFossilProps {
  text?: string;
  /** Earlier versions, separated by | or newlines. Up to twelve drafts. */
  drafts?: string;
  layers?: number;
  /** Thickness of the typographic slice, in reference pixels. */
  depth?: number;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  accentColor?: string;
  backgroundColor?: string;
  speed?: number;
  className?: string;
}

export const typeFossilLength = 174;
export const typeFossilDefaultDrafts =
  "Idea | Maybe | Try | Almost | Again | Closer";
const finite = (n: number, fallback: number) =>
  Number.isFinite(n) ? n : fallback;
const clamp = (n: number) => Math.min(1, Math.max(0, n));
const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const progress = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ease = Easing.bezier(0.65, 0, 0.3, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);

export function parseFossilDrafts(drafts: string) {
  return drafts
    .split(/[|\n\r]+/)
    .map((value) => value.trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .slice(0, 12);
}

function timing(draftCount: number) {
  const count = Math.round(Math.max(0, Math.min(12, finite(draftCount, 6))));
  const collapseStart = count === 0 ? 16 : 20 + (count - 1) * 18 + 16;
  return { draftCount: count, collapseStart, settle: collapseStart + 48 };
}

export function getTypeFossilDuration({
  drafts = typeFossilDefaultDrafts,
  speed = 1,
}: Pick<TypeFossilProps, "drafts" | "speed"> = {}) {
  const rate = Math.max(0, finite(speed, 1));
  const { settle } = timing(parseFossilDrafts(drafts).length);
  return rate === 0 ? 1 : Math.max(1, Math.ceil((settle + 34) / rate));
}

/** One readable revision at a time, followed by a single compression into print. */
export function getTypeFossilState(
  frame: number,
  {
    layers = 16,
    depth = 100,
    draftCount = 6,
  }: Pick<TypeFossilProps, "layers" | "depth"> & { draftCount?: number } = {},
) {
  const t = Math.max(0, finite(frame, 0));
  const count = Math.round(Math.max(4, Math.min(24, finite(layers, 16))));
  const thickness = Math.max(50, Math.min(150, finite(depth, 100)));
  const schedule = timing(draftCount);
  const collapse = ease(progress(t, schedule.collapseStart, schedule.settle));
  const open = mix(0.55, 1, out(progress(t, 0, 16)));
  const spread = open * (1 - collapse);
  let from = 0;
  let to = 0;
  let change = 0;
  for (let revision = 0; revision < schedule.draftCount; revision++) {
    const start = 20 + revision * 18;
    if (t < start) break;
    if (t >= start + 8) {
      from = revision + 1;
      to = from;
      change = 0;
    } else {
      from = revision;
      to = revision + 1;
      change = ease(progress(t, start, start + 8));
      break;
    }
  }
  return {
    frame: t,
    count,
    thickness,
    from,
    to,
    change,
    draftCount: schedule.draftCount,
    settle: schedule.settle,
    collapse,
    spread,
    spanX: thickness * 1.35 * spread,
    spanY: -thickness * 0.68 * spread,
    skew: -10 * (1 - collapse),
    ghostOpacity: 1 - ease(progress(t, schedule.settle - 18, schedule.settle)),
  };
}

/** Bounded parallel contours, no perspective division or near-plane disappearance. */
export function getFossilLayerPose(
  state: ReturnType<typeof getTypeFossilState>,
  index: number,
) {
  const i = Math.round(
    Math.max(0, Math.min(state.count - 1, finite(index, 0))),
  );
  const fraction = i / (state.count - 1);
  return {
    x: 640 + state.spanX / 2 - state.spanX * fraction,
    y: 360 + state.spanY / 2 - state.spanY * fraction,
    opacity: i === 0 ? 1 : state.ghostOpacity,
    skew: state.skew,
    fraction,
  };
}

function fitSize(text: string, fontSize: number) {
  const widthUnits = Array.from(text).reduce(
    (sum, char) =>
      sum +
      (/\s/.test(char)
        ? 0.35
        : /[ilI.,'!:;]/.test(char)
          ? 0.4
          : /[MW@ЖШЩЮ]/.test(char)
            ? 1
            : 0.8),
    0,
  );
  return Math.min(fontSize, 720 / Math.max(1, widthUnits));
}

export function TypeFossil({
  text = "Form",
  drafts = typeFossilDefaultDrafts,
  layers = 16,
  depth = 100,
  fontSize = 220,
  fontWeight = 600,
  color = "#302b26",
  accentColor = "#a800b7",
  backgroundColor = "#eeeae2",
  speed = 1,
  className,
}: TypeFossilProps) {
  const id = useId().replace(/:/g, "");
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const finalText = text.trim().replace(/\s+/g, " ");
  const revisions = [...parseFossilDrafts(drafts), finalText];
  const state = getTypeFossilState(
    ((frame * 30) / fps) * Math.max(0, finite(speed, 1)),
    { layers, depth, draftCount: revisions.length - 1 },
  );
  const size = Math.max(24, Math.min(300, finite(fontSize, 220)));
  const weight = Math.max(100, Math.min(900, finite(Number(fontWeight), 600)));
  const wipeX = mix(-100, 1380, state.change);
  const renderSlice = (copy: string) => {
    const font = fitSize(copy, size);
    return Array.from({ length: state.count }, (_, order) => {
      const index = state.count - 1 - order;
      const pose = getFossilLayerPose(state, index);
      return (
        <text
          key={index}
          x="0"
          y={font * 0.35}
          textAnchor="middle"
          fontSize={font}
          fontWeight={weight}
          transform={`translate(${pose.x} ${pose.y}) skewX(${pose.skew})`}
          fill={index === 0 ? color : "none"}
          stroke={index === 0 ? "none" : accentColor}
          strokeWidth={index === 0 ? 0 : 0.75}
          strokeOpacity={0.18 + (1 - pose.fraction) * 0.38}
          opacity={pose.opacity}
          paintOrder="stroke fill"
        >
          {copy}
        </text>
      );
    });
  };
  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        backgroundColor,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1280 720"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={finalText || "Empty type fossil"}
      >
        <defs>
          <clipPath id={`${id}-old`}>
            <rect
              x={wipeX}
              y="-100"
              width={1480 - (wipeX + 100)}
              height="920"
            />
          </clipPath>
          <clipPath id={`${id}-new`}>
            <rect x="-100" y="-100" width={wipeX + 100} height="920" />
          </clipPath>
        </defs>
        {finalText ? (
          state.from === state.to ? (
            renderSlice(revisions[state.from])
          ) : (
            <>
              <g clipPath={`url(#${id}-old)`}>
                {renderSlice(revisions[state.from])}
              </g>
              <g clipPath={`url(#${id}-new)`}>
                {renderSlice(revisions[state.to])}
              </g>
            </>
          )
        ) : null}
      </svg>
    </div>
  );
}
