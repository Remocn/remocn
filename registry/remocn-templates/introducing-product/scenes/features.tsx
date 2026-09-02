import { interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { DarkStage, FadeEdges, ProductWindow } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function FeaturesScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.features;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const easing = resolveIntroducingProductEasing(config.easing);
  const beat = at(props.sceneDuration, config.beatGap);
  const lifetime = at(props.sceneDuration, config.cardLifetime);

  return (
    <DarkStage theme={props.theme}>
      {props.content.featureCards.slice(0, 3).map((feature, index) => {
        const start = index * beat;
        const end = start + lifetime;
        const isEven = index % 2 === 0;
        return (
          <div
            key={`${feature.eyebrow}-${index}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              opacity: interpolate(
                frame,
                [start, start + lifetime * 0.1, end - lifetime * 0.15, end],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
              transform: `perspective(1500px) rotateX(${interpolate(
                frame,
                [start, start + lifetime * 0.35, end],
                [config.startRotateX, config.peakRotateX, config.endRotateX],
                { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )}deg) rotateY(${interpolate(
                frame,
                [start, end],
                [
                  isEven ? config.startRotateY : -config.startRotateY,
                  isEven ? config.endRotateY : -config.endRotateY,
                ],
                { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              )}deg)`,
              translate: `${
                config.x +
                interpolate(
                  frame,
                  [start, start + lifetime * 0.19, end - lifetime * 0.17, end],
                  [
                    isEven ? config.enterXEven : config.enterXOdd,
                    config.centerX,
                    config.centerX - 80,
                    isEven ? config.exitXEven : config.exitXOdd,
                  ],
                  {
                    easing,
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  },
                )
              }px ${
                config.y +
                interpolate(frame, [start, end], [config.startY, config.endY], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              }px`,
              scale: interpolate(
                frame,
                [start, start + lifetime * 0.35, end],
                [config.startScale, config.peakScale, config.endScale],
                { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
            }}
          >
            <ProductWindow
              productName={props.content.productName}
              feature={feature}
              accentColor={props.theme.accentColor}
              screenshotUrl={props.content.screenshotUrls[index]}
              theme={props.theme}
            />
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          left: config.taglineX,
          bottom: config.taglineBottom,
          color: props.theme.darkMutedText,
          fontSize: config.taglineFontSize,
          letterSpacing: "-0.02em",
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
        }}
      >
        {props.content.tagline}
      </div>
      <FadeEdges />
    </DarkStage>
  );
}
