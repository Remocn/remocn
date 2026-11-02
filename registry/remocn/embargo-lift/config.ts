import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const embargoLiftConfig: ComponentConfig = {
  componentName: "EmbargoLift",
  importPath: "@/components/remocn/embargo-lift",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    slug: {
      type: "text-content",
      default: "Embargoed until 9:00 a.m.",
      description: "Slug",
    },
    liftedSlug: {
      type: "text-content",
      default: "Embargo lifted, 9:00 a.m.",
      description: "Lifted slug",
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
