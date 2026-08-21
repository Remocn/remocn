"use client";

import { AbsoluteFill } from "remotion";
import { Stage, type StageProps } from "@/registry/remocn/stage";

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function ProductPanel() {
  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(145deg, #171822, #0b0c11)",
        color: "#f7f7f8",
        fontFamily: FONT_FAMILY,
        padding: 54,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #8b7cff, #5d47ea)",
              boxShadow: "0 8px 24px rgba(105, 82, 235, 0.4)",
            }}
          />
          <span style={{ fontSize: 24, fontWeight: 650 }}>Northstar</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              style={{
                width: item === 2 ? 72 : 32,
                height: 32,
                borderRadius: 10,
                background: item === 2 ? "#f2f2f4" : "#242630",
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 38, marginTop: 70 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              color: "#9a95ff",
              fontSize: 15,
              fontWeight: 650,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Weekly overview
          </div>
          <div
            style={{
              fontSize: 58,
              lineHeight: 1,
              fontWeight: 650,
              letterSpacing: "-0.045em",
              marginTop: 18,
            }}
          >
            18,420
          </div>
          <div style={{ color: "#848793", fontSize: 18, marginTop: 14 }}>
            active customers
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-end",
              height: 118,
              marginTop: 40,
            }}
          >
            {[42, 58, 46, 74, 66, 92, 108, 98].map((height, index) => (
              <div
                key={`${height}-${index}`}
                style={{
                  flex: 1,
                  height,
                  borderRadius: 6,
                  background:
                    index === 6
                      ? "linear-gradient(#a89fff, #6655e7)"
                      : "#2a2c36",
                }}
              />
            ))}
          </div>
        </div>
        <div
          style={{
            width: "42%",
            borderRadius: 24,
            padding: 28,
            background: "rgba(255,255,255,0.045)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{ color: "#9a9da8", fontSize: 16 }}>Conversion</div>
          <div style={{ fontSize: 46, fontWeight: 650, marginTop: 12 }}>
            34.8%
          </div>
          <div
            style={{
              height: 11,
              borderRadius: 99,
              background: "#262832",
              marginTop: 36,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "72%",
                height: "100%",
                borderRadius: 99,
                background: "linear-gradient(90deg, #6655e7, #aa9fff)",
              }}
            />
          </div>
          <div style={{ color: "#727580", fontSize: 15, marginTop: 24 }}>
            +8.2% from last week
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function StageExampleScene(props: Omit<StageProps, "children">) {
  return (
    <Stage {...props}>
      <ProductPanel />
    </Stage>
  );
}

export const stageExampleCode = (values: Record<string, unknown>): string => {
  const backdrop =
    (values.backdrop as string) ??
    "linear-gradient(145deg, #17181d 0%, #09090b 72%)";
  return `import { Stage } from "@/components/remocn/stage";

<Stage
  backdrop={${JSON.stringify(backdrop)}}
  rotateX={${(values.rotateX as number) ?? 8}}
  rotateY={${(values.rotateY as number) ?? -12}}
  perspective={${(values.perspective as number) ?? 1400}}
  scale={${(values.scale as number) ?? 0.82}}
  radius={${(values.radius as number) ?? 1.4}}
  reflection={${(values.reflection as number) ?? 0.24}}
  shadow={${(values.shadow as number) ?? 0.7}}
  light={${(values.light as number) ?? 0.55}}
>
  <YourScene />
</Stage>`;
};
