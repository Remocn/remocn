import {
  CAPTION_FIXTURE,
  previewCaptionsDuration,
  previewTailMs,
} from "@/components/docs/examples/caption-fixture";
import { captionStackExampleCode } from "@/components/docs/examples/caption-stack-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const captionStackConfig: ComponentConfig = {
  componentName: "CaptionStack",
  importPath: "@/components/remocn/caption-stack",
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
    emphasisColor: {
      type: "color",
      default: "#facc15",
      description: "Emphasis color",
    },
    emphasisScale: {
      type: "number",
      min: 1,
      max: 2.5,
      step: 0.05,
      default: 1.7,
      description: "Emphasis scale",
      hiddenFromList: false,
    },
    combineTokensWithinMilliseconds: {
      type: "number",
      min: 0,
      max: 3000,
      step: 100,
      default: 1600,
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
  snippet: captionStackExampleCode,
};
