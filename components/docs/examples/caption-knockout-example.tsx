"use client";

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionKnockout } from "@/registry/remocn/caption-knockout";

interface CaptionKnockoutExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  plateColor?: string;
  upcomingOpacity?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
}

const STRIPE_PX = 36;
const STRIPE_PERIOD_X = (STRIPE_PX * 2) / Math.cos((25 * Math.PI) / 180);

export function CaptionKnockoutExampleScene({
  captions,
  fontSize,
  fontWeight,
  plateColor,
  upcomingOpacity,
  combineTokensWithinMilliseconds,
  holdMs,
}: CaptionKnockoutExampleProps) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -STRIPE_PERIOD_X,
          backgroundImage: `repeating-linear-gradient(115deg, #262626 0px, #262626 ${STRIPE_PX}px, #525252 ${STRIPE_PX}px, #525252 ${STRIPE_PX * 2}px)`,
          transform: `translateX(${(frame * 1.5) % STRIPE_PERIOD_X}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: height * 0.1,
          paddingInline: width * 0.1,
        }}
      >
        <CaptionKnockout
          captions={previewCaptions(captions)}
          fontSize={fontSize}
          fontWeight={fontWeight}
          plateColor={plateColor}
          upcomingOpacity={upcomingOpacity}
          combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
          holdMs={holdMs}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const captionKnockoutExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const plateColor = (values.plateColor as string) ?? "#ffffff";
  const upcomingOpacity = (values.upcomingOpacity as number) ?? 0.15;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const extra = [
    upcomingOpacity !== 0.15
      ? `      upcomingOpacity={${upcomingOpacity}}`
      : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionKnockout } from "@/components/remocn/caption-knockout";
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
    <CaptionKnockout
      captions={captions}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      plateColor="${plateColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
