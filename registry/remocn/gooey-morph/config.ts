import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const gooeyMorphConfig: ComponentConfig = {
  componentName: "GooeyMorph",
  importPath: "@/components/remocn/gooey-morph",
  controls: {
    word: {
      type: "text-content",
      default: "HELLO",
      description: "Word",
    },
    fill: {
      type: "color",
      default: "#f2f2f2",
      description: "Fill",
    },
    fontFamily: {
      type: "text-content",
      default: "'Bodoni Moda', Georgia, serif",
      description: "Font family",
    },
    blurRadius: {
      type: "number",
      min: 0,
      max: 20,
      step: 1,
      default: 6,
      description: "Goo blur radius",
      hiddenFromList: false,
    },
    displaceAmount: {
      type: "number",
      min: 0,
      max: 80,
      step: 1,
      default: 20,
      description: "Displace amount",
      hiddenFromList: false,
    },
    barTravelFrames: {
      type: "number",
      min: 10,
      max: 60,
      step: 1,
      default: 30,
      description: "Bar travel (frames)",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#141318" },
};
