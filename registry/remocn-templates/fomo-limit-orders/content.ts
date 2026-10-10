export interface FomoContent {
  intro: string;
  feature: string;
  audience: string;
  ticker: string;
  assetName: string;
  leverage: string;
  position: string;
  positionValue: string;
  positionProfit: string;
  positionSize: string;
  positionQuantity: string;
  positionReturn: string;
  entryPrice: string;
  liquidationPrice: string;
  marketPrice: string;
  change: string;
  openInterest: string;
  limitPrice: string;
  margin: string;
  orderSize: string;
  action: string;
  closing: string;
}

export const fomoContent: FomoContent = {
  intro: "New in Order Flow",
  feature: "Plan your next exit",
  audience: "Before the market moves",
  ticker: "DEMO",
  assetName: "Demo Market",
  leverage: "5x",
  position: "2x Long",
  positionValue: "$12,640.00",
  positionProfit: "+$640.00",
  positionSize: "$12.64K",
  positionQuantity: "160 DEMO",
  positionReturn: "10.67%",
  entryPrice: "$75.00",
  liquidationPrice: "$37.50",
  marketPrice: "$79.00",
  change: "1.28%",
  openInterest: "$24M OI",
  limitPrice: "$82.00",
  margin: "$6,000.00",
  orderSize: "$12.64K",
  action: "Set an exit price",
  closing: "Your price. Your next move.",
};

export interface FomoTheme {
  ink: string;
  panel: string;
  paper: string;
  accent: string;
  positive: string;
}
export const fomoTheme: FomoTheme = {
  ink: "#121310",
  panel: "#20221c",
  paper: "#f6f1e7",
  accent: "#e8b45a",
  positive: "#80bf97",
};
export interface FomoLimitOrdersProps {
  brandName?: string;
  accentColor?: string;
  content?: Partial<FomoContent>;
  theme?: Partial<FomoTheme>;
  /** Optional, user-owned soundtrack. The source reference audio is not redistributed. */
  audioSrc?: string;
  volume?: number;
}
export interface SceneProps {
  t: number;
  content: FomoContent;
  theme: FomoTheme;
  brandName: string;
}
