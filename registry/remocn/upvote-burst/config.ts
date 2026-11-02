import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const upvoteBurstConfig: ComponentConfig = {
  componentName: "UpvoteBurst",
  importPath: "@/components/remocn/upvote-burst",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Top products launching today",
      description: "Title",
    },
    dateLabel: {
      type: "text-content",
      default: "Thu, Oct 23",
      description: "Date label",
    },
    badgeLabel: {
      type: "text-content",
      default: "Product of the day",
      description: "Badge label",
    },
    startRank: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Start rank",
      hiddenFromList: false,
    },
    startVotes: {
      type: "number",
      default: 412,
      min: 0,
      max: 1236,
      step: 1,
      description: "Start votes",
      hiddenFromList: false,
    },
    endVotes: {
      type: "number",
      default: 1342,
      min: 0,
      max: 4026,
      step: 1,
      description: "End votes",
      hiddenFromList: false,
    },
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
  durationInFrames: 135,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
