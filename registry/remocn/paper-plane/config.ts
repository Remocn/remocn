import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const paperPlaneConfig: ComponentConfig = {
  componentName: "PaperPlane",
  importPath: "@/components/remocn/paper-plane",
  lists: {
    steps: {
      default: ["Write", "Render", "Launch"],
      description: "Steps",
      min: 3,
      max: 3,
    },
  },
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    url: {
      type: "text-content",
      default: "remocn.dev",
      description: "Url",
    },
    land: {
      type: "number",
      default: 184,
      min: 90,
      max: 300,
      step: 2,
      description: "Landing (frame)",
      hiddenFromList: false,
    },
    trail: {
      type: "boolean",
      default: true,
      description: "Trail",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Fraunces", grain: true }),
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
  durationInFrames: 220,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
