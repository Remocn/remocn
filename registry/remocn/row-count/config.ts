import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rowCountConfig: ComponentConfig = {
  componentName: "RowCount",
  importPath: "@/components/remocn/row-count",
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
    prefix: {
      type: "text-content",
      default: "",
      description: "Prefix",
    },
    label: {
      type: "text-content",
      default: "frames rendered in every region, every night",
      description: "Label",
    },
    value: {
      type: "number",
      default: 27300000,
      min: 0,
      max: 81900000,
      step: 1,
      description: "Value",
      hiddenFromList: false,
    },
    from: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "From",
      hiddenFromList: false,
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
