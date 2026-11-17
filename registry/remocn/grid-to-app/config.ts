import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const gridToAppConfig: ComponentConfig = {
  componentName: "GridToApp",
  importPath: "@/components/remocn/grid-to-app",
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
    storeName: {
      type: "text-content",
      default: "Studio Goods",
      description: "Store name",
    },
    pageTitle: {
      type: "text-content",
      default: "Products",
      description: "Page title",
    },
    publishLabel: {
      type: "text-content",
      default: "Publish",
      description: "Publish label",
    },
    liveLabel: {
      type: "text-content",
      default: "Store live",
      description: "Live label",
    },
    addLabel: {
      type: "text-content",
      default: "Add product",
      description: "Add button",
    },
    accent: {
      type: "color",
      default: "#ff6a2b",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Inter Tight" }),
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
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
