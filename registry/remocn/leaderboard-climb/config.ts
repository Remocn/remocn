import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    productLabel: {
      type: "text-content",
      default: "PRODUCT",
      description: "Product column",
    },
    scoreLabel: {
      type: "text-content",
      default: "UPVOTES",
      description: "Score column",
    },
    gainLabel: {
      type: "text-content",
      default: "today",
      description: "Badge word",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Onest" }),
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
