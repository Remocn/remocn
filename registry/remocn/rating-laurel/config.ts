import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const ratingLaurelConfig: ComponentConfig = {
  componentName: "RatingLaurel",
  importPath: "@/components/remocn/rating-laurel",
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
      default: "Loved by builders",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default:
        "remocn is in the **top 5%** of launch tools, based on ratings, reviews, and reliability",
      description: "Subtitle",
    },
    device: {
      type: "enum",
      default: "web",
      variants: {
        web: {},
        phone: {},
      },
      description: "Device",
    },
    rating: {
      type: "number",
      default: 4.96,
      min: 0,
      max: 14.88,
      step: 0.01,
      description: "Rating",
      hiddenFromList: false,
    },
    reviewCount: {
      type: "number",
      default: 298,
      min: 0,
      max: 894,
      step: 1,
      description: "Review count",
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
  durationInFrames: 270,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
