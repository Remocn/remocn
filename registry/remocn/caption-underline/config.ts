import {
  CAPTION_FIXTURE,
  previewCaptionsDuration,
  previewTailMs,
} from "@/components/docs/examples/caption-fixture";
import { captionUnderlineExampleCode } from "@/components/docs/examples/caption-underline-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const captionUnderlineConfig: ComponentConfig = {
  componentName: "CaptionUnderline",
  importPath: "@/components/remocn/caption-underline",
  controls: {
    captions: {
      type: "remotion-captions",
      default: CAPTION_FIXTURE,
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
    color: {
      type: "color",
      default: "#ffffff",
      description: "Text color",
    },
    underlineColor: {
      type: "color",
      default: "#facc15",
      description: "Underline color",
    },
    thickness: {
      type: "number",
      min: 0.02,
      max: 0.3,
      step: 0.01,
      default: 0.08,
      description: "Thickness (em)",
      hiddenFromList: false,
    },
    underlineOffset: {
      type: "number",
      min: -0.2,
      max: 0.4,
      step: 0.01,
      default: 0.02,
      description: "Offset (em)",
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
  snippet: captionUnderlineExampleCode,
};
