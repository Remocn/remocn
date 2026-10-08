"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionHighlightBox } from "@/registry/remocn/caption-highlight-box";

interface CaptionHighlightBoxExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  activeColor?: string;
  boxColor?: string;
  boxRadius?: number;
  boxPadding?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionHighlightBoxExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  activeColor,
  boxColor,
  boxRadius,
  boxPadding,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionHighlightBoxExampleProps) {
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
      <CaptionHighlightBox
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        activeColor={activeColor}
        boxColor={boxColor}
        boxRadius={boxRadius}
        boxPadding={boxPadding}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionHighlightBoxExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const activeColor = (values.activeColor as string) ?? "#0a0a0a";
  const boxColor = (values.boxColor as string) ?? "#facc15";
  const boxRadius = (values.boxRadius as number) ?? 0.16;
  const boxPadding = (values.boxPadding as number) ?? 0.14;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    boxRadius !== 0.16 ? `      boxRadius={${boxRadius}}` : null,
    boxPadding !== 0.14 ? `      boxPadding={${boxPadding}}` : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionHighlightBox } from "@/components/remocn/caption-highlight-box";
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
    <CaptionHighlightBox
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      activeColor="${activeColor}"
      boxColor="${boxColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
