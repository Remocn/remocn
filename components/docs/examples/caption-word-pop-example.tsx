"use client";

import { AbsoluteFill } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionWordPop } from "@/registry/remocn/caption-word-pop";

interface CaptionWordPopExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  popScale?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionWordPopExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  popScale,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionWordPopExampleProps) {
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <CaptionWordPop
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        popScale={popScale}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionWordPopExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 96;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const popScale = (values.popScale as number) ?? 0.6;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 0;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    popScale !== 0.6 ? `      popScale={${popScale}}` : null,
    combine !== 0 ? `      combineTokensWithinMilliseconds={${combine}}` : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionWordPop } from "@/components/remocn/caption-word-pop";
import captions from "./captions.json";

export const MyScene = () => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
    <CaptionWordPop
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
