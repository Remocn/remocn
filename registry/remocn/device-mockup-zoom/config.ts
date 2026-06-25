import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const deviceMockupZoomConfig: ComponentConfig = {
  componentName: "DeviceMockupZoom",
  importPath: "@/components/remocn/device-mockup-zoom",
  controls: {
    device: {
      type: "select",
      default: "laptop",
      options: ["laptop", "phone"],
      label: "Device",
    },
    frameColor: { type: "color", default: "#1f1f1f", label: "Frame color" },
    screenColor: { type: "color", default: "#0a0a0a", label: "Screen color" },
  },
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#fafafa" },
};
