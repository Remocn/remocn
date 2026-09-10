import { Img, Sequence, useVideoConfig } from "remotion";
import { ShaderTextReveal } from "@/components/remocn/shader-text-reveal";
import type { SceneProps } from "../content";
import { tween } from "../motion";
import { Center, Title } from "../ui";

export function Opening({ scene, t }: SceneProps) {
  const { fps } = useVideoConfig();
  return (
    <>
      <Sequence name="Your — chrome reveal" durationInFrames={Math.round(fps)}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            filter: "hue-rotate(290deg) saturate(4) brightness(1.5)",
            maskImage: `linear-gradient(125deg, transparent ${tween(t, 0.7, 1, -70, 105)}%, black ${tween(t, 0.7, 1, -45, 130)}%)`,
          }}
        >
          <ShaderTextReveal
            text={`${scene.content.opening}\n`}
            fontFamily="Manrope"
            fontWeight={500}
            fontSize={570}
            wordDuration={fps * 1.4}
          />
        </div>
      </Sequence>
      <Sequence
        name="Product — chrome reveal"
        from={Math.round(fps)}
        durationInFrames={Math.round(fps * 1.5)}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            filter: "hue-rotate(290deg) saturate(4) brightness(1.5)",
          }}
        >
          <ShaderTextReveal
            text={`${scene.content.subject}\n`}
            fontFamily="Manrope"
            fontWeight={500}
            fontSize={300}
            wordDuration={fps * 1.4}
          />
        </div>
      </Sequence>
      {t >= 2.5 ? (
        <>
          <Img
            src={scene.media.horizon}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: tween(t, 2.5, 2.85),
              transform: `scale(${tween(t, 2.5, 3.8, 1.1, 1)})`,
              filter: "brightness(0.66) saturate(0.85) blur(0.4px)",
            }}
          />
          <Center>
            <Title
              text={scene.content.ready}
              size={57}
              style={{
                color: "#fff9ee",
                opacity: tween(t, 2.5, 2.7),
                filter: `blur(${tween(t, 2.5, 2.9, 7, 0)}px)`,
                textShadow: "0 0 3px #fff6",
              }}
            />
          </Center>
        </>
      ) : null}
    </>
  );
}
