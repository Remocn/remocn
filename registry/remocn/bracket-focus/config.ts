import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const bracketFocusConfig: ComponentConfig = {
  componentName: "BracketFocus",
  importPath: "@/components/remocn/bracket-focus",
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
    subject: {
      type: "text-content",
      default: "1.8s",
      description: "Subject",
    },
    tag: {
      type: "text-content",
      default: "Render time",
      description: "Tag",
    },
    fontWeight: {
      type: "number",
      default: 500,
      min: 100,
      max: 900,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    fly: {
      type: "number",
      default: 22,
      min: 6,
      max: 60,
      step: 1,
      description: "Fly-in (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Geist", ink: false, grain: true }),
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
