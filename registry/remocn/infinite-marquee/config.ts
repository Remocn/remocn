import {
  type ComponentConfig,
  FONT_WEIGHT_OPTIONS,
  FPS,
  H,
  W,
} from "@/lib/customizer-config";

export const infiniteMarqueeConfig: ComponentConfig = {
  componentName: "InfiniteMarquee",
  importPath: "@/components/remocn/infinite-marquee",
  controls: {
    text: { type: "text", default: "ship · build · animate · ", label: "Text" },
    fontSize: {
      type: "number",
      default: 120,
      min: 12,
      max: 240,
      step: 1,
      label: "Font size",
    },
    color: { type: "color", default: "#171717", label: "Color" },
    fontWeight: {
      type: "select",
      default: "700",
      options: FONT_WEIGHT_OPTIONS,
      label: "Font weight",
    },
    pixelsPerFrame: {
      type: "number",
      default: 4,
      min: 1,
      max: 30,
      step: 1,
      label: "Pixels / frame",
    },
    stroke: { type: "boolean", default: false, label: "Stroke" },
    strokeColor: { type: "color", default: "#171717", label: "Stroke color" },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#fafafa" },
};
