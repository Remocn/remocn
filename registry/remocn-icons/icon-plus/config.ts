import { type ComponentConfig, FPS } from "@/lib/customizer-config";

export const iconPlusConfig: ComponentConfig = {
  componentName: "PlusIcon",
  importPath: "@/components/remocn/icon-plus",
  controls: {
    animation: {
      type: "enum",
      default: "both",
      variants: {
        draw: {},
        action: {},
        both: {},
      },
      description: "Animation",
    },
    loop: {
      type: "boolean",
      default: false,
      description: "Loop",
    },
    size: {
      type: "number",
      min: 24,
      max: 200,
      step: 4,
      default: 48,
      description: "Size",
      hiddenFromList: false,
    },
    color: {
      type: "color",
      default: "#171717",
      description: "Color",
    },
    strokeWidth: {
      type: "number",
      min: 1,
      max: 3,
      step: 0.25,
      default: 2,
      description: "Stroke width",
      hiddenFromList: false,
    },
  },
  durationInFrames: 60,
  fps: FPS,
  compositionWidth: 48,
  compositionHeight: 48,
};
