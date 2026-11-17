import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const titleConvergeConfig: ComponentConfig = {
  componentName: "TitleConverge",
  importPath: "@/components/remocn/title-converge",
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
    word: {
      type: "text-content",
      default: "remocn",
      description: "Word",
    },
    converge: {
      type: "number",
      default: 128,
      min: 60,
      max: 160,
      step: 1,
      description: "Converge (frames)",
      hiddenFromList: false,
    },
    zoom: {
      type: "number",
      default: 5,
      min: 1,
      max: 8,
      step: 0.5,
      description: "Start zoom",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ grain: true }),
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
  durationInFrames: 175,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
