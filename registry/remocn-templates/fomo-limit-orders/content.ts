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
  intro: "introducing",
  feature: "limit close orders",
  audience: "for perps",
  ticker: "SPCX",
  assetName: "SpaceX (Tokenized)",
  leverage: "20x",
  position: "4x Long",
  positionValue: "$47,383.31",
  positionProfit: "+$31,552.64",
  positionSize: "$94.8K",
  positionQuantity: "493.32 SPCX",
  positionReturn: "199.31%",
  entryPrice: "$128.36",
  liquidationPrice: "$96.27",
  marketPrice: "$192.32",
  change: "3.98%",
  openInterest: "$160M OI",
  limitPrice: "$194.67",
  margin: "$5,192.32",
  orderSize: "$20,8K",
  action: "Place limit close",
  closing: "trade by your own rules",
};

export interface FomoTheme {
  ink: string;
  panel: string;
  paper: string;
  accent: string;
  positive: string;
}
export const fomoTheme: FomoTheme = {
  ink: "#060410",
  panel: "#12101c",
  paper: "#f5f6ff",
  accent: "#6164f5",
  positive: "#00c773",
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
