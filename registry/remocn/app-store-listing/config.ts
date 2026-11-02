import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const appStoreListingConfig: ComponentConfig = {
  componentName: "AppStoreListing",
  importPath: "@/components/remocn/app-store-listing",
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
    appName: {
      type: "text-content",
      default: "remocn",
      description: "App name",
    },
    subtitle: {
      type: "text-content",
      default: "Launch videos, written in React",
      description: "Subtitle",
    },
    developer: {
      type: "text-content",
      default: "remocn Labs",
      description: "Developer",
    },
    ratingCount: {
      type: "text-content",
      default: "12K",
      description: "Rating count",
    },
    ageRating: {
      type: "text-content",
      default: "4+",
      description: "Age rating",
    },
    category: {
      type: "text-content",
      default: "Developer Tools",
      description: "Category",
    },
    rating: {
      type: "number",
      default: 4.8,
      min: 0,
      max: 14.4,
      step: 0.01,
      description: "Rating",
      hiddenFromList: false,
    },
    chartRank: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Chart rank",
      hiddenFromList: false,
    },
  },
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
