import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    payoutArrival: {
      type: "text-content",
      default: "Oct 29",
      description: "Payout arrival",
    },
    currency: {
      type: "text-content",
      default: "$",
      description: "Currency",
    },
    sendLabel: {
      type: "text-content",
      default: "Send invoice",
      description: "Send label",
    },
    payoutTitle: {
      type: "text-content",
      default: "Payout on the way",
      description: "Payout title",
    },
    paidNote: {
      type: "text-content",
      default: "11 days early",
      description: "Paid note",
    },
    payoutFee: {
      type: "number",
      default: 5,
      min: 0,
      max: 100,
      step: 1,
      description: "Payout fee",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
