import {
  CAPTION_FIXTURE,
  previewCaptionsDuration,
  previewTailMs,
} from "@/components/docs/examples/caption-fixture";
import { captionTimelineExampleCode } from "@/components/docs/examples/caption-timeline-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const captionTimelineConfig: ComponentConfig = {
  componentName: "CaptionTimeline",
  importPath: "@/components/remocn/caption-timeline",
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
    playheadColor: {
      type: "color",
      default: "#facc15",
      description: "Playhead color",
    },
    width: {
      type: "number",
      min: 400,
      max: 1800,
      step: 10,
      default: 1100,
      description: "Strip width (px)",
      hiddenFromList: false,
    },
    pxPerSecond: {
      type: "number",
      min: 100,
      max: 600,
      step: 10,
      default: 260,
      description: "Pixels per second",
      hiddenFromList: false,
    },
    playheadPosition: {
      type: "number",
      min: 0.1,
      max: 0.9,
      step: 0.05,
      default: 0.35,
      description: "Playhead position",
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
  snippet: captionTimelineExampleCode,
};
