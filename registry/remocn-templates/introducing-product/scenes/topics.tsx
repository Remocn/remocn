import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { DarkStage } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function TopicsScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.topics;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const easing = resolveIntroducingProductEasing(config.easing);
  const topicStart = at(props.sceneDuration, config.topicStartAt);
  const topicDuration = Math.max(
    1,
    (props.sceneDuration - topicStart) / props.content.topics.length,
  );
  const topicFrame = Math.max(0, frame - topicStart);
  const index = Math.min(
    props.content.topics.length - 1,
    Math.floor(topicFrame / topicDuration),
  );
  const local = topicFrame % topicDuration;

  return (
    <DarkStage theme={props.theme}>
      <Interactive.Div
        name="Topic intro"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: config.introFontSize,
          fontWeight: 650,
          letterSpacing: "-0.055em",
          opacity: interpolate(
            frame,
            [0, topicStart * 0.26, topicStart * 0.74, topicStart],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: `${config.x}px ${config.y}px`,
        }}
      >
        {props.content.topicIntro}
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "70px 95px",
          color: props.theme.accentColor,
          fontSize: interpolate(
            local,
            [0, topicDuration * 0.62],
            [config.topicStartSize, config.topicEndSize],
            { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          fontWeight: config.topicFontWeight,
          letterSpacing: "-0.065em",
          lineHeight: 0.95,
          textAlign: "center",
          opacity: interpolate(
            local,
            [0, topicDuration * 0.24, topicDuration * 0.76, topicDuration],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          filter: `blur(${interpolate(
            local,
            [0, topicDuration * 0.3, topicDuration * 0.76, topicDuration],
            [config.topicBlur, 0, 0, config.topicBlur],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}px)`,
          translate: `${config.x}px ${config.y}px`,
        }}
      >
        {props.content.topics[index]}
      </div>
    </DarkStage>
  );
}
