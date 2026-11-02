import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bloomRingConfig: ComponentConfig = {
  componentName: "BloomRingDemo",
  importPath: "@/components/remocn/bloom-ring",
  controls: {
    theme: {
      type: "text-content",
      default: "dark",
      description: "Theme",
    },
    lead: {
      type: "text-content",
      default: "Your store goes live",
      description: "Lead",
    },
    accentLine: {
      type: "text-content",
      default: "in fifteen minutes.",
      description: "Accent line",
    },
    tagline: {
      type: "text-content",
      default: "Launch films, built from blocks you own.",
      description: "Tagline",
    },
  },
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
