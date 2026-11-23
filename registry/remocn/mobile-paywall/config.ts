import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const mobilePaywallConfig: ComponentConfig = {
  componentName: "MobilePaywall",
  importPath: "@/components/remocn/mobile-paywall",
  lists: {
    lines: {
      default: [
        "Pro, one tap away.",
        "Double-click to confirm.",
        "Seven days, on us.",
      ],
      description: "Lines",
      min: 3,
      max: 3,
    },
    dates: {
      default: ["Nov 2", "Nov 7", "Nov 9"],
      description: "Trial dates",
      min: 3,
      max: 3,
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
    welcomeTitle: {
      type: "text-content",
      default: "Welcome to Pro",
      description: "Welcome title",
    },
    welcomeSub: {
      type: "text-content",
      default: "Your free week starts now. Here’s how it works.",
      description: "Welcome subline",
    },
    welcomeCta: {
      type: "text-content",
      default: "Start creating",
      description: "Welcome button",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Figtree" }),
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
