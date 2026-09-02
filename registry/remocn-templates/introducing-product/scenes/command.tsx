import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { DarkStage } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function CommandScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.command;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const easing = resolveIntroducingProductEasing(config.easing);
  const visible = Math.floor(
    interpolate(
      frame,
      [
        at(props.sceneDuration, config.typeStart),
        at(props.sceneDuration, config.typeEnd),
      ],
      [0, props.content.command.length],
      { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    ),
  );

  return (
    <DarkStage theme={props.theme}>
      <Interactive.Div
        name="Command field"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          display: "flex",
          alignItems: "center",
          width: interpolate(
            frame,
            [0, at(props.sceneDuration, config.expandEnd)],
            [config.collapsedWidth, config.expandedWidth],
            { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          height: config.height,
          padding: `0 ${config.paddingX}px`,
          border: `1px solid ${props.theme.windowBorderColor}`,
          borderRadius: 999,
          backgroundColor: props.theme.darkBackground,
          boxShadow: `-18px 0 55px ${props.theme.accentColor}aa, 20px 0 60px ${props.theme.warmColor}80`,
          color: props.theme.darkText,
          fontSize: config.fontSize,
          fontWeight: config.fontWeight,
          letterSpacing: "-0.035em",
          overflow: "hidden",
          opacity: interpolate(
            frame,
            [
              0,
              at(props.sceneDuration, config.fadeInEnd),
              at(props.sceneDuration, config.fadeOutStart),
              props.sceneDuration,
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: `calc(-50% + ${config.x}px) calc(-50% + ${config.y}px)`,
        }}
      >
        <span style={{ whiteSpace: "nowrap" }}>
          {props.content.command.slice(0, visible)}
        </span>
        <span
          style={{
            width: 3,
            height: config.fontSize * 1.2,
            marginLeft: 5,
            background: props.theme.accentColor,
            opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0,
          }}
        />
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: config.cursorWidth,
          height: config.cursorHeight,
          opacity: interpolate(
            frame,
            [
              at(props.sceneDuration, 0.58),
              at(props.sceneDuration, 0.72),
              at(props.sceneDuration, config.fadeOutStart),
              props.sceneDuration,
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: `${config.cursorX}px ${config.cursorY}px`,
          rotate: "-22deg",
          background: props.theme.accentColor,
          clipPath: "polygon(0 0, 100% 70%, 58% 76%, 45% 100%)",
          filter: `drop-shadow(0 0 14px ${props.theme.accentColor})`,
        }}
      />
    </DarkStage>
  );
}
