import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const phoneTrioConfig: ComponentConfig = {
  componentName: "PhoneTrio",
  importPath: "@/components/remocn/phone-trio",
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
      default: "#ff5a36",
      description: "Accent",
    },
    name: {
      type: "text-content",
      default: "Ines Marlow",
      description: "Name",
    },
    handle: {
      type: "text-content",
      default: "ines.marlow",
      description: "Handle",
    },
    role: {
      type: "text-content",
      default: "Motion designer",
      description: "Role",
    },
    headline: {
      type: "text-content",
      default: "Driven by motion, obsessed with the",
      description: "Headline",
    },
    accentWord: {
      type: "text-content",
      default: "seamless.",
      description: "Accent word",
    },
    liveLabel: {
      type: "text-content",
      default: "Portfolio is live",
      description: "Live label",
    },
  },
  durationInFrames: 132,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
