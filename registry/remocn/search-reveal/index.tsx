"use client";

import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type SearchRevealProps = {
  text?: string;
  fieldWidth?: number;
  fontSize?: number;
  framesPerCharacter?: number;
  showPanel?: boolean;
  showGuides?: boolean;
  color?: string;
  fieldColor?: string;
  ringColor?: string;
  panelColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  speed?: number;
  reducedMotion?: boolean;
  className?: string;
};

export const searchRevealLength = 90;
const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const letters = (text: string) =>
  Array.from(
    new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text),
    (part) => part.segment,
  );
const curve = Easing.bezier(0.22, 1, 0.36, 1);
const tween = (frame: number, start: number, end: number, from = 0, to = 1) =>
  interpolate(frame, [start, end], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: curve,
  });

function timing(props: SearchRevealProps) {
  const characters = letters(props.text ?? "remocn");
  const step = clamp(finite(props.framesPerCharacter, 4), 1, 12);
  const end = Math.max(searchRevealLength, 54 + characters.length * step + 10);
  return { characters, step, end, speed: Math.max(0, finite(props.speed, 1)) };
}

/** Demo duration at 30 fps, including an 18-frame final hold. */
export function getSearchRevealDuration(props: SearchRevealProps = {}) {
  const { end, speed } = timing(props);
  return speed === 0 ? 1 : Math.ceil((end + 18) / speed);
}

/** Frame is expressed at 30 fps; playback speed is applied here. */
export function getSearchRevealState(
  frame: number,
  props: SearchRevealProps = {},
) {
  const { characters, step, end, speed } = timing(props);
  const t = props.reducedMotion ? end : Math.max(0, finite(frame, 0)) * speed;
  const typedCount = clamp(Math.floor((t - 54) / step), 0, characters.length);
  const width = clamp(finite(props.fieldWidth, 464), 320, 640);
  const reveal = props.showPanel === false ? 0 : tween(t, 56, 90);
  const fieldWidth = tween(t, 26, 48, 130, width);
  const fieldHeight = tween(t, 26, 46, 24, 80);
  const panelWidth =
    fieldWidth + (Math.max(774, width + 170) - fieldWidth) * reveal;
  const panelHeight = fieldHeight + (374 - fieldHeight) * reveal;
  return {
    t,
    end,
    typedCount,
    text: characters.slice(0, typedCount).join(""),
    circleRadius: tween(t, 0, 26, 250, 410),
    circleOffset: tween(t, 0, 26, 62, 185),
    circlesVisible: t < 26,
    fieldVisible: t >= 26,
    fieldWidth,
    fieldHeight,
    tilt: tween(t, 26, 47, -4, 0),
    iconOpacity: tween(t, 34, 46),
    panelWidth,
    panelHeight,
    panelRadius: 40 * (1 - reveal),
    panelOpacity: tween(t, 56, 60),
    reveal,
    caretVisible:
      t >= 52 &&
      t < end &&
      (typedCount < characters.length || Math.floor((t - 52) / 12) % 2 === 0),
  };
}

function Cross({ x, y, size = 9 }: { x: number; y: number; size?: number }) {
  return (
    <path
      d={`M ${x - size} ${y} H ${x + size} M ${x} ${y - size} V ${y + size}`}
    />
  );
}

