import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
    accent: {
      type: "color",
      default: "#ff6a2b",
      description: "Accent",
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
  },
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
