import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const bugDockConfig: ComponentConfig = {
  componentName: "BugDock",
  importPath: "@/components/remocn/bug-dock",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    headline: {
      type: "text-content",
      default: "Playing on every screen you ship.",
      description: "Headline",
    },
    highlight: {
      type: "text-content",
      default: "every screen",
      description: "Highlight",
    },
    tuckAt: {
      type: "number",
      default: 34,
      min: 10,
      max: 80,
      step: 1,
      description: "Tuck at (frame)",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 2.5,
      min: 0,
      max: 10,
      step: 0.5,
      description: "Word stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Urbanist" }),
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
