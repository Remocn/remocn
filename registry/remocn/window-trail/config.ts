import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const windowTrailConfig: ComponentConfig = {
  componentName: "WindowTrail",
  importPath: "@/components/remocn/window-trail",
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
    from: {
      type: "text-content",
      default: "Old look.",
      description: "From",
    },
    text: {
      type: "text-content",
      default: "New look, same product.",
      description: "Text",
    },
    tagline: {
      type: "text-content",
      default: "Repainted in one render.",
      description: "Tagline",
    },
    slide: {
      type: "number",
      default: 30,
      min: 8,
      max: 60,
      step: 1,
      description: "Slide in (frames)",
      hiddenFromList: false,
    },
    tail: {
      type: "number",
      default: 4,
      min: 0,
      max: 10,
      step: 1,
      description: "Trail copies",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#FF4F00",
      description: "Accent",
    },
    ...sceneControls({ font: "Familjen Grotesk" }),
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
