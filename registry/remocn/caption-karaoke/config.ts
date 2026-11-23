import {
  CAPTION_FIXTURE,
  previewCaptionsDuration,
  previewTailMs,
} from "@/components/docs/examples/caption-fixture";
import { captionKaraokeExampleCode } from "@/components/docs/examples/caption-karaoke-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { captionKaraokeSchema } from "./index";

export const captionKaraokeConfig: ComponentConfig = {
  componentName: "CaptionKaraoke",
  importPath: "@/components/remocn/caption-karaoke",
  controls: {
    ...captionKaraokeSchema,
    captions: {
      ...captionKaraokeSchema.captions,
      default: CAPTION_FIXTURE,
      description: "Transcript",
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
  snippet: captionKaraokeExampleCode,
};
