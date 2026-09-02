import { interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { DarkStage, ProductWindow } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function MontageScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.montage;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const easing = resolveIntroducingProductEasing(config.easing);
  return (
    <DarkStage theme={props.theme}>
      {props.content.featureCards.slice(0, 3).map((feature, index) => {
        const position = config.cards[index];
        return (
          <div
            key={`${feature.title}-${index}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              opacity: interpolate(
                frame,
                [
                  index * at(props.sceneDuration, 0.08),
                  at(props.sceneDuration, config.fadeInEnd) + index * 2,
                  at(props.sceneDuration, config.fadeOutStart),
                  props.sceneDuration,
                ],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
              translate: `${
                config.x +
                interpolate(
                  frame,
                  [0, at(props.sceneDuration, config.spreadEnd)],
                  [position.x * config.spreadStart, position.x],
                  {
                    easing,
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )
              }px ${
                config.y +
                interpolate(
                  frame,
                  [0, at(props.sceneDuration, config.spreadEnd)],
                  [position.y * config.spreadStart, position.y],
                  {
                    easing,
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )
              }px`,
              rotate: `${position.rotate}deg`,
              scale: config.cardScale,
            }}
          >
            <ProductWindow
              productName={props.content.productName}
              feature={feature}
              accentColor={props.theme.accentColor}
              screenshotUrl={props.content.screenshotUrls[index + 3]}
              theme={props.theme}
              compact
            />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          top: config.titleY,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: config.titleFontSize,
          fontWeight: 640,
          letterSpacing: "-0.035em",
          opacity: interpolate(
            frame,
            [
              at(props.sceneDuration, 0.31),
              at(props.sceneDuration, 0.49),
              at(props.sceneDuration, config.fadeOutStart),
              props.sceneDuration,
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      >
        {props.content.montageTitle}
      </div>
    </DarkStage>
  );
}
