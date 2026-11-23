import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const flipStingConfig: ComponentConfig = {
  componentName: "FlipSting",
  importPath: "@/components/remocn/flip-sting",
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
    line: {
      type: "text-content",
      default: "LAUNCH FILMS",
      description: "Line",
    },
    pull: {
      type: "number",
      default: 68,
      min: 20,
      max: 120,
      step: 1,
      description: "Pull-out (frames)",
      hiddenFromList: false,
    },
    zoomFrom: {
      type: "number",
      default: 3.6,
      min: 1,
      max: 8,
      step: 0.2,
      description: "Start zoom",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist Mono" }),
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
