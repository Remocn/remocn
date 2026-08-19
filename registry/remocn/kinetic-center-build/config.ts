import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const kineticCenterBuildConfig: ComponentConfig = {
  componentName: "KineticCenterBuild",
  importPath: "@/components/remocn/kinetic-center-build",
  controls: {
    text: {
      type: "text-content",
      default: "Words push left.",
      description: "Text",
    },
    entryOffset: {
      type: "number",
      min: 20,
      max: 160,
      step: 1,
      default: 88,
      description: "Entry offset",
      hiddenFromList: false,
    },
    fontSize: {
      type: "number",
      min: 12,
      max: 160,
      step: 1,
      default: 72,
      description: "Font size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    fontWeight: {
      type: "enum",
      default: "600",
      variants: {
        "400": {},
        "500": {},
        "600": {},
        "700": {},
      },
      description: "Font weight",
    },
  },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
