import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const githubSponsorsConfig: ComponentConfig = {
  componentName: "GitHubSponsors",
  importPath: "@/components/remocn/github-sponsors",
  controls: {
    account: {
      type: "text-content",
      default: "remocn",
      description: "Account",
    },
    accentColor: {
      type: "color",
      default: "#db61a2",
      description: "Accent",
    },
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
  },
  durationInFrames: 270,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
