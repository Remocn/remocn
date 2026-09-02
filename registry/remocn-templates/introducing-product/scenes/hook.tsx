import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { DarkStage } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function HookScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.hook;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const split = at(props.sceneDuration, config.secondBeatAt);
  const secondBeat = frame >= split;
  const localFrame = secondBeat ? frame - split : frame;
  const localDuration = secondBeat ? props.sceneDuration - split : split;
  const copy = secondBeat ? props.content.contrastLine : props.content.hookLine;
  const easing = resolveIntroducingProductEasing(config.easing);

  return (
    <DarkStage theme={props.theme}>
      <Interactive.Div
        name="Hook statement"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 96px",
          color: props.theme.darkText,
          fontSize: interpolate(
            localFrame,
            [0, at(localDuration, 0.55), localDuration],
            [config.startFontSize, config.enterFontSize, config.settleFontSize],
            {
              easing,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            },
          ),
          fontWeight: config.fontWeight,
          letterSpacing: `${config.letterSpacing}em`,
          lineHeight: 0.94,
          textAlign: "center",
          whiteSpace: "nowrap",
          opacity: interpolate(
            localFrame,
            [
              0,
              at(localDuration, config.fadeInEnd),
              at(localDuration, config.fadeOutStart),
              localDuration,
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          filter: `blur(${interpolate(
            localFrame,
            [
              0,
              at(localDuration, config.fadeInEnd * 2),
              at(localDuration, config.fadeOutStart),
              localDuration,
            ],
            [config.blur, 0, 0, config.blur],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}px)`,
          translate: `${
            config.x +
            interpolate(
              localFrame,
              [0, at(localDuration, 0.55)],
              [config.enterOffsetX, 0],
              { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }px ${config.y}px`,
        }}
      >
        {copy}
      </Interactive.Div>
    </DarkStage>
  );
}
