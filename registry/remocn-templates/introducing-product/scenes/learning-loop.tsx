import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { LightStage } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function LearningLoopScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.learningLoop;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const easing = resolveIntroducingProductEasing(config.easing);
  const orbit = frame * config.orbitSpeed;
  const highlightStart = at(props.sceneDuration, config.highlightStart);
  return (
    <LightStage theme={props.theme}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: interpolate(
            frame,
            [0, at(props.sceneDuration, 0.42)],
            [config.startOrbSize, config.endOrbSize],
            { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          height: interpolate(
            frame,
            [0, at(props.sceneDuration, 0.42)],
            [config.startOrbSize, config.endOrbSize],
            { easing, extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          borderRadius: "50%",
          background: `radial-gradient(circle at ${42 + Math.sin(orbit) * 18}% ${38 + Math.cos(orbit) * 18}%, #fff 0 5%, ${props.theme.warmColor} 18%, ${props.theme.accentColor} 55%, #ded8ff 100%)`,
          boxShadow: `0 0 0 50px ${props.theme.accentColor}12, 0 0 0 105px ${props.theme.accentColor}08`,
          filter: `blur(${interpolate(
            frame,
            [
              0,
              at(props.sceneDuration, config.fadeInEnd),
              at(props.sceneDuration, config.fadeOutStart),
              props.sceneDuration,
            ],
            [config.blur, 0, 0, config.blur],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )}px)`,
          translate: `calc(-50% + ${config.x}px) calc(-50% + ${config.y}px)`,
          scale: config.orbScale,
        }}
      />
      <Interactive.Div
        name="Benefit statement"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 100px",
          fontSize: config.benefitFontSize,
          fontWeight: 680,
          letterSpacing: "-0.055em",
          textAlign: "center",
          opacity: interpolate(
            frame,
            [
              at(props.sceneDuration, config.fadeInEnd),
              at(props.sceneDuration, config.fadeInEnd + 0.06),
              at(props.sceneDuration, config.benefitOutAt * 0.83),
              at(props.sceneDuration, config.benefitOutAt),
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: `${config.x}px ${config.y}px`,
        }}
      >
        {props.content.benefit}
      </Interactive.Div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: config.wordsGap,
          fontSize: config.wordsFontSize,
          fontWeight: 620,
          opacity: interpolate(
            frame,
            [
              at(props.sceneDuration, config.wordsInAt),
              at(props.sceneDuration, config.wordsInAt + 0.09),
              at(props.sceneDuration, config.fadeOutStart),
              props.sceneDuration,
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          ),
          translate: `${config.x}px ${config.y}px`,
        }}
      >
        {props.content.loopWords.map((word, index) => (
          <span
            key={`${word}-${index}`}
            style={{
              color:
                Math.floor(
                  Math.max(0, frame - highlightStart) / config.highlightStep,
                ) %
                  props.content.loopWords.length ===
                index
                  ? props.theme.accentColor
                  : props.theme.lightMutedText,
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </LightStage>
  );
}
