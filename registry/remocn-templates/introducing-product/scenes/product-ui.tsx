import { interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { DarkStage, FadeEdges, ProductWindow } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function ProductUiScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.productUi;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const easing = resolveIntroducingProductEasing(config.easing);
  const settle = at(props.sceneDuration, config.settleAt);
  return (
    <DarkStage theme={props.theme}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
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
          transform: `perspective(1400px) rotateX(${interpolate(
            frame,
            [0, settle],
            [config.startRotateX, config.endRotateX],
            { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}deg) rotateY(${interpolate(
            frame,
            [0, settle],
            [config.startRotateY, config.endRotateY],
            { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}deg)`,
          translate: `calc(-50% + ${config.x}px) ${
            config.y +
            interpolate(frame, [0, settle], [config.startY, config.endY], {
              easing,
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })
          }px`,
          scale: interpolate(
            frame,
            [0, settle],
            [config.startScale, config.endScale],
            { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
        }}
      >
        <ProductWindow
          productName={props.content.productName}
          feature={props.content.featureCards[0]}
          accentColor={props.theme.accentColor}
          screenshotUrl={props.content.screenshotUrls[0]}
          theme={props.theme}
        />
      </div>
      <FadeEdges />
    </DarkStage>
  );
}
