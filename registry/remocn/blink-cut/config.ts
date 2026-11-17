import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const blinkCutConfig: ComponentConfig = {
  componentName: "BlinkCut",
  importPath: "@/components/remocn/blink-cut",
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
    brand: {
      type: "text-content",
      default: "remocn",
      description: "Brand",
    },
    line: {
      type: "text-content",
      default: "Launch films, built in Remotion.",
      description: "Line",
    },
    framesPerWord: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Frames per word",
      hiddenFromList: false,
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 300,
      max: 800,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    drift: {
      type: "boolean",
      default: true,
      description: "Drift",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Bricolage Grotesque" }),
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
