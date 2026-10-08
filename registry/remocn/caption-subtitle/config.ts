import {
  CAPTION_FIXTURE,
  previewCaptionsDuration,
  previewTailMs,
} from "@/components/docs/examples/caption-fixture";
import { captionSubtitleExampleCode } from "@/components/docs/examples/caption-subtitle-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const captionSubtitleConfig: ComponentConfig = {
  componentName: "CaptionSubtitle",
  importPath: "@/components/remocn/caption-subtitle",
  controls: {
    captions: {
      type: "remotion-captions",
      default: CAPTION_FIXTURE,
      description: "Transcript",
      keyframable: false,
    },
    fontSize: {
      type: "number",
      min: 16,
      max: 100,
      step: 1,
      default: 44,
      description: "Font size",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      min: 400,
      max: 900,
      step: 100,
      default: 600,
      description: "Font weight",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#ffffff",
      description: "Text color",
    },
    combineTokensWithinMilliseconds: {
      type: "number",
      min: 0,
      max: 6000,
      step: 100,
      default: 2500,
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
    box: {
      type: "boolean",
      default: true,
      description: "Box",
    },
    boxColor: {
      type: "color",
      default: "#000000",
      description: "Box color",
    },
    boxOpacity: {
      type: "number",
      min: 0,
      max: 1,
      step: 0.02,
      default: 0.72,
      description: "Box opacity",
      hiddenFromList: false,
    },
  },
  durationInFrames: previewCaptionsDuration(undefined, FPS),
  getDurationInFrames: (values) =>
    previewCaptionsDuration(
      typeof values.captions === "string" ? values.captions : undefined,
      FPS,
      previewTailMs(values.holdMs),
    ),
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#262626" },
  snippet: captionSubtitleExampleCode,
};
