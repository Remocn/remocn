"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionTeleprompter } from "@/registry/remocn/caption-teleprompter";

interface CaptionTeleprompterExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  visibleLines?: number;
  pastOpacity?: number;
  futureOpacity?: number;
  upcomingOpacity?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionTeleprompterExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  visibleLines,
  pastOpacity,
  futureOpacity,
  upcomingOpacity,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionTeleprompterExampleProps) {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "stretch",
        paddingInline: width * 0.1,
      }}
    >
      <CaptionTeleprompter
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        visibleLines={visibleLines}
        pastOpacity={pastOpacity}
        futureOpacity={futureOpacity}
        upcomingOpacity={upcomingOpacity}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionTeleprompterExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const visibleLines = (values.visibleLines as number) ?? 3;
  const pastOpacity = (values.pastOpacity as number) ?? 0.35;
  const futureOpacity = (values.futureOpacity as number) ?? 0.35;
  const upcomingOpacity = (values.upcomingOpacity as number) ?? 0.55;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1500;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    visibleLines !== 3 ? `      visibleLines={${visibleLines}}` : null,
    pastOpacity !== 0.35 ? `      pastOpacity={${pastOpacity}}` : null,
    futureOpacity !== 0.35 ? `      futureOpacity={${futureOpacity}}` : null,
    upcomingOpacity !== 0.55
      ? `      upcomingOpacity={${upcomingOpacity}}`
      : null,
    combine !== 1500
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionTeleprompter } from "@/components/remocn/caption-teleprompter";
import captions from "./captions.json";

export const MyScene = () => (
  <AbsoluteFill
    style={{
      justifyContent: "center",
      alignItems: "stretch",
      paddingInline: 192,
    }}
  >
    <CaptionTeleprompter
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
