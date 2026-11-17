import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const reelsFeedConfig: ComponentConfig = {
  componentName: "ReelsFeed",
  importPath: "@/components/remocn/reels-feed",
  lists: {
    lines: {
      default: [
        "Your launch, in their stories.",
        "Ask the room before you ship.",
        "12.5K likes by lunch.",
      ],
      description: "Lines",
      min: 3,
      max: 3,
    },
    pollOptions: {
      default: ["Yes, this week", "Not yet"],
      description: "Poll options",
      min: 2,
      max: 2,
    },
    likes: {
      default: ["12.4K", "12.5K"],
      description: "Likes (before, after)",
      min: 2,
      max: 2,
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
    account: {
      type: "text-content",
      default: "remocn",
      description: "Account",
    },
    pollQuestion: {
      type: "text-content",
      default: "Shipping a launch video this week?",
      description: "Poll question",
    },
    postCaption: {
      type: "text-content",
      default: "Our launch film is out. Cut it in an afternoon with remocn",
      description: "Post caption",
    },
    reelCaption: {
      type: "text-content",
      default: "v2 is live. 200+ components for launch videos",
      description: "Reel caption",
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
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
