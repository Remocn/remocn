import { interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { BrandMark, DarkStage } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function BrandScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.brand;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const easing = resolveIntroducingProductEasing(config.easing);
  return (
    <DarkStage theme={props.theme}>
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
              0,
              at(props.sceneDuration, config.fadeInEnd),
              at(props.sceneDuration, config.fadeOutStart),
              props.sceneDuration,
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          scale: interpolate(
            frame,
            [0, at(props.sceneDuration, config.settleAt)],
            [config.startScale, config.endScale],
            { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: `${config.x}px ${config.y}px`,
        }}
      >
        <BrandMark
          productName={props.content.productName}
          logoUrl={props.content.logoUrl}
          accentColor={props.theme.accentColor}
          size={config.logoSize}
        />
      </div>
    </DarkStage>
  );
}
