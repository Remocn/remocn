import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const toolMenuSlideInConfig: ComponentConfig = {
  componentName: "ToolMenuSlideIn",
  importPath: "@/components/remocn/tool-menu-slide-in",
  controls: {
    panelStartFrame: {
      type: "number",
      default: 18,
      min: 0,
      max: 120,
      step: 1,
      label: "Panel start (frame)",
    },
    iconStagger: {
      type: "number",
      default: 4,
      min: 1,
      max: 20,
      step: 1,
      label: "Icon stagger (frames)",
    },
    iconCount: {
      type: "number",
      default: 5,
      min: 3,
      max: 8,
      step: 1,
      label: "Icon count",
    },
    accent: { type: "color", default: "#a78bfa", label: "Accent" },
    panelColor: {
      type: "color",
      default: "#12121299",
      label: "Panel color",
    },
    iconBg: { type: "color", default: "#ffffff10", label: "Icon background" },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#070708" },
};
