import { type ComponentConfig, FPS } from "@/lib/customizer-config";

// Wider-than-default composition so the right pane has full 1280x720-ish room
// for the inner scenes (terminal/dashboard) without cropping.
export const landingCodeShowcaseConfig: ComponentConfig = {
  componentName: "LandingCodeShowcase",
  importPath: "@/components/remocn/landing-code-showcase",
  controls: {
    accentColor: {
      type: "color",
      default: "#FFB38E",
      label: "Accent color",
    },
  },
  durationInFrames: 720,
  fps: FPS,
  compositionWidth: 2080,
  compositionHeight: 900,
  previewBackdrop: { type: "color", value: "#0A090E" },
};
