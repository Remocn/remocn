"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionEmoji } from "@/registry/remocn/caption-emoji";

export const CAPTION_EMOJI_PREVIEW_MAP: Record<string, string> = {
  thing: "👀",
  lose: "📉",
  three: "⏱️",
  captions: "💬",
  sound: "🔇",
};

interface CaptionEmojiExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  emojiSize?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionEmojiExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  emojiSize,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionEmojiExampleProps) {
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
      <CaptionEmoji
        captions={previewCaptions(captions)}
        emoji={CAPTION_EMOJI_PREVIEW_MAP}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        emojiSize={emojiSize}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionEmojiExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const emojiSize = (values.emojiSize as number) ?? 0.9;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    emojiSize !== 0.9 ? `      emojiSize={${emojiSize}}` : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  const map = Object.entries(CAPTION_EMOJI_PREVIEW_MAP)
    .map(([word, glyph]) => `  ${word}: "${glyph}",`)
    .join("\n");
  return `import { AbsoluteFill } from "remotion";
import { CaptionEmoji } from "@/components/remocn/caption-emoji";
import captions from "./captions.json";

const emoji = {
${map}
};

export const MyScene = () => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 108,
      paddingInline: 192,
    }}
  >
    <CaptionEmoji
      captions={captions}
      emoji={emoji}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
