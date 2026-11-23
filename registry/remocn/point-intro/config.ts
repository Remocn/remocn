import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const pointIntroConfig: ComponentConfig = {
  componentName: "PointIntro",
  importPath: "@/components/remocn/point-intro",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Introducing remocn 2.0",
      description: "Title",
    },
    subline: {
      type: "text-content",
      default: "Animated components for Remotion. Free and open source.",
      description: "Subline",
    },
    stagger: {
      type: "number",
      default: 13,
      min: 4,
      max: 30,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    soloScale: {
      type: "number",
      default: 2.1,
      min: 1,
      max: 4,
      step: 0.1,
      description: "Solo point size",
      hiddenFromList: false,
    },
    ...sceneControls({ font: "Figtree" }),
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
  durationInFrames: 210,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
