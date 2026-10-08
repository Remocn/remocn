"use client";

import { AbsoluteFill, useVideoConfig } from "remotion";
import { captionsFromText } from "@/components/docs/examples/caption-fixture";
import type { SpeakerCaption } from "@/lib/remocn/caption-core";
import { CaptionSpeaker } from "@/registry/remocn/caption-speaker";

const line = (
  speaker: string,
  text: string,
  startMs: number,
  endMs: number,
): SpeakerCaption => ({
  text,
  startMs,
  endMs,
  timestampMs: Math.round((startMs + endMs) / 2),
  confidence: 0.96,
  speaker,
});

export const CAPTION_DIALOGUE_FIXTURE: SpeakerCaption[] = [
  line("host", " So", 300, 460),
  line("host", " what", 460, 640),
  line("host", " made", 640, 860),
  line("host", " you", 860, 980),
  line("host", " add", 980, 1180),
  line("host", " captions?", 1180, 1800),
  line("guest", " Most", 2300, 2560),
  line("guest", " people", 2560, 2900),
  line("guest", " watch", 2900, 3160),
  line("guest", " with", 3160, 3280),
  line("guest", " the", 3280, 3380),
  line("guest", " sound", 3380, 3720),
  line("guest", " off.", 3720, 4240),
  line("host", " Really?", 4800, 5400),
  line("guest", " Almost", 5800, 6140),
  line("guest", " everyone.", 6140, 6760),
  line("guest", " Captions", 7000, 7480),
  line("guest", " keep", 7480, 7700),
  line("guest", " them", 7700, 7860),
  line("guest", " watching.", 7860, 8400),
];

const DIALOGUE_TEXT = CAPTION_DIALOGUE_FIXTURE.map((c) => c.text.trim()).join(
  " ",
);

function alternateSpeakers(text: string): SpeakerCaption[] {
  let speaker = "host";
  return captionsFromText(text).map((caption) => {
    const current = { ...caption, speaker };
    if (/[.!?]$/.test(caption.text.trim())) {
      speaker = speaker === "host" ? "guest" : "host";
    }
    return current;
  });
}

export function speakerPreviewCaptions(
  text: string | undefined,
): SpeakerCaption[] {
  if (text === undefined || text.trim() === DIALOGUE_TEXT) {
    return CAPTION_DIALOGUE_FIXTURE;
  }
  return alternateSpeakers(text);
}

export function speakerPreviewDuration(
  text: string | undefined,
  fps: number,
  tailMs = 1000,
): number {
  const captions = speakerPreviewCaptions(text);
  const last = captions[captions.length - 1];
  const endMs = (last ? last.endMs : 0) + tailMs;
  return Math.max(fps, Math.ceil((endMs / 1000) * fps));
}

interface CaptionSpeakerExampleProps {
  captions?: string;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  upcomingOpacity?: number;
  combineTokensWithinMilliseconds?: number;
  holdMs?: number;
  shadow?: boolean;
}

export function CaptionSpeakerExampleScene({
  captions,
  fontSize,
  fontWeight,
  color,
  upcomingOpacity,
  combineTokensWithinMilliseconds,
  holdMs,
  shadow,
}: CaptionSpeakerExampleProps) {
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
      <CaptionSpeaker
        captions={speakerPreviewCaptions(captions)}
        fontSize={fontSize}
        fontWeight={fontWeight}
        color={color}
        upcomingOpacity={upcomingOpacity}
        combineTokensWithinMilliseconds={combineTokensWithinMilliseconds}
        holdMs={holdMs}
        shadow={shadow}
      />
    </AbsoluteFill>
  );
}

export const captionSpeakerExampleCode = (
  values: Record<string, unknown>,
): string => {
  const fontSize = (values.fontSize as number) ?? 64;
  const fontWeight = (values.fontWeight as number) ?? 800;
  const color = (values.color as string) ?? "#ffffff";
  const upcomingOpacity = (values.upcomingOpacity as number) ?? 0.4;
  const combine = (values.combineTokensWithinMilliseconds as number) ?? 1200;
  const holdMs = (values.holdMs as number) ?? 600;
  const shadow = (values.shadow as boolean) ?? true;
  const extra = [
    color !== "#ffffff" ? `      color="${color}"` : null,
    upcomingOpacity !== 0.4
      ? `      upcomingOpacity={${upcomingOpacity}}`
      : null,
    combine !== 1200
      ? `      combineTokensWithinMilliseconds={${combine}}`
      : null,
    holdMs !== 600 ? `      holdMs={${holdMs}}` : null,
    shadow ? null : "      shadow={false}",
  ].filter(Boolean);
  return `import { AbsoluteFill } from "remotion";
import { CaptionSpeaker } from "@/components/remocn/caption-speaker";
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
    <CaptionSpeaker
      captions={captions}
      speakerColors={{ host: "#facc15", guest: "#38bdf8" }}
      fontSize={${fontSize}}
      fontWeight={${fontWeight}}
${extra.length > 0 ? `${extra.join("\n")}\n` : ""}    />
  </AbsoluteFill>
);`;
};
