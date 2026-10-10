"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionRedact } from "@/registry/remocn/caption-redact";

interface CaptionRedactExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  barColor?: string;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionRedactExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  barColor,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionRedactExampleProps) {
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
      <CaptionRedact
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        barColor={barColor}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionRedactExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const barColor = (values.barColor as string) ?? "#0a0a0a";
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionRedact } from "@/components/remocn/caption-redact";
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
    <CaptionRedact
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      barColor="${barColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
