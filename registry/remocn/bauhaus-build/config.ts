import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";
import { getBauhausBuildDuration } from ".";

export const bauhausBuildConfig: ComponentConfig = {
  componentName: "BauhausBuild",
  importPath: "@/components/remocn/bauhaus-build",
  controls: {
    scale: {
      type: "number",
      default: 1,
      min: 0.5,
      max: 1.25,
      step: 0.05,
      description: "Scale",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 1,
      min: 1,
      max: 24,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    inkColor: { type: "color", default: "#1c1a17", description: "Ink" },
    accentColor: {
      type: "color",
      default: "#e4572e",
      description: "Accent",
    },
    secondaryColor: {
      type: "color",
      default: "#cbbc9f",
      description: "Secondary",
    },
    tertiaryColor: {
      type: "color",
      default: "#7e776b",
      description: "Tertiary",
    },
    loop: { type: "boolean", default: false, description: "Loop animation" },
  },
  durationInFrames: 150,
  getDurationInFrames: (values) => getBauhausBuildDuration(values),
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#f1eee7" },
};
