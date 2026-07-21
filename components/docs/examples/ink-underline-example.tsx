"use client";

import { AbsoluteFill } from "remotion";
import { Handwrite, handwriteDuration } from "@/registry/remocn/handwrite";
import { InkUnderline } from "@/registry/remocn/ink-underline";

const URL_TEXT = "remocn.dev";

export function InkUnderlineExampleScene({
  width = 420,
  color,
  thickness,
  durationSteps,
  seed,
  step,
}: {
  width?: number;
  color?: string;
  thickness?: number;
  durationSteps?: number;
  seed?: string;
  step?: number;
}) {
  const written = handwriteDuration(URL_TEXT, { step });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ position: "relative", width, height: 96 }}>
        <Handwrite text={URL_TEXT} fontSize={64} step={step} />
      </div>
      <InkUnderline
        width={width}
        color={color}
        thickness={thickness}
        delay={written}
        durationSteps={durationSteps}
        seed={seed}
        step={step}
      />
    </AbsoluteFill>
  );
}

export const inkUnderlineExampleCode = (
  values: Record<string, unknown>,
): string => {
  const width = (values.width as number) ?? 420;
  const color = (values.color as string) ?? "#6f7f35";
  const thickness = (values.thickness as number) ?? 9;
  const durationSteps = (values.durationSteps as number) ?? 5;
  const seed = (values.seed as string) ?? "ink";
  const step = (values.step as number) ?? 3;
  return `import { AbsoluteFill } from "remotion";
import { Handwrite, handwriteDuration } from "@/components/remocn/handwrite";
import { InkUnderline } from "@/components/remocn/ink-underline";

const url = "${URL_TEXT}";

export const MyScene = () => (
  <AbsoluteFill
    style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}
  >
    <div style={{ position: "relative", width: ${width}, height: 96 }}>
      <Handwrite text={url} fontSize={64} step={${step}} />
    </div>
    <InkUnderline
      width={${width}}
      color="${color}"
      thickness={${thickness}}
      delay={handwriteDuration(url, { step: ${step} })}
      durationSteps={${durationSteps}}
      seed="${seed}"
      step={${step}}
    />
  </AbsoluteFill>
);`;
};
