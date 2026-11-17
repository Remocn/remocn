import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const soldOutConfig: ComponentConfig = {
  componentName: "SoldOut",
  importPath: "@/components/remocn/sold-out",
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
    unit: {
      type: "text-content",
      default: "LEFT",
      description: "Unit",
    },
    warning: {
      type: "text-content",
      default: "LOW STOCK",
      description: "Warning",
    },
    stamp: {
      type: "text-content",
      default: "SOLD OUT",
      description: "Stamp",
    },
    lead: {
      type: "text-content",
      default: "Restocking:",
      description: "Lead",
    },
    tail: {
      type: "text-content",
      default: "every launch.",
      description: "Tail",
    },
    stock: {
      type: "number",
      default: 128,
      min: 0,
      max: 384,
      step: 1,
      description: "Stock",
      hiddenFromList: false,
    },
    hold: {
      type: "number",
      default: 6,
      min: 0,
      max: 30,
      step: 1,
      description: "Zero hold (frames)",
      hiddenFromList: false,
    },
    angle: {
      type: "number",
      default: -11,
      min: -30,
      max: 30,
      step: 1,
      description: "Band angle",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Archivo" }),
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
  durationInFrames: 155,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
