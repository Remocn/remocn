"use client";

import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Polaroid } from "@/registry/remocn/polaroid";

function LiveMedia() {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 120], [0, 40]);
  const scale = interpolate(frame, [0, 120], [1, 1.08]);

  return (
    <AbsoluteFill
      style={{
        background: "#100f14",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(115deg, #2b3a67 0%, #6f7f35 45%, #b8642a 100%)",
          transform: `translateX(${-drift}px) scale(${scale})`,
        }}
      />
    </AbsoluteFill>
  );
}

export function PolaroidExampleScene({
  caption = "first light",
  captionAt,
  width,
  captionSize,
  step,
}: {
  caption?: string;
  captionAt?: number;
  width?: number;
  captionSize?: number;
  step?: number;
}) {
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Polaroid
        caption={caption}
        captionAt={captionAt}
        width={width}
        captionSize={captionSize}
        step={step}
      >
        <LiveMedia />
      </Polaroid>
    </AbsoluteFill>
  );
}

export const polaroidExampleCode = (
  values: Record<string, unknown>,
): string => {
  const caption = (values.caption as string) ?? "first light";
  const captionAt = (values.captionAt as number) ?? 0;
  const width = (values.width as number) ?? 652;
  const captionSize = (values.captionSize as number) ?? 36;
  const step = (values.step as number) ?? 3;
  return `import { OffthreadVideo, staticFile } from "remotion";
import { Polaroid } from "@/components/remocn/polaroid";

export const MyScene = () => (
  <Polaroid
    caption="${caption}"
    captionAt={${captionAt}}
    width={${width}}
    captionSize={${captionSize}}
    step={${step}}
  >
    <OffthreadVideo
      src={staticFile("clip.mp4")}
      muted
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </Polaroid>
);`;
};
