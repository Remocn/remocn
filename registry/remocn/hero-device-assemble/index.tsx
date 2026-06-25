"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface HeroDeviceAssembleProps {
  assembleStart?: number;
  device?: "laptop" | "phone";
  accentColor?: string;
  speed?: number;
  className?: string;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function MockUI({ accentColor }: { accentColor: string }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: "#0b0b0f",
        fontFamily: FONT_FAMILY,
        color: "white",
        overflow: "hidden",
      }}
    >
      {/* Title bar */}
      <div
        style={{
          height: "10%",
          background: "#111118",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
          }}
        />
      </div>
      <div style={{ flex: 1, display: "flex" }}>
        {/* Sidebar */}
        <div
          style={{
            width: "22%",
            background: "#0e0e14",
            borderRight: "1px solid rgba(255,255,255,0.05)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              height: 12,
              borderRadius: 4,
              background: accentColor,
              opacity: 0.85,
              width: "70%",
            }}
          />
          <div
            style={{
              height: 10,
              borderRadius: 4,
              background: "rgba(255,255,255,0.1)",
              width: "85%",
            }}
          />
          <div
            style={{
              height: 10,
              borderRadius: 4,
              background: "rgba(255,255,255,0.08)",
              width: "60%",
            }}
          />
          <div
            style={{
              height: 10,
              borderRadius: 4,
              background: "rgba(255,255,255,0.08)",
              width: "75%",
            }}
          />
        </div>
        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              height: 18,
              width: "40%",
              background: "rgba(255,255,255,0.85)",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              height: 10,
              width: "65%",
              background: "rgba(255,255,255,0.18)",
              borderRadius: 4,
            }}
          />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 12,
              marginTop: 12,
            }}
          >
            <div
              style={{
                height: 90,
                borderRadius: 8,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
            <div
              style={{
                height: 90,
                borderRadius: 8,
                background: `linear-gradient(180deg, ${accentColor}33, ${accentColor}11)`,
                border: `1px solid ${accentColor}55`,
              }}
            />
            <div
              style={{
                height: 90,
                borderRadius: 8,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            />
          </div>
          <div
            style={{
              flex: 1,
              borderRadius: 8,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function HeroDeviceAssemble({
  assembleStart = 0,
  device = "laptop",
  accentColor = "#22c55e",
  speed = 1,
  className,
}: HeroDeviceAssembleProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  const assemble = spring({
    frame: frame - assembleStart,
    fps,
    config: { mass: 1.4, damping: 12, stiffness: 90 },
    durationInFrames: 60,
  });

  // Layer translateZ values from far -> 0
  const lidZ = interpolate(assemble, [0, 1], [1000, 0]);
  const baseZ = interpolate(assemble, [0, 1], [-800, 0]);
  const bezelZ = interpolate(assemble, [0, 1], [600, 0]);
  const screenZ = interpolate(assemble, [0, 1], [300, 0]);

  // Parent rotation easing to 0
  const rotX = interpolate(assemble, [0, 1], [-22, 0]);
  const rotY = interpolate(assemble, [0, 1], [28, 0]);

  // Layer opacity fade in slightly during assembly
  const layerOpacity = interpolate(assemble, [0, 0.4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Settle frame: after assemble ~ 0.95
  const settleFrame = assembleStart + 45;
  const screenWake = interpolate(
    frame,
    [settleFrame, settleFrame + 18],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Shimmer sweep across screen (after wake)
  const shimmerProgress = interpolate(
    frame,
    [settleFrame + 6, settleFrame + 30],
    [-1, 2],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const isPhone = device === "phone";

  // Device dimensions
  const deviceW = isPhone ? 320 : 760;
  const deviceH = isPhone ? 640 : 470;
  const screenInset = isPhone ? 12 : 18;
  const bezelRadius = isPhone ? 36 : 14;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        perspective: 2000,
        fontFamily: FONT_FAMILY,
      }}
    >
      <div
        style={{
          position: "relative",
          width: deviceW,
          height: deviceH,
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          willChange: "transform",
        }}
      >
        {/* Back lid (laptop only — for phone, acts as the back shell) */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateZ(${lidZ - 8}px)`,
            background: "linear-gradient(180deg, #1f2128 0%, #0e1014 100%)",
            borderRadius: bezelRadius + 4,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "0 60px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
            opacity: layerOpacity,
          }}
        />

        {/* Keyboard / chassis base — laptop only */}
        {!isPhone && (
          <div
            style={{
              position: "absolute",
              left: -40,
              right: -40,
              bottom: -28,
              height: 28,
              transform: `translateZ(${baseZ}px) rotateX(78deg)`,
              transformOrigin: "top center",
              background: "linear-gradient(180deg, #2a2d36 0%, #14161c 100%)",
              borderRadius: "0 0 12px 12px",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 30px 60px rgba(0,0,0,0.6)",
              opacity: layerOpacity,
            }}
          />
        )}

        {/* Bezel frame */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateZ(${bezelZ}px)`,
            background: "#0a0a0d",
            borderRadius: bezelRadius,
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow:
              "inset 0 0 0 2px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.5)",
            opacity: layerOpacity,
          }}
        />

        {/* UI screen */}
        <div
          style={{
            position: "absolute",
            inset: screenInset,
            transform: `translateZ(${screenZ}px)`,
            borderRadius: bezelRadius - 6,
            overflow: "hidden",
            background: "black",
            opacity: layerOpacity,
          }}
        >
          {/* Black panel during flight */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000",
              opacity: 1 - screenWake,
            }}
          />
          {/* UI fades in */}
          <div style={{ position: "absolute", inset: 0, opacity: screenWake }}>
            <MockUI accentColor={accentColor} />
          </div>
          {/* Shimmer sweep */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%)`,
              transform: `translateX(${shimmerProgress * 100}%)`,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
