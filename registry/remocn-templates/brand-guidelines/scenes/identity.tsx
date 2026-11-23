import { AbsoluteFill, Interactive } from "remotion";
import type { SceneProps } from "../content";
import { fitSize, midway, slide, useGlide } from "../motion";
import { FormStudyMark } from "../ui";

export function Identity({ scene, frame }: SceneProps) {
  const glide = useGlide();
  const reveal = scene.reducedMotion ? 1 : slide(frame, 18, 33);
  return (
    <AbsoluteFill style={{ background: scene.theme.paper }}>
      <Interactive.Div
        name="Opening mark"
        style={{ position: "absolute", left: 428, top: 185 }}
      >
        <FormStudyMark scene={scene} color={scene.theme.accent} size={104} />
      </Interactive.Div>
      <Interactive.Div
        name="Opening tagline"
        style={{
          position: "absolute",
          top: 321,
          left: 100,
          width: 760,
          textAlign: "center",
          fontSize: fitSize(scene.content.openingTagline, 32, 760),
          fontWeight: 800,
          letterSpacing: "-0.04em",
          opacity: reveal,
          transform: `translateY(${10 * (1 - reveal)}px)${glide(midway(reveal))}`,
        }}
      >
        {scene.content.openingTagline}
      </Interactive.Div>
    </AbsoluteFill>
  );
}
