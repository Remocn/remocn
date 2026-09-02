import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { LightStage } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function SpeedScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.speed;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const easing = resolveIntroducingProductEasing(config.easing);
  const count = Math.max(
    1,
    Math.round(
      interpolate(
        frame,
        [
          at(props.sceneDuration, config.countStart),
          at(props.sceneDuration, config.countEnd),
        ],
        [1, Number.parseInt(props.content.metric, 10) || 10],
        { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
      ),
    ),
  );
  const metricLabel =
    props.content.metric.replace(/^\d+\s*[×x]?\s*/i, "") || "faster";

  return (
    <LightStage theme={props.theme}>
      <Interactive.Div
        name="Value statement"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "70px 100px",
          fontSize: config.introFontSize,
          fontWeight: 650,
          letterSpacing: "-0.055em",
          opacity: interpolate(
            frame,
            [
              0,
              at(props.sceneDuration, config.fadeInEnd),
              at(props.sceneDuration, config.introOutAt * 0.72),
              at(props.sceneDuration, config.introOutAt),
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: `${config.x}px ${config.y}px`,
        }}
      >
        With {props.content.productName}, move
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: interpolate(
            frame,
            [
              at(props.sceneDuration, config.metricInAt),
              at(props.sceneDuration, config.metricInAt + 0.11),
              at(props.sceneDuration, config.fadeOutStart),
              props.sceneDuration,
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: `${config.x}px ${config.y}px`,
        }}
      >
        {config.pillScale.map((pillScale, index) => (
          <div
            key={`${pillScale}-${index}`}
            style={{
              position: "absolute",
              width: config.pillWidth,
              height: config.pillHeight,
              borderRadius: 999,
              background: props.theme.accentColor,
              opacity: 0.07 + index * 0.06,
              scale:
                pillScale *
                interpolate(
                  frame,
                  [
                    at(props.sceneDuration, config.metricInAt + index * 0.04),
                    at(props.sceneDuration, config.countEnd + index * 0.03),
                  ],
                  [0.55, 1],
                  {
                    easing,
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                ),
            }}
          />
        ))}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            fontSize: config.metricFontSize,
            fontWeight: 700,
            letterSpacing: "-0.045em",
          }}
        >
          {count}× {metricLabel}
        </div>
      </div>
    </LightStage>
  );
}
