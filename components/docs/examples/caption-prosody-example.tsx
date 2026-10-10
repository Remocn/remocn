"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionProsody } from "@/registry/remocn/caption-prosody";

interface CaptionProsodyExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  activeColor?: string;
  minScale?: number;
  maxScale?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionProsodyExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  activeColor,
  minScale,
  maxScale,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionProsodyExampleProps) {
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
      <CaptionProsody
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        activeColor={activeColor}
        minScale={minScale}
        maxScale={maxScale}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionProsodyExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const activeColor = (values.activeColor as string) ?? "#facc15";
  const minScale = (values.minScale as number) ?? 0.75;
  const maxScale = (values.maxScale as number) ?? 1.6;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    minScale !== 0.75 ? `      minScale={${minScale}}` : null,
    maxScale !== 1.6 ? `      maxScale={${maxScale}}` : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionProsody } from "@/components/remocn/caption-prosody";
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
    <CaptionProsody
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      activeColor="${activeColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