/** A video scene: expanding construction circles, a search pill, and typed copy. */
export function SearchReveal({
  text = "remocn",
  fieldWidth = 464,
  fontSize = 34,
  framesPerCharacter = 4,
  showPanel = true,
  showGuides = true,
  color = "#26232b",
  fieldColor = "#ffffff",
  ringColor = "#cbc5cf",
  panelColor = "#a800b7",
  accentColor = "#e8f99a",
  backgroundColor = "#f5f1f5",
  speed = 1,
  reducedMotion = false,
  className,
}: SearchRevealProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const state = getSearchRevealState((frame * 30) / fps, {
    text,
    fieldWidth,
    framesPerCharacter,
    showPanel,
    speed,
    reducedMotion,
  });
  const scale = Math.min(width / 1280, height / 720);
  const fittedFont = Math.min(
    clamp(finite(fontSize, 34), 18, 54),
    (state.fieldWidth - 120) / Math.max(1, letters(text).length * 0.65),
  );
  const markerWidth = showPanel ? state.panelWidth : state.fieldWidth;
  const markerHeight = showPanel ? state.panelHeight : state.fieldHeight;

  return (
    <AbsoluteFill
      className={className}
      style={{
        backgroundColor,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 1280,
          height: 720,
          flexShrink: 0,
          position: "relative",
          transform: `scale(${scale})`,
        }}
      >
        {state.circlesVisible && (
          <svg
            aria-hidden="true"
            width="1280"
            height="720"
            viewBox="-640 -360 1280 720"
            style={{ position: "absolute", inset: 0, overflow: "visible" }}
          >
            <g fill="none" stroke={ringColor} strokeWidth="1">
              {[-1, 1].map((side) => (
                <g key={side}>
                  <circle
                    cx={side * state.circleOffset}
                    r={state.circleRadius}
                  />
                  {showGuides &&
                    [-1, 1].map((edge) => (
                      <Cross
                        key={edge}
                        x={
                          side * state.circleOffset + edge * state.circleRadius
                        }
                        y={0}
                        size={6}
                      />
                    ))}
                </g>
              ))}
            </g>
          </svg>
        )}
        {state.fieldVisible && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 0,
              height: 0,
              transform: `rotate(${state.tilt}deg)`,
            }}
          >
            {showPanel && (
              <div
                style={{
                  position: "absolute",
                  left: -state.panelWidth / 2,
                  top: -state.panelHeight / 2,
                  width: state.panelWidth,
                  height: state.panelHeight,
                  borderRadius: state.panelRadius,
                  overflow: "hidden",
                  opacity: state.panelOpacity,
                  backgroundColor: panelColor,
                }}
              >
                <svg
                  aria-hidden="true"
                  width="844"
                  height="374"
                  viewBox="0 0 844 374"
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "50%",
                    transform: `translate(-50%, -50%) scale(${1.07 - state.reveal * 0.07})`,
                  }}
                >
                  <g
                    transform={`translate(310 -45) rotate(${-24 + 10 * state.reveal})`}
                    fill="none"
                    stroke={fieldColor}
                  >
                    {Array.from({ length: 30 }, (_, i) => (
                      <ellipse
                        key={i}
                        rx={82 + i * 3}
                        ry={118}
                        transform={`rotate(${i * 6})`}
                        strokeWidth="1.4"
                        opacity={0.35 + i / 70}
                      />
                    ))}
                  </g>
                  <g
                    transform={`translate(65 233) rotate(${state.reveal * 25})`}
                    fill={accentColor}
                  >
                    {Array.from({ length: 10 }, (_, i) => (
                      <ellipse
                        key={i}
                        cy="-41"
                        rx="19"
                        ry="48"
                        transform={`rotate(${i * 36})`}
                      />
                    ))}
                  </g>
                  <g
                    transform={`translate(720 357) rotate(${-18 * state.reveal})`}
                    fill="none"
                    stroke={accentColor}
                    strokeWidth="22"
                  >
                    <path d="M -68 -115 V 80 M -122 -60 L -14 26 M -125 18 L -12 -61" />
                    <circle cx="103" cy="-35" r="54" />
                  </g>
                </svg>
              </div>
            )}
            {showGuides && (
              <svg
                aria-hidden="true"
                width="1280"
                height="720"
                viewBox="-640 -360 1280 720"
                style={{
                  position: "absolute",
                  left: -640,
                  top: -360,
                  overflow: "visible",
                }}
              >
                <g
                  fill="none"
                  stroke={ringColor}
                  strokeWidth="1"
                  opacity={0.5 * state.iconOpacity}
                >
                  <path
                    d={`M ${markerWidth / 2} ${-markerHeight / 2 - 14} V -360 M ${-markerWidth / 2} ${markerHeight / 2 + 14} V 360`}
                  />
                </g>
                <g fill="none" stroke={color} strokeWidth="1.5">
                  <Cross x={-markerWidth / 2} y={markerHeight / 2} />
                  <Cross x={markerWidth / 2} y={-markerHeight / 2} />
                </g>
              </svg>
            )}
            <div
              style={{
                position: "absolute",
                left: -state.fieldWidth / 2,
                top: -state.fieldHeight / 2,
                width: state.fieldWidth,
                height: state.fieldHeight,
                borderRadius: 999,
                backgroundColor: fieldColor,
                boxShadow: "0 3px 12px #26232b08, inset 0 0 0 1px #26232b0a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                color,
                fontFamily: "Arial, Helvetica, sans-serif",
                fontSize: fittedFont,
                fontWeight: 400,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  maxWidth: state.fieldWidth - 116,
                  overflow: "hidden",
                  whiteSpace: "pre",
                }}
              >
                <span>{state.text}</span>
                <span
                  aria-hidden="true"
                  style={{
                    width: 1.5,
                    height: fittedFont * 1.12,
                    marginLeft: 2,
                    flexShrink: 0,
                    backgroundColor: color,
                    opacity: state.caretVisible ? 1 : 0,
                  }}
                />
              </div>
              <svg
                aria-hidden="true"
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                stroke={ringColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{
                  position: "absolute",
                  right: 24,
                  opacity: state.iconOpacity,
                }}
              >
                <circle cx="11.5" cy="11.5" r="7.5" />
                <path d="m17 17 7 7" />
              </svg>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
