import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const graphRelayoutConfig: ComponentConfig = {
  componentName: "GraphRelayout",
  importPath: "@/components/remocn/graph-relayout",
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
    kicker: {
      type: "text-content",
      default: "Use case",
      description: "Kicker",
    },
    cursorName: {
      type: "text-content",
      default: "Mia",
      description: "Cursor name",
    },
    hold: {
      type: "number",
      default: 36,
      min: 0,
      max: 72,
      step: 2,
      description: "First hold (frames)",
      hiddenFromList: false,
    },
    dots: {
      type: "boolean",
      default: true,
      description: "Dot grid",
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 158,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
