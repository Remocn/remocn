import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const playOfTheGameConfig: ComponentConfig = {
  componentName: "PlayOfTheGame",
  importPath: "@/components/remocn/play-of-the-game",
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
    title: {
      type: "text-content",
      default: "Play of the game",
      description: "Title",
    },
    role: {
      type: "text-content",
      default: "Solo builder",
      description: "Role",
    },
    stat: {
      type: "text-content",
      default: "Shipped in 6 hours",
      description: "Stat",
    },
    highlight: {
      type: "text-content",
      default: "6 hours",
      description: "Highlight",
    },
    impact: {
      type: "number",
      default: 14,
      min: 0,
      max: 40,
      step: 1,
      description: "Impact shake",
      hiddenFromList: false,
    },
    badge: {
      type: "boolean",
      default: true,
      description: "Role badge",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Saira" }),
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
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
