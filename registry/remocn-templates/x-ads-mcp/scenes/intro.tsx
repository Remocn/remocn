import type { CSSProperties } from "react";
import { useVideoConfig } from "remotion";
import { TypedSplitWipe } from "@/components/remocn/typed-split-wipe";
import type { SceneProps } from "../content";
import { Command } from "../ui";

export function Intro({ scene, t }: SceneProps) {
  const { fps } = useVideoConfig();
  return (
    <>
      <div
        style={
          {
            position: "absolute",
            inset: 0,
            "--font-geist-sans": '"Inter", sans-serif',
          } as CSSProperties
        }
      >
        <TypedSplitWipe
          prefix={scene.content.prefix}
          anchor=""
          suffix={scene.content.product}
          typeFrames={60}
          exitAt={86}
          exitFrames={46}
          wordStagger={8}
          anchorShift={-30}
          fontSize={Math.min(
            26,
            620 /
              Math.max(
                1,
                scene.content.prefix.length + scene.content.product.length + 3,
              ),
          )}
          color="#e6f1f8"
          speed={60 / fps}
        />
      </div>
      {t >= 1.85 ? (
        <Command
          text={scene.content.command}
          t={t}
          start={1.85}
          finish={5.4}
          end={6.4}
          tracking
        />
      ) : null}
    </>
  );
}
