import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const duotoneBeatConfig: ComponentConfig = {
  componentName: "DuotoneBeat",
  importPath: "@/components/remocn/duotone-beat",
  controls: {
    beatFrames: {
      type: "number",
      default: 15,
      min: 4,
      max: 30,
      step: 1,
      description: "Frames per beat",
      hiddenFromList: false,
    },
    beatsPerBar: {
      type: "number",
      default: 4,
      min: 1,
      max: 8,
      step: 1,
      description: "Beats per bar",
      hiddenFromList: false,
    },
    punch: {
      type: "number",
      default: 0.07,
      min: 0,
      max: 0.2,
      step: 0.01,
      description: "Punch",
      hiddenFromList: false,
    },
    halftone: {
      type: "number",
      default: 8,
      min: 0,
      max: 20,
      step: 1,
      description: "Halftone pitch",
      hiddenFromList: false,
    },
    showIndicator: {
      type: "boolean",
      default: true,
      description: "Bar indicator",
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#FFFFFF" },
};
