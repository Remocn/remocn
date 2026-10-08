"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionOutline } from "@/registry/remocn/caption-outline";

interface CaptionOutlineExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  activeColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
}

export function CaptionOutlineExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  activeColor,
  strokeColor,
  strokeWidth,
  combineTokensWithinMilliseconds,
  holdMs,
}: CaptionOutlineExampleProps) {
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
      <CaptionOutline
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        activeColor={activeColor}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
      />
    </AbsoluteFill>
  );
}

export const captionOutlineExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const activeColor = (values.activeColor as string) ?? "#facc15";
  const strokeColor = (values.strokeColor as string) ?? "#000000";
  const strokeWidth = (values.strokeWidth as number) ?? 0.12;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const extra = [
    strokeColor !== "#000000" ? `      strokeColor="${strokeColor}"` : null,
    strokeWidth !== 0.12 ? `      strokeWidth={${strokeWidth}}` : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionOutline } from "@/components/remocn/caption-outline";
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
    <CaptionOutline
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      activeColor="${activeColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
