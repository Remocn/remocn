"use client";

import { AbsoluteFill } from "remotion";
import { Handwrite, handwriteDuration } from "@/registry/remocn/handwrite";
import { InkUnderline } from "@/registry/remocn/ink-underline";

const URL_TEXT = "remocn.dev";

const captionMetrics = (width: number) => {
  const fontSize = Math.round(width * 0.152);
  return { fontSize, height: Math.round(fontSize * 1.5) };
};

export function InkUnderlineExampleScene({
  width = 420,
  color,
  thickness,
  pressure,
  release,
  grain,
  durationSteps,
  seed,
  step,
}: {
  width?: number;
  color?: string;
  thickness?: number;
  pressure?: number;
  release?: number;
  grain?: number;
  durationSteps?: number;
  seed?: string;
  step?: number;
}) {
  const written = handwriteDuration(URL_TEXT, { step });
  const { fontSize, height } = captionMetrics(width);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ position: "relative", width, height }}>
        <Handwrite text={URL_TEXT} fontSize={fontSize} step={step} />
      </div>
      <InkUnderline
        width={width}
        color={color}
        thickness={thickness}
        pressure={pressure}
        release={release}
        grain={grain}
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
  const pressure = (values.pressure as number) ?? 1;
  const release = (values.release as number) ?? 0.15;
  const grain = (values.grain as number) ?? 1;
  const durationSteps = (values.durationSteps as number) ?? 5;
  const seed = (values.seed as string) ?? "ink";
  const step = (values.step as number) ?? 3;
  const { fontSize, height } = captionMetrics(width);
  return `import { AbsoluteFill } from "remotion";
import { Handwrite, handwriteDuration } from "@/components/remocn/handwrite";
import { InkUnderline } from "@/components/remocn/ink-underline";

const url = "${URL_TEXT}";

export const MyScene = () => (
  <AbsoluteFill
    style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}
  >
    <div style={{ position: "relative", width: ${width}, height: ${height} }}>
      <Handwrite text={url} fontSize={${fontSize}} step={${step}} />
    </div>
    <InkUnderline
      width={${width}}
      color="${color}"
      thickness={${thickness}}
      pressure={${pressure}}
      release={${release}}
      grain={${grain}}
      delay={handwriteDuration(url, { step: ${step} })}
      durationSteps={${durationSteps}}
      seed="${seed}"
      step={${step}}
    />
  </AbsoluteFill>
);`;
};
