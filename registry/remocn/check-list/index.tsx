"use client";
import { Handwrite } from "@/components/remocn/handwrite";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { DEFAULT_STEP, hashRange, steppedRamp } from "@/lib/remocn/stop-motion";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type CheckListBeat,
  type CheckListElementId,
  type CheckListEntry,
  type CheckListItem,
  type CheckListTiming,
  checkListEntries,
  checkListPlan,
  checkListTimeline,
  DEFAULT_PER_STEP,
  enterEndOf,
} from "./timeline";

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

export type { CheckListBeat, CheckListEntry, CheckListItem, CheckListTiming };

export type CheckListGeometry = {
  boxSize: number;
  boxGap: number;
  rowHeight: number;
  labelWidth: number;
};

export const normalizeCheckListItems = checkListEntries;

export function checkListGeometry(
  width: number,
  fontSize: number,
): CheckListGeometry {
  const boxSize = Math.round(fontSize * 0.62);
  const boxGap = Math.round(fontSize * 0.4);
  return {
    boxSize,
    boxGap,
    rowHeight: Math.round(fontSize * 1.15),
    labelWidth: Math.max(fontSize * 2, width - boxSize - boxGap),
  };
}

export function checkListRowWidth(width: number, fontSize: number): number {
  const { boxSize, boxGap, labelWidth } = checkListGeometry(width, fontSize);
  return boxSize + boxGap + labelWidth;
}

export const checkListEnterEnd = enterEndOf;

export const checkListSchedule = checkListPlan;

export function checkListDuration(
  items: (string | CheckListItem)[],
  options?: CheckListTiming,
): number {
  return checkListSchedule(items, options).reduce(
    (end, beat) => Math.max(end, beat.strikeTo ?? beat.labelEnd),
    0,
  );
}

const boxPath = (size: number, seed: string, index: number): string => {
  const nudge = (n: number) => hashRange(`${seed}:${index}:c${n}`, -1.5, 1.5);
  const lo = size * 0.08;
  const hi = size - lo;
  const corners: [number, number][] = [
    [lo + nudge(0), lo + nudge(1)],
    [hi + nudge(2), lo + nudge(3)],
    [hi + nudge(4), hi + nudge(5)],
    [lo + nudge(6), hi + nudge(7)],
  ];
  const [start, ...rest] = corners;
  return `M ${start[0]} ${start[1]} ${rest
    .map(([x, y]) => `L ${x} ${y}`)
    .join(" ")} Z`;
};

const tickPath = (size: number): string =>
  `M ${size * 0.2} ${size * 0.52} L ${size * 0.42} ${size * 0.78} L ${size * 0.88} ${size * 0.14}`;

const CAVEAT_ADVANCE = 0.36;

export function checkListStrikeWidth(
  text: string,
  fontSize: number,
  labelWidth: number,
): number {
  return Math.min(
    labelWidth,
    Array.from(text).length * fontSize * CAVEAT_ADVANCE,
  );
}

const strikePath = (
  reach: number,
  fontSize: number,
  rowHeight: number,
  seed: string,
  index: number,
): string => {
  const lift = (n: number) => hashRange(`${seed}:${index}:s${n}`, -1.6, 1.6);
  const overshoot = fontSize * 0.07;
  const mid = rowHeight / 2;
  return `M ${-overshoot} ${mid + lift(0)} C ${reach * 0.35} ${mid + lift(1)}, ${reach * 0.7} ${mid + lift(2)}, ${reach + overshoot} ${mid + lift(3)}`;
};

export interface CheckListProps {
  items: (string | CheckListItem)[];
  width: number;
  fontSize?: number;
  color?: string;
  boxColor?: string;
  tickColor?: string;
  delay?: number;
  itemGap?: number;
  closeGap?: number;
  rowGap?: number;
  strokeWidth?: number;
  perStep?: number;
  weight?: 400 | 500 | 600 | 700;
  seed?: string;
  step?: number;
  /**
   * Moves, trims or stretches single rows and checks, by the ids in
   * `./timeline`. Frames on the scene timeline; the first row starts at
   * `delay`.
   */
  timing?: Timing<CheckListElementId>;
}

export function CheckList(props: CheckListProps) {
  const {
    items,
    width,
    fontSize = 40,
    color = "#26242c",
    boxColor = "#26242c",
    tickColor = "#6f7f35",
    rowGap,
    strokeWidth = 3,
    perStep = DEFAULT_PER_STEP,
    weight = 600,
    seed = "checklist",
    step = DEFAULT_STEP,
    timing,
  } = props;
  const frame = useSceneFrame();
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(checkListTimeline, props, durationInFrames, timing);
  const entries = normalizeCheckListItems(items);
  const { boxSize, boxGap, rowHeight, labelWidth } = checkListGeometry(
    width,
    fontSize,
  );

  return (
    <div
      style={{
        width: checkListRowWidth(width, fontSize),
        display: "flex",
        flexDirection: "column",
        gap: rowGap ?? fontSize * 0.55,
      }}
    >
      {entries.map((item, i) => {
        const row = tl.get(`item:${i}`);
        const boxTo = row.start + row.beat("box");
        const boxProgress = steppedRamp(frame, row.start, boxTo, {
          ease: easeOutCubic,
          step,
        });
        let tickProgress = 0;
        let strikeProgress = 0;
        if (item.checked) {
          const check = tl.get(`check:${i}`);
          const tickTo = check.start + check.beat("tick");
          tickProgress = steppedRamp(frame, check.start, tickTo, {
            ease: easeOutCubic,
            step,
          });
          strikeProgress = steppedRamp(
            frame,
            tickTo,
            tickTo + check.beat("strike"),
            { ease: easeOutCubic, step },
          );
        }

        return (
          <div
            key={`${item.text}:${i}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: boxGap,
              height: rowHeight,
            }}
          >
            <svg
              width={boxSize}
              height={boxSize}
              viewBox={`0 0 ${boxSize} ${boxSize}`}
              style={{ display: "block", overflow: "visible", flexShrink: 0 }}
            >
              <path
                d={boxPath(boxSize, seed, i)}
                stroke={boxColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - boxProgress}
                opacity={boxProgress > 0 ? 0.9 : 0}
              />
              {item.checked ? (
                <path
                  d={tickPath(boxSize)}
                  stroke={tickColor}
                  strokeWidth={strokeWidth + 1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - tickProgress}
                  opacity={tickProgress > 0 ? 1 : 0}
                />
              ) : null}
            </svg>
            <div
              style={{
                position: "relative",
                flexShrink: 0,
                width: labelWidth,
                height: rowHeight,
              }}
            >
              <Handwrite
                text={item.text}
                fontSize={fontSize}
                color={color}
                delay={boxTo}
                perStep={perStep}
                weight={weight}
                align="left"
                step={step}
              />
              {item.checked ? (
                <svg
                  width={labelWidth}
                  height={rowHeight}
                  viewBox={`0 0 ${labelWidth} ${rowHeight}`}
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "block",
                    overflow: "visible",
                  }}
                >
                  <path
                    d={strikePath(
                      checkListStrikeWidth(item.text, fontSize, labelWidth),
                      fontSize,
                      rowHeight,
                      seed,
                      i,
                    )}
                    stroke={tickColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    fill="none"
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - strikeProgress}
                    opacity={strikeProgress > 0 ? 0.85 : 0}
                  />
                </svg>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
