import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const yearInReviewConfig: ComponentConfig = {
  componentName: "YearInReview",
  importPath: "@/components/remocn/year-in-review",
  lists: {
    chapters: {
      default: ["Your year", "Shipped", "Top component", "Your rank", "Share"],
      description: "Chapters",
    },
  },
  controls: {
    device: {
      type: "enum",
      default: "phone",
      variants: {
        phone: {},
        card: {},
      },
      description: "Device",
    },
    rail: {
      type: "boolean",
      default: true,
      description: "Chapter rail",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Hanken Grotesk" }),
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
  durationInFrames: 480,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
