"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionMarker } from "@/registry/remocn/caption-marker";

const PREVIEW_KEYWORDS = ["thing", "lose", "three", "captions", "sound"];

interface CaptionMarkerExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  markerColor?: string;
  markerTextColor?: string;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionMarkerExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  markerColor,
  markerTextColor,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionMarkerExampleProps) {
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
      <CaptionMarker
        captions={previewCaptions(captions)}
        keywords={PREVIEW_KEYWORDS}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        markerColor={markerColor}
        markerTextColor={markerTextColor}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionMarkerExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const markerColor = (values.markerColor as string) ?? "#facc15";
  const markerTextColor = (values.markerTextColor as string) ?? "#0a0a0a";
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    markerTextColor !== "#0a0a0a"
      ? `      markerTextColor="${markerTextColor}"`
      : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionMarker } from "@/components/remocn/caption-marker";
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
    <CaptionMarker
      captions={captions}
      keywords={[${PREVIEW_KEYWORDS.map((k) => `"${k}"`).join(", ")}]}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      markerColor="${markerColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
