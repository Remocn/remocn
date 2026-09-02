import { interpolate, useCurrentFrame } from "remotion";
import { at, resolveIntroducingProductEasing, sceneFrame } from "../easing";
import { BrandMark, DarkStage } from "../shared";
import type { IntroducingProductSceneProps } from "../types";

export function OutroScene(props: IntroducingProductSceneProps) {
  const config = props.scenes.outro;
  const frame = sceneFrame(
    useCurrentFrame(),
    props.timeline.speed,
    props.sceneDuration,
  );
  const easing = resolveIntroducingProductEasing(config.easing);
  return (
    <DarkStage theme={props.theme}>
      {config.rings.map((size) => (
        <div
          key={size}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: size * 2,
            height: size * 0.72,
            border: `1px solid ${props.theme.windowBorderColor}`,
            borderRadius: "50%",
            translate: `calc(-50% + ${config.x}px) calc(-50% + ${config.y}px)`,
            rotate: "-12deg",
            opacity: interpolate(
              frame,
              [
                0,
                at(props.sceneDuration, config.fadeInEnd),
                at(props.sceneDuration, config.fadeOutStart),
                props.sceneDuration,
              ],
              [0, 0.65, 0.28, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            ),
          }}
        />
      ))}
      {config.orbits.map((orb, index) => {
        const angle = orb.phase + frame * (config.orbitSpeed + index * 0.003);
        return (
          <div
            key={`${orb.radius}-${index}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 28%, #fff, ${index === 1 ? props.theme.warmColor : props.theme.accentColor} 52%, #121018 100%)`,
              boxShadow: `0 0 35px ${index === 1 ? props.theme.warmColor : props.theme.accentColor}88`,
              opacity: interpolate(
                frame,
                [
                  index * at(props.sceneDuration, 0.04),
                  at(props.sceneDuration, config.fadeInEnd) + index * 8,
                  at(props.sceneDuration, config.fadeOutStart),
                  props.sceneDuration,
                ],
                [0, 1, 1, 0],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
              translate: `${config.x + Math.cos(angle) * orb.radius - orb.size / 2}px ${config.y + Math.sin(angle) * orb.radius * config.orbitVerticalScale - orb.size / 2}px`,
              scale: 0.75 + (Math.sin(angle) + 1) * 0.2,
            }}
          />
        );
      })}
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
            [config.startScale, 1],
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
          showName={frame > at(props.sceneDuration, config.nameRevealAt)}
        />
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: config.taglineBottom,
          textAlign: "center",
          color: props.theme.darkMutedText,
          fontSize: config.taglineFontSize,
          opacity: interpolate(
            frame,
            [
              at(props.sceneDuration, config.nameRevealAt + 0.05),
              at(props.sceneDuration, config.nameRevealAt + 0.18),
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
    </DarkStage>
  );
}
