"use client";

import { Easing, interpolate } from "remotion";
import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  type CaretSwapElementId,
  COLLAPSE_FRAMES,
  caretSwapTimeline,
  EXPAND_FRAMES,
  IDLE_FRAMES,
  SWAP_AT,
  TYPE_SPEED,
  typeElapsed,
} from "./timeline";

export interface CaretSwapProps {
  fromText: string;
  toText: string;
  fontSize?: number;
  color?: string;
  fontWeight?: number;
  caretColor?: string;
  caretColorEnd?: string;
  swapAt?: number;
  typeSpeed?: number;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the caret's phases and the typing, by the ids
   * in `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<CaretSwapElementId>;
}

const CARET_WIDTH_EM = 0.08;
const CARET_HEIGHT_EM = 1.1;
const CARET_GAP_EM = 0.06;
const CHAR_WIDTH_EM = 0.52;

export function caretSwapLength(
  toText: string,
  swapAt = SWAP_AT,
  typeSpeed = TYPE_SPEED,
): number {
  return Math.ceil(
    swapAt +
      EXPAND_FRAMES +
      COLLAPSE_FRAMES +
      IDLE_FRAMES +
      typeElapsed(Array.from(toText).length, typeSpeed),
  );
}

const expandEasing = Easing.bezier(0.6, 0, 0.8, 0.4);
const collapseEasing = Easing.bezier(0.2, 0.7, 0.3, 1);

export function CaretSwap(props: CaretSwapProps) {
  const {
    fromText,
    toText,
    fontSize = 72,
    color = "#171717",
    fontWeight = 400,
    caretColor = "#FF4DAA",
    caretColorEnd = "#8A5CF6",
    speed = 1,
    className,
    timing,
  } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    caretSwapTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const caret = tl.get("caret");
  const expandEl = tl.get("expand");
  const collapseEl = tl.get("collapse");
  const type = tl.get("type");
  const blink = tl.get("blink");

  const toChars = Array.from(toText);
  const caretWidth = CARET_WIDTH_EM * fontSize;
  const caretHeight = CARET_HEIGHT_EM * fontSize;

  const caretVisibleAt = caret.start;
  const swapAt = expandEl.start;
  const expandEnd = expandEl.end;
  const typeStart = type.start;

  const expand = interpolate(frame, [swapAt, expandEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: expandEasing,
  });
  const collapse = interpolate(
    frame,
    [collapseEl.start, collapseEl.end],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: collapseEasing,
    },
  );

  const typing = frame >= typeStart;
  let typedCount = 0;
  if (typing) {
    while (
      typedCount < toChars.length &&
      typeElapsed(typedCount, type.beat("pace")) <= frame - typeStart
    ) {
      typedCount++;
    }
  }
  const typed = toChars.slice(0, typedCount).join("");

  const anchorWidthEm =
    Array.from(fromText).length * CHAR_WIDTH_EM + CARET_WIDTH_EM + CARET_GAP_EM;
  const targetShiftEm = (anchorWidthEm - toChars.length * CHAR_WIDTH_EM) / 2;
  const typeProgress = toChars.length > 0 ? typedCount / toChars.length : 0;
  const typedShift = targetShiftEm * typeProgress * fontSize;

  const blinkPeriod = blink.beat("period");
  const blinkOff =
    frame >= blink.start + blinkPeriod &&
    Math.floor((frame - blink.start) / blinkPeriod) % 2 === 1;

  const caretStyle = {
    background: `linear-gradient(180deg, ${caretColor}, ${caretColorEnd})`,
    borderRadius: fontSize * 0.03,
  };

  const overlayWidth =
    frame < expandEnd
      ? `calc(${(expand * 100).toFixed(3)}% + ${((1 - expand) * caretWidth).toFixed(2)}px)`
      : `calc(${((1 - collapse) * 100).toFixed(3)}% + ${(collapse * caretWidth).toFixed(2)}px)`;

  const tailSolidStop =
    frame < expandEnd ? 100 - 90 * expand : 10 + 90 * collapse;
  const tailMask =
    frame >= swapAt
      ? `linear-gradient(90deg, black ${tailSolidStop.toFixed(1)}%, transparent 100%)`
      : undefined;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        whiteSpace: "nowrap",
        background: "transparent",
      }}
    >
      <span
        className={className}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          fontSize,
          fontWeight,
          color,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          fontFamily:
            "var(--font-geist-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif)",
        }}
      >
        <span
          style={{
            display: "inline-block",
            whiteSpace: "pre",
            visibility: frame < expandEnd ? "visible" : "hidden",
          }}
        >
          {fromText}
        </span>
        <span
          aria-hidden
          style={{
            ...caretStyle,
            display: "inline-block",
            flexShrink: 0,
            width: caretWidth,
            height: caretHeight,
            marginLeft: CARET_GAP_EM * fontSize,
            visibility: "hidden",
          }}
        />
        {!typing && (
          <span
            aria-hidden
            style={{
              ...caretStyle,
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              height: caretHeight,
              ...(frame < swapAt
                ? { right: 0, width: caretWidth }
                : frame < expandEnd
                  ? { right: 0, width: overlayWidth }
                  : { left: 0, width: overlayWidth }),
              WebkitMaskImage: tailMask,
              maskImage: tailMask,
              opacity: frame >= caretVisibleAt ? 1 : 0,
            }}
          />
        )}
        {typing && (
          <span
            style={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: `translate(${typedShift.toFixed(1)}px, -50%)`,
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "pre",
            }}
          >
            <span style={{ display: "inline-block", whiteSpace: "pre" }}>
              {typed}
            </span>
            <span
              aria-hidden
              style={{
                ...caretStyle,
                display: "inline-block",
                flexShrink: 0,
                width: caretWidth,
                height: caretHeight,
                marginLeft: CARET_GAP_EM * fontSize,
                opacity: blinkOff ? 0 : 1,
              }}
            />
          </span>
        )}
      </span>
    </div>
  );
}
