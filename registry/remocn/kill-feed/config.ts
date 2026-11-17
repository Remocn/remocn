import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const killFeedConfig: ComponentConfig = {
  componentName: "KillFeed",
  importPath: "@/components/remocn/kill-feed",
  lists: {
    kills: {
      default: [
        "Manual keyframes",
        "Render queue",
        "Agency invoice",
        "Stock templates",
        "Export presets",
      ],
      description: "Kills",
    },
    callouts: {
      default: ["First blood", "Double kill", "Triple kill", "Quadra kill"],
      description: "Callouts",
    },
  },
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
    banner: {
      type: "text-content",
      default: "Penta ship",
      description: "Banner",
    },
    caption: {
      type: "text-content",
      default: "5 / 5 eliminated",
      description: "Caption",
    },
    streakLabel: {
      type: "text-content",
      default: "Streak",
      description: "Streak label",
    },
    shake: {
      type: "number",
      default: 1,
      min: 0,
      max: 2,
      step: 0.1,
      description: "Shake",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Chakra Petch" }),
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
  durationInFrames: 105,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
