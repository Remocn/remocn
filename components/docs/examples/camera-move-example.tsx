"use client";

import { AbsoluteFill } from "remotion";
import { Camera, type CameraKey } from "@/registry/remocn/camera-move";

export type CameraPreset = "push-in" | "orbit" | "three-beat";

export const CAMERA_PRESETS: Record<CameraPreset, CameraKey[]> = {
  "push-in": [
    { at: 0, zoom: 1 },
    { at: 149, zoom: 1.16, y: -0.025 },
  ],
  orbit: [
    { at: 0, x: -0.055, y: 0.025, zoom: 1.05, rotate: -1.2 },
    { at: 149, x: 0.065, y: -0.025, zoom: 1.12, rotate: 1.1 },
  ],
  "three-beat": [
    { at: 0, x: -0.06, y: 0.035, zoom: 1.04 },
    { at: 36, x: 0, y: 0, zoom: 1.15 },
    { at: 70, x: 0, y: 0, zoom: 1.15 },
    { at: 112, x: 0.07, y: -0.03, zoom: 1.08, rotate: 0.8 },
    { at: 149, x: 0, y: 0, zoom: 1.02, rotate: 0 },
  ],
};

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";

function CameraSubject() {
  return (
    <AbsoluteFill
      style={{
        inset: -120,
        background:
          "radial-gradient(circle at 30% 20%, #27253a, #0d0e13 56%, #08090c)",
        color: "#f5f5f6",
        fontFamily: FONT_FAMILY,
        padding: 180,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: 30,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(15,16,23,0.9)",
          boxShadow: "0 50px 120px rgba(0,0,0,0.48)",
          padding: 42,
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 42,
        }}
      >
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize: 24, fontWeight: 650 }}>Waypoint</div>
          <div style={{ marginTop: 54, display: "grid", gap: 14 }}>
            {["Overview", "Analytics", "Customers", "Reports"].map(
              (label, index) => (
                <div
                  key={label}
                  style={{
                    width: 150,
                    padding: "12px 16px",
                    borderRadius: 12,
                    color: index === 1 ? "#fff" : "#777b88",
                    background:
                      index === 1 ? "rgba(126,105,255,0.18)" : "transparent",
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </div>
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ color: "#858895", fontSize: 17 }}>Analytics</div>
              <div
                style={{
                  fontSize: 46,
                  fontWeight: 650,
                  letterSpacing: "-0.04em",
                  marginTop: 8,
                }}
              >
                Product momentum
              </div>
            </div>
            <div
              style={{
                padding: "13px 19px",
                borderRadius: 13,
                background: "#7563f2",
                fontWeight: 600,
              }}
            >
              Export report
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr",
              gap: 22,
              marginTop: 42,
            }}
          >
            <div
              style={{
                height: 270,
                borderRadius: 22,
                padding: 30,
                background: "rgba(255,255,255,0.045)",
              }}
            >
              <div style={{ color: "#898c98" }}>Active users</div>
              <div style={{ fontSize: 43, fontWeight: 650, marginTop: 10 }}>
                24.8k
              </div>
              <svg
                width="100%"
                height="125"
                viewBox="0 0 600 125"
                style={{ marginTop: 20 }}
              >
                <path
                  d="M0 112 C80 104, 100 77, 165 84 S270 65, 325 70 S420 20, 600 14"
                  fill="none"
                  stroke="#8978ff"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div
              style={{
                borderRadius: 22,
                padding: 30,
                background: "linear-gradient(145deg, #7d6af4, #4f3bc9)",
              }}
            >
              <div style={{ opacity: 0.7 }}>Conversion</div>
              <div style={{ fontSize: 52, fontWeight: 650, marginTop: 24 }}>
                38%
              </div>
              <div style={{ opacity: 0.72, marginTop: 74 }}>
                ↑ 12.4% this month
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export function CameraMoveExampleScene({
  preset = "three-beat",
  shake = 0.18,
  seed = "remocn-camera",
}: {
  preset?: CameraPreset;
  shake?: number;
  seed?: string;
}) {
  return (
    <Camera moves={CAMERA_PRESETS[preset]} shake={shake} seed={seed}>
      <CameraSubject />
    </Camera>
  );
}

const keyToSource = (key: CameraKey) => {
  const fields = Object.entries(key).map(
    ([name, value]) => `${name}: ${value}`,
  );
  return `{ ${fields.join(", ")} }`;
};

export const cameraMoveExampleCode = (
  values: Record<string, unknown>,
): string => {
  const preset = (values.preset as CameraPreset) ?? "three-beat";
  const moves = CAMERA_PRESETS[preset]
    .map((key) => `    ${keyToSource(key)},`)
    .join("\n");
  return `import { Camera } from "@/components/remocn/camera-move";

<Camera
  moves={[
${moves}
  ]}
  shake={${(values.shake as number) ?? 0.18}}
  seed={${JSON.stringify((values.seed as string) ?? "remocn-camera")}}
>
  <YourScene />
</Camera>`;
};
