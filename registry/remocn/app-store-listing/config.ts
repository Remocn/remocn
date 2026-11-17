import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const appStoreListingConfig: ComponentConfig = {
  componentName: "AppStoreListing",
  importPath: "@/components/remocn/app-store-listing",
  lists: {
    lines: {
      default: [
        "Now on the App Store.",
        "One tap to install.",
        "Every screen, previewed.",
        "Open it. Ship today.",
      ],
      description: "Lines",
      max: 4,
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
    getLabel: {
      type: "text-content",
      default: "Get",
      description: "Get label",
    },
    openLabel: {
      type: "text-content",
      default: "Open",
      description: "Open label",
    },
    backLabel: {
      type: "text-content",
      default: "Search",
      description: "Back label",
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
  durationInFrames: 200,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
