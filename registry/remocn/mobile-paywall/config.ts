import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const mobilePaywallConfig: ComponentConfig = {
  componentName: "MobilePaywall",
  importPath: "@/components/remocn/mobile-paywall",
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
      default: "remocn Pro",
      description: "App name",
    },
    title: {
      type: "text-content",
      default: "Ship launch videos in minutes",
      description: "Title",
    },
    cta: {
      type: "text-content",
      default: "Start free for 7 days",
      description: "Cta",
    },
    account: {
      type: "text-content",
      default: "maya@kitebase.dev",
      description: "Account",
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
  durationInFrames: 250,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
