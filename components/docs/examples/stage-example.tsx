"use client";

import { Easing, type EasingFunction, Img, staticFile } from "remotion";
import { Stage, type StageKey, type StageProps } from "@/registry/remocn/stage";

export type StagePreset =
  | "smooth-descent"
  | "site-tour"
  | "hero-push"
  | "section-hop";

const SMOOTH_RAMP_IN = Easing.in(Easing.cubic);
const SMOOTH_RAMP_OUT = Easing.out(Easing.cubic);

export const STAGE_PRESETS: Record<StagePreset, StageKey[]> = {
  "smooth-descent": [
    { at: 0, x: 0.5, y: 0.035, zoom: 1.04 },
    {
      at: 30,
      x: 0.5,
      y: 0.07052,
      zoom: 1.04,
      easing: SMOOTH_RAMP_IN,
    },
    { at: 269, x: 0.5, y: 0.91948, zoom: 1.04, easing: Easing.linear },
    {
      at: 299,
      x: 0.5,
      y: 0.955,
      zoom: 1.04,
      easing: SMOOTH_RAMP_OUT,
    },
  ],
  "site-tour": [
    { at: 0, x: 0.48, y: 0.035, zoom: 1.04, rotate: -0.35 },
    { at: 38, x: 0.48, y: 0.035, zoom: 1.04, rotate: -0.35 },
    { at: 88, x: 0.53, y: 0.28, zoom: 1.12, rotate: 0.15 },
    { at: 116, x: 0.53, y: 0.28, zoom: 1.12, rotate: 0.15 },
    { at: 174, x: 0.47, y: 0.58, zoom: 1.08, rotate: -0.2 },
    { at: 204, x: 0.47, y: 0.58, zoom: 1.08, rotate: -0.2 },
    { at: 268, x: 0.52, y: 0.955, zoom: 1.02, rotate: 0.1 },
    { at: 299, x: 0.52, y: 0.955, zoom: 1.02, rotate: 0.1 },
  ],
  "hero-push": [
    { at: 0, x: 0.5, y: 0.045, zoom: 0.94 },
    { at: 90, x: 0.5, y: 0.045, zoom: 1.2 },
    { at: 160, x: 0.5, y: 0.045, zoom: 1.2 },
    { at: 299, x: 0.5, y: 0.2, zoom: 1.08 },
  ],
  "section-hop": [
    { at: 0, x: 0.5, y: 0.04, zoom: 1.1 },
    { at: 52, x: 0.5, y: 0.04, zoom: 1.1 },
    { at: 92, x: 0.46, y: 0.38, zoom: 1.18, rotate: -0.3 },
    { at: 142, x: 0.46, y: 0.38, zoom: 1.18, rotate: -0.3 },
    { at: 184, x: 0.54, y: 0.72, zoom: 1.14, rotate: 0.25 },
    { at: 234, x: 0.54, y: 0.72, zoom: 1.14, rotate: 0.25 },
    { at: 278, x: 0.5, y: 0.96, zoom: 1.06 },
    { at: 299, x: 0.5, y: 0.96, zoom: 1.06 },
  ],
};

export interface StageExampleProps
  extends Omit<StageProps, "children" | "contentSize" | "moves"> {
  preset?: StagePreset;
}

export function StageExampleScene({
  preset = "smooth-descent",
  shake = 0,
  seed = "remocn-smooth-descent",
  ...stageProps
}: StageExampleProps) {
  return (
    <Stage
      {...stageProps}
      contentSize={{ width: 1265, height: 10022 }}
      moves={STAGE_PRESETS[preset] ?? STAGE_PRESETS["smooth-descent"]}
      shake={shake}
      seed={seed}
    >
      <Img
        src={staticFile("stage-remocn-components.webp")}
        style={{ display: "block", width: "100%", height: "100%" }}
      />
    </Stage>
  );
}

const EASING_SOURCES = new Map<EasingFunction, string>([
  [SMOOTH_RAMP_IN, "Easing.in(Easing.cubic)"],
  [Easing.linear, "Easing.linear"],
  [SMOOTH_RAMP_OUT, "Easing.out(Easing.cubic)"],
]);

const keyToSource = (key: StageKey) => {
  const fields = Object.entries(key).map(([name, value]) => {
    if (name === "easing" && typeof value === "function") {
      return `${name}: ${EASING_SOURCES.get(value) ?? "Easing.linear"}`;
    }
    return `${name}: ${value}`;
  });
  return `{ ${fields.join(", ")} }`;
};

export const stageExampleCode = (values: Record<string, unknown>): string => {
  const preset = (values.preset as StagePreset) ?? "smooth-descent";
  const selectedMoves =
    STAGE_PRESETS[preset] ?? STAGE_PRESETS["smooth-descent"];
  const moves = selectedMoves
    .map((key) => `    ${keyToSource(key)},`)
    .join("\n");
  const remotionImports = selectedMoves.some((key) => key.easing)
    ? "Easing, Img, staticFile"
    : "Img, staticFile";
  const backdrop =
    (values.backdrop as string) ??
    "linear-gradient(145deg, #17181d 0%, #09090b 72%)";

  return `import { ${remotionImports} } from "remotion";
import { Stage } from "@/components/remocn/stage";

<Stage
  contentSize={{ width: 1265, height: 10022 }}
  moves={[
${moves}
  ]}
  shake={${(values.shake as number) ?? 0}}
  seed={${JSON.stringify((values.seed as string) ?? "remocn-smooth-descent")}}
  backdrop={${JSON.stringify(backdrop)}}
  rotateX={${(values.rotateX as number) ?? 14}}
  rotateY={${(values.rotateY as number) ?? -20}}
  perspective={${(values.perspective as number) ?? 900}}
  scale={${(values.scale as number) ?? 0.86}}
  radius={${(values.radius as number) ?? 1.4}}
  reflection={${(values.reflection as number) ?? 0.24}}
  shadow={${(values.shadow as number) ?? 0.7}}
  light={${(values.light as number) ?? 0.55}}
>
  <Img
    src={staticFile("your-long-page.png")}
    style={{ width: "100%", height: "100%" }}
  />
</Stage>`;
};
