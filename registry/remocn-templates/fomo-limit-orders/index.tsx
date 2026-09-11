"use client";

import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-800.css";
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig } from "remotion";
import {
  type FomoLimitOrdersProps,
  fomoContent,
  fomoTheme,
  type SceneProps,
} from "./content";
import {
  FOMO_FPS,
  FOMO_FRAMES,
  FOMO_HEIGHT,
  FOMO_WIDTH,
  tween,
} from "./motion";
import { Closing } from "./scenes/closing";
import { Confirmation } from "./scenes/confirmation";
import { Opening } from "./scenes/opening";
import { Phone } from "./scenes/phone";
import { Price } from "./scenes/price";
import { Slider } from "./scenes/slider";

export type { FomoContent, FomoLimitOrdersProps, FomoTheme } from "./content";
export { fomoContent, fomoTheme } from "./content";
export {
  FOMO_FPS,
  FOMO_FRAMES,
  FOMO_HEIGHT,
  FOMO_WIDTH,
  fomoTimeline,
} from "./motion";

export function FomoLimitOrders(props: FomoLimitOrdersProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = frame / fps;
  const scale = Math.min(width / 480, height / 270);
  const theme = {
    ...fomoTheme,
    ...props.theme,
    ...(props.accentColor ? { accent: props.accentColor } : {}),
  };
  const scene: SceneProps = {
    t,
    theme,
    content: { ...fomoContent, ...props.content },
    brandName: props.brandName ?? "Order Flow",
  };
  const volume = Number.isFinite(props.volume)
    ? Math.min(1, Math.max(0, props.volume ?? 1))
    : 1;
  return (
    <AbsoluteFill
      style={{
        background: theme.ink,
        color: "#fff",
        overflow: "hidden",
        fontFamily: "Manrope, sans-serif",
        fontWeight: 400,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: (width - 480 * scale) / 2,
          top: (height - 270 * scale) / 2,
          width: 480,
          height: 270,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {t < 2.7 ? (
          <Opening {...scene} />
        ) : t < 8 ? (
          <Phone {...scene} />
        ) : t < 10.9 ? (
          <Slider {...scene} />
        ) : t < 12.6 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 1 - tween(t, 12.3, 12.6),
            }}
          >
            <Price {...scene} />
          </div>
        ) : t < 14.15 ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: tween(t, 12.6, 12.78),
            }}
          >
            <Confirmation {...scene} t={t + 1.85} />
          </div>
        ) : (
          <Closing {...scene} t={t + 1.85} />
        )}
      </div>
      {props.audioSrc?.trim() ? (
        <Audio src={props.audioSrc} volume={volume} />
      ) : null}
    </AbsoluteFill>
  );
}

export const OrderFlow = FomoLimitOrders;
export type OrderFlowProps = FomoLimitOrdersProps;

export const fomoLimitOrdersConfig = {
  componentName: "OrderFlow",
  importPath: "@/components/remocn/templates/fomo-limit-orders",
  controls: {
    brandName: {
      type: "text-content" as const,
      default: "Order Flow",
      description: "Closing wordmark",
    },
    accentColor: {
      type: "color" as const,
      default: "#e8b45a",
      description: "Controls and progress color",
    },
  },
  durationInFrames: FOMO_FRAMES,
  fps: FOMO_FPS,
  compositionWidth: FOMO_WIDTH,
  compositionHeight: FOMO_HEIGHT,
};
