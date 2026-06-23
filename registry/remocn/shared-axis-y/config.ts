import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const sharedAxisYConfig: ComponentConfig = {
  componentName: "SharedAxisY",
  importPath: "@/components/remocn/shared-axis-y",
  controls: {
    fromText: { type: "text", default: "Layered navigation.", label: "From text" },
    toText: { type: "text", default: "Hierarchy made clear.", label: "To text" },
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
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#ffffff" },
};
