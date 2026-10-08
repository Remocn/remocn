import { previewTailMs } from "@/components/docs/examples/caption-fixture";
import {
  CAPTION_DIALOGUE_FIXTURE,
  captionSpeakerExampleCode,
  speakerPreviewDuration,
} from "@/components/docs/examples/caption-speaker-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const captionSpeakerConfig: ComponentConfig = {
  componentName: "CaptionSpeaker",
  importPath: "@/components/remocn/caption-speaker",
  controls: {
    captions: {
      type: "remotion-captions",
      default: CAPTION_DIALOGUE_FIXTURE,
      description: "Transcript",
      keyframable: false,
    },
    fontSize: {
      type: "number",
      min: 24,
      max: 140,
      step: 1,
      default: 64,
      description: "Font size",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      min: 400,
      max: 900,
      step: 100,
      default: 800,
      description: "Font weight",
      hiddenFromList: false,
    },
    upcomingOpacity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.4,
      description: "Upcoming opacity",
      hiddenFromList: false,
    },
    combineTokensWithinMilliseconds: {
      type: "number",
      min: 0,
      max: 3000,
      step: 100,
      default: 1200,
      description: "Page window (ms)",
      hiddenFromList: false,
    },
    holdMs: {
      type: "number",
      min: 0,
      max: 2000,
      step: 50,
      default: 600,
      description: "Hold (ms)",
      hiddenFromList: false,
    },
    shadow: {
      type: "boolean",
      default: true,
      description: "Shadow",
    },
  },
  durationInFrames: speakerPreviewDuration(undefined, FPS),
  getDurationInFrames: (values) =>
    speakerPreviewDuration(
      typeof values.captions === "string" ? values.captions : undefined,
      FPS,
      previewTailMs(values.holdMs),
    ),
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#262626" },
  snippet: captionSpeakerExampleCode,
};
