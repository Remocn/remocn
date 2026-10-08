"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { previewCaptions } from "@/components/docs/examples/caption-fixture";
import { CaptionTimeline } from "@/registry/remocn/caption-timeline";

interface CaptionTimelineExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  playheadColor?: string;
  width?: number;
  pxPerSecond?: number;
  playheadPosition?: number;
  upcomingOpacity?: number;
  shadow?: boolean;
}

export function CaptionTimelineExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  playheadColor,
  width,
  pxPerSecond,
  playheadPosition,
  upcomingOpacity,
  shadow,
}: CaptionTimelineExampleProps) {
  const { height } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: height * 0.1,
      }}
    >
      <CaptionTimeline
        captions={previewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        playheadColor={playheadColor}
        width={width}
        pxPerSecond={pxPerSecond}
        playheadPosition={playheadPosition}
        upcomingOpacity={upcomingOpacity}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionTimelineExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const playheadColor = (values.playheadColor as string) ?? "#facc15";
  const width = (values.width as number) ?? 1100;
  const pxPerSecond = (values.pxPerSecond as number) ?? 260;
  const playheadPosition = (values.playheadPosition as number) ?? 0.35;
  const upcomingOpacity = (values.upcomingOpacity as number) ?? 0.4;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    pxPerSecond !== 260 ? `      pxPerSecond={${pxPerSecond}}` : null,
    playheadPosition !== 0.35
      ? `      playheadPosition={${playheadPosition}}`
      : null,
    upcomingOpacity !== 0.4
      ? `      upcomingOpacity={${upcomingOpacity}}`
      : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionTimeline } from "@/components/remocn/caption-timeline";
import captions from "./captions.json";

export const MyScene = () => (
  <AbsoluteFill
    style={{
      justifyContent: "flex-end",
      alignItems: "center",
      paddingBottom: 108,
    }}
  >
    <CaptionTimeline
      captions={captions}
      width={${width}}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
      color="${color}"
      playheadColor="${playheadColor}"
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
