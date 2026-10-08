"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionCube } from "@/registry/remocn/caption-cube";

interface CaptionCubeExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  tintActive?: boolean;
  activeColor?: string;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionCubeExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  tintActive,
  activeColor,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionCubeExampleProps) {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: height * 0.1,
        paddingInline: width * 0.1,
      }}
    >
      <CaptionCube
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        tintActive={tintActive}
        activeColor={activeColor}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionCubeExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const tintActive = (values.tintActive as boolean) ?? false;
  const activeColor = (values.activeColor as string) ?? "#facc15";
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 800;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    tintActive ? "      tintActive" : null,
    tintActive && activeColor !== "#facc15"
      ? `      activeColor="${activeColor}"`
      : null,
    combine !== 800
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionCube } from "@/components/remocn/caption-cube";
import captions from "./captions.json";

export const MyScene = () => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 108,
      paddingInline: 192,
    }}
  >
    <CaptionCube
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
