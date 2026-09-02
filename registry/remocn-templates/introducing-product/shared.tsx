import type { ReactNode } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  useCurrentFrame,
} from "remotion";
import type { IntroducingProductStudioProps } from "./schema";
import type { ProductFeature } from "./types";

type Theme = IntroducingProductStudioProps["theme"];

export function DarkStage({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.darkBackground,
        color: theme.darkText,
        fontFamily: theme.fontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: theme.gridOpacity,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.09) 1px, transparent 1px)",
          backgroundSize: `${theme.gridSize}px ${theme.gridSize}px`,
          translate: `${-(frame % theme.gridSize)}px ${-(frame % theme.gridSize)}px`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "12%",
          right: "12%",
          bottom: -180,
          height: 330,
          borderRadius: "50%",
          background: `linear-gradient(90deg, ${theme.accentColor}, ${theme.warmColor})`,
          filter: `blur(${theme.glowBlur}px)`,
          opacity: theme.glowOpacity,
          scale: interpolate(frame % 120, [0, 60, 120], [0.96, 1.04, 0.96]),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 42%, transparent 0%, rgba(0,0,0,.12) 48%, rgba(0,0,0,.82) 100%)",
        }}
      />
      {children}
    </AbsoluteFill>
  );
}

export function LightStage({
  theme,
  children,
}: {
  theme: Theme;
  children: ReactNode;
}) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.lightBackground,
        color: theme.lightText,
        fontFamily: theme.fontFamily,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "7%",
          right: "7%",
          bottom: -175,
          height: 310,
          borderRadius: "50%",
          background: `linear-gradient(90deg, ${theme.accentColor}, ${theme.warmColor})`,
          filter: `blur(${theme.glowBlur + 2}px)`,
          opacity: theme.glowOpacity * 0.67,
        }}
      />
      {children}
    </AbsoluteFill>
  );
}

export function BrandMark({
  productName,
  logoUrl,
  accentColor,
  size = 68,
  showName = true,
}: Pick<IntroducingProductStudioProps["content"], "productName" | "logoUrl"> & {
  accentColor: string;
  size?: number;
  showName?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: size * 0.24 }}>
      {logoUrl ? (
        <Img
          name="Product logo"
          src={logoUrl}
          style={{ width: size, height: size, objectFit: "contain" }}
        />
      ) : (
        <div
          style={{
            width: size,
            height: size,
            borderRadius: "42% 58% 52% 48% / 58% 42% 58% 42%",
            background: `radial-gradient(circle at 35% 28%, #fff 0 8%, transparent 9%), radial-gradient(circle at 64% 38%, #b8a7ff 0 7%, transparent 8%), linear-gradient(145deg, #d8d0ff, ${accentColor} 58%, #19121f)`,
            boxShadow: `0 0 ${size * 0.7}px ${accentColor}88`,
          }}
        />
      )}
      {showName ? (
        <div
          style={{
            fontSize: size * 0.56,
            fontWeight: 700,
            letterSpacing: "-0.045em",
          }}
        >
          {productName}
        </div>
      ) : null}
    </div>
  );
}

function Sparkline({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 260 80" style={{ width: "100%", height: 80 }}>
      <path
        d="M0 63 C28 56 34 68 58 48 S92 24 118 38 S151 64 175 36 S218 14 260 20"
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProductWindow({
  productName,
  feature,
  accentColor,
  screenshotUrl,
  theme,
  compact = false,
}: {
  productName: string;
  feature: ProductFeature;
  accentColor: string;
  screenshotUrl?: string;
  theme: Theme;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        width: compact ? theme.compactWindowWidth : theme.windowWidth,
        height: compact ? theme.compactWindowHeight : theme.windowHeight,
        overflow: "hidden",
        border: `1px solid ${theme.windowBorderColor}`,
        borderRadius: compact
          ? Math.max(0, theme.windowRadius - 8)
          : theme.windowRadius,
        background: theme.windowBackground,
        boxShadow: `0 0 0 1px ${accentColor}22, 0 30px 100px rgba(0,0,0,.65), 0 0 70px ${accentColor}42`,
      }}
    >
      {screenshotUrl ? (
        <Img
          name="Product screenshot"
          src={screenshotUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div style={{ padding: compact ? 24 : 38 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "#f8f7fb",
            }}
          >
            <div style={{ fontSize: compact ? 17 : 22, fontWeight: 700 }}>
              {productName}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2].map((dot) => (
                <div
                  key={dot}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: dot === 0 ? accentColor : "#44434a",
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ marginTop: compact ? 32 : 58 }}>
            <div style={{ color: "#8e8c98", fontSize: compact ? 13 : 16 }}>
              {feature.eyebrow}
            </div>
            <div
              style={{
                marginTop: 10,
                maxWidth: 650,
                color: "#f8f7fb",
                fontSize: compact ? 28 : 43,
                fontWeight: 620,
                letterSpacing: "-0.035em",
                lineHeight: 1.06,
              }}
            >
              {feature.title}
            </div>
            <div
              style={{
                marginTop: 14,
                maxWidth: 610,
                color: "#8e8c98",
                fontSize: compact ? 14 : 19,
                lineHeight: 1.45,
              }}
            >
              {feature.description}
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.5fr 1fr",
              gap: 20,
              marginTop: compact ? 26 : 48,
            }}
          >
            <div
              style={{
                padding: compact ? 14 : 20,
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 16,
                background: "rgba(255,255,255,.025)",
              }}
            >
              <Sparkline color={accentColor} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: compact ? 14 : 20,
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: 16,
                background: "rgba(255,255,255,.025)",
              }}
            >
              <div style={{ color: "#8e8c98", fontSize: compact ? 12 : 14 }}>
                Momentum
              </div>
              <div
                style={{
                  color: "#f8f7fb",
                  fontSize: compact ? 23 : 34,
                  fontWeight: 680,
                  marginTop: 5,
                }}
              >
                {feature.stat ?? "Live"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function FadeEdges() {
  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        boxShadow: "inset 0 0 130px rgba(0,0,0,.78)",
        color: "#ffffff",
      }}
    />
  );
}

export const smooth = Easing.bezier(0.16, 1, 0.3, 1);
