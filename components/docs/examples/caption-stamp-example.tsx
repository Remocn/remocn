"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import {
  CAPTION_FIXTURE_TEXT,
  previewCaptions,
} from "@/components/docs/examples/caption-fixture";
import { CaptionStamp } from "@/registry/remocn/caption-stamp";

const PREVIEW_KEYWORDS = ["thing", "lose", "three", "captions", "sound"];

interface CaptionStampExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  stampColor?: string;
  texture?: boolean;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionStampExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  stampColor,
  texture,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionStampExampleProps) {
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
      <CaptionStamp
        captions={previewCaptions(captions)}
        keywords={
          captions === undefined || captions.trim() === CAPTION_FIXTURE_TEXT
            ? PREVIEW_KEYWORDS
            : undefined
        }
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        stampColor={stampColor}
        texture={texture}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionStampExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const stampColor = (values.stampColor as string) ?? "#ef4444";
  const texture = (values.texture as boolean) ?? true;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const keywordsLine =
    typeof values.captions !== "string" ||
    values.captions.trim() === CAPTION_FIXTURE_TEXT
      ? `      keywords={[${PREVIEW_KEYWORDS.map((k) => `"${k}"`).join(", ")}]}\n`
      : "";
  const extra = [
    texture ? null : "      texture={false}",
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionStamp } from "@/components/remocn/caption-stamp";
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
    <CaptionStamp
      captions={captions}
${keywordsLine}      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      stampColor="${stampColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
