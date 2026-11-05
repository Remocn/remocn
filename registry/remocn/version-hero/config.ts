import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const versionHeroConfig: ComponentConfig = {
  componentName: "VersionHero",
  importPath: "@/components/remocn/version-hero",
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
    version: {
      type: "text-content",
      default: "2.0",
      description: "Version",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    label: {
      type: "text-content",
      default: "Now available",
      description: "Label",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
