"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionWeight } from "@/registry/remocn/caption-weight";

interface CaptionWeightExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  activeWeight?: number;
  color?: string;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionWeightExampleScene({
  captions,
  fontSize,
  fontWeight,
  activeWeight,
  color,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionWeightExampleProps) {
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
      <CaptionWeight
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        activeWeight={activeWeight}
        color={color}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionWeightExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 400;
  const activeWeight = (values.activeWeight as number) ?? 900;
  const color = (values.color as string) ?? "#ffffff";
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    combine !== 1200
      ? `        combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `        holdMs={${holdMs}}` : null,
    shadow ? null : "        shadow={false}",
  ].filter(Boolean);
  return `import { loadVariableFont } from "@remotion/google-fonts/Inter";
import { AbsoluteFill } from "remotion";
import { CaptionWeight } from "@/components/remocn/caption-weight";
import captions from "./captions.json";

const { fontFamily } = loadVariableFont("normal", { subsets: ["latin"] });

export const MyScene = () => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 108,
      paddingInline: 192,
    }}
  >
    <div style={{ fontFamily }}>
      <CaptionWeight
        captions={captions}
        fontSize={${fontSize}}
        fontWeight={${fontWeight}}
        activeWeight={${activeWeight}}
        color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}      />
    </div>
  </AbsoluteFill>
);`;
};
