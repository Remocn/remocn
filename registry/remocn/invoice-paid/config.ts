import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const invoicePaidConfig: ComponentConfig = {
  componentName: "InvoicePaid",
  importPath: "@/components/remocn/invoice-paid",
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
    sender: {
      type: "text-content",
      default: "Halcyon Studio",
      description: "Sender",
    },
    customer: {
      type: "text-content",
      default: "Kitebase, Inc.",
      description: "Customer",
    },
    customerEmail: {
      type: "text-content",
      default: "ap@kitebase.com",
      description: "Customer email",
    },
    customerAddress: {
      type: "text-content",
      default: "2100 Market St, SF",
      description: "Customer address",
    },
    number: {
      type: "text-content",
      default: "INV-2041",
      description: "Number",
    },
    issued: {
      type: "text-content",
      default: "Oct 24, 2026",
      description: "Issued",
    },
    due: {
      type: "text-content",
      default: "Nov 7, 2026",
      description: "Due",
    },
    payoutAccount: {
      type: "text-content",
      default: "Business Checking ••4821",
      description: "Payout account",
    },
  },
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
