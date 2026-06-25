import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const kineticCenterBuildConfig: ComponentConfig = {
  componentName: "KineticCenterBuild",
  importPath: "@/components/remocn/kinetic-center-build",
  controls: {
    text: { type: "text", default: "Words push left.", label: "Text" },
    entryOffset: {
      type: "number",
      default: 88,
      min: 20,
      max: 160,
      step: 1,
      label: "Entry offset",
    },
    fontSize: {
      type: "number",
      default: 72,
      min: 12,
      max: 160,
      step: 1,
      label: "Font size",
    },
    color: { type: "color", default: "#171717", label: "Color" },
    fontWeight: {
      type: "select",
      default: "600",
      options: FONT_WEIGHT_OPTIONS,
      label: "Font weight",
    },
  },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
