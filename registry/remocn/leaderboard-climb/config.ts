import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const leaderboardClimbConfig: ComponentConfig = {
  componentName: "LeaderboardClimb",
  importPath: "@/components/remocn/leaderboard-climb",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Top launches",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Today · Launch league",
      description: "Subtitle",
    },
    toRank: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "To rank",
      hiddenFromList: false,
    },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
