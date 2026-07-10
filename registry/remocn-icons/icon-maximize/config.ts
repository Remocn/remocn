import { type ComponentConfig, FPS } from "@/lib/customizer-config";

export const iconMaximizeConfig: ComponentConfig = {
  componentName: "MaximizeIcon",
  importPath: "@/components/remocn/icon-maximize",
  controls: {
    animation: {
      type: "select",
      default: "both",
      options: ["draw", "action", "both"],
      label: "Animation",
    },
    loop: {
      type: "boolean",
      default: false,
      label: "Loop",
    },
    size: {
      type: "number",
      default: 48,
      min: 24,
      max: 200,
      step: 4,
      label: "Size",
    },
    color: {
      type: "color",
      default: "#171717",
      label: "Color",
    },
    strokeWidth: {
      type: "number",
      default: 2,
      min: 1,
      max: 3,
      step: 0.25,
      label: "Stroke width",
    },
  },
  durationInFrames: 70,
  fps: FPS,
  compositionWidth: 48,
  compositionHeight: 48,
};
