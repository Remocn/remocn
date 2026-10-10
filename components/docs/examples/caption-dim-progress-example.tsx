"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionDimProgress } from "@/registry/remocn/caption-dim-progress";

interface CaptionDimProgressExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  dimOpacity?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionDimProgressExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  dimOpacity,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionDimProgressExampleProps) {
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
      <CaptionDimProgress
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        dimOpacity={dimOpacity}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionDimProgressExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const dimOpacity = (values.dimOpacity as number) ?? 0.35;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    dimOpacity !== 0.35 ? `      dimOpacity={${dimOpacity}}` : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionDimProgress } from "@/components/remocn/caption-dim-progress";
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
    <CaptionDimProgress
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
