"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  CAPTION_FIXTURE_TEXT,
  previewCaptions,
} from "@/components/docs/examples/caption-fixture";
import { CaptionStack } from "@/registry/remocn/caption-stack";

const PREVIEW_KEYWORDS = ["thing", "lose", "three", "captions", "sound"];

interface CaptionStackExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  emphasisColor?: string;
  emphasisScale?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionStackExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  emphasisColor,
  emphasisScale,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionStackExampleProps) {
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
      <CaptionStack
        captions={previewCaptions(captions)}
        keywords={
          captions === undefined || captions.trim() === CAPTION_FIXTURE_TEXT
            ? PREVIEW_KEYWORDS
            : undefined
        }
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        emphasisColor={emphasisColor}
        emphasisScale={emphasisScale}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionStackExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const emphasisColor = (values.emphasisColor as string) ?? "#facc15";
  const emphasisScale = (values.emphasisScale as number) ?? 1.7;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1600;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const keywordsLine =
    typeof values.captions !== "string" ||
    values.captions.trim() === CAPTION_FIXTURE_TEXT
      ? `      keywords={[${PREVIEW_KEYWORDS.map((k) => `"${k}"`).join(", ")}]}\n`
      : "";
  const extra = [
    emphasisScale !== 1.7 ? `      emphasisScale={${emphasisScale}}` : null,
    combine !== 1600
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionStack } from "@/components/remocn/caption-stack";
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
    <CaptionStack
      captions={captions}
${keywordsLine}      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      emphasisColor="${emphasisColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
