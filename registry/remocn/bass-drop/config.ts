import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const bassDropConfig: ComponentConfig = {
  componentName: "BassDrop",
  importPath: "@/components/remocn/bass-drop",
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
    build: {
      type: "text-content",
      default: "THIS FALL",
      description: "Build",
    },
    title: {
      type: "text-content",
      default: "",
      description: "Title (empty shows the logo)",
    },
    buildLength: {
      type: "number",
      default: 66,
      min: 30,
      max: 120,
      step: 1,
      description: "Build length (frames)",
      hiddenFromList: false,
    },
    flash: {
      type: "boolean",
      default: true,
      description: "Flash frame",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Serif" }),
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
