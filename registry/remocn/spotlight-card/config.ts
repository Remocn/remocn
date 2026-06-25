import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const spotlightCardConfig: ComponentConfig = {
  componentName: "SpotlightCard",
  importPath: "@/components/remocn/spotlight-card",
  controls: {
    title: { type: "text", default: "Spotlight Card", label: "Title" },
    body: {
      type: "text",
      default:
        "Soft radial light follows the cursor, picking out the microborder.",
      label: "Body",
    },
    cardWidth: {
      type: "number",
      default: 520,
      min: 200,
      max: 900,
      step: 10,
      label: "Card width",
    },
    cardHeight: {
      type: "number",
      default: 320,
      min: 160,
      max: 700,
      step: 10,
      label: "Card height",
    },
    glowSize: {
      type: "number",
      default: 600,
      min: 100,
      max: 1400,
      step: 20,
      label: "Glow size",
    },
    glowOpacity: {
      type: "number",
      default: 0.08,
      min: 0,
      max: 0.4,
      step: 0.01,
      label: "Glow opacity",
    },
    cardColor: { type: "color", default: "#0a0a0a", label: "Card color" },
    textColor: { type: "color", default: "#fafafa", label: "Text color" },
    mutedColor: { type: "color", default: "#71717a", label: "Muted color" },
  },
  durationInFrames: 240,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#050505" },
};
