import { Interactive } from "remotion";
import type { SceneProps } from "../content";
import { barHeights, chartBarGrowth, move } from "../motion";

export function PerformanceChart({ scene, t }: SceneProps) {
  const bars = scene.bars;
  const heights = barHeights(
    bars.map((bar) => bar.value),
    1,
    117,
  );
  const width = 286 / bars.length;
  const exit = move(t, 40.7, 40.8);
  return (
    <Interactive.Div
      name="Performance chart"
      style={{
        position: "absolute",
        left: 76,
        top: 44,
        width: 330,
        height: 189,
        background: "#14263a",
        opacity: move(t, 38.8, 39),
        transform: `translate3d(0, 0, 0) scale(${move(t, 38.8, 40.4, 0.88, 1.05)})`,
        willChange: "transform",
        transformOrigin: "50% 65%",
        overflow: "hidden",
        clipPath: `inset(0 ${exit * 100}% 0 0)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 15,
          left: 15,
          color: "#dedede",
          fontSize: 8,
        }}
      >
        {scene.content.chartTitle}
      </div>
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 17,
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          height: 126,
        }}
      >
        {bars.map((bar, i) => {
          const growth = chartBarGrowth(t, i);
          return (
            <div
              key={`${bar.label}-${i}`}
              style={{
                position: "relative",
                flex: 1,
                minWidth: 0,
                height: heights[i],
                color: i === 0 ? "#a0a0a0" : scene.background,
                overflow: "hidden",
                clipPath: `inset(${(1 - growth) * 100}% 0 0 0)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: i === 0 ? "#3a526a" : scene.accent,
                  boxShadow: "inset 0 1px #ffffff30",
                  transform: `translate3d(0, 0, 0) scaleY(${growth})`,
                  transformOrigin: "50% 100%",
                  willChange: "transform",
                }}
              />
              <div
                style={{
                  padding: "5px 4px",
                  fontSize: Math.min(6.5, width / 9),
                  whiteSpace: "nowrap",
                  transform: `translate3d(0, ${heights[i] * (1 - growth)}px, 0)`,
                  willChange: "transform",
                }}
              >
                {bar.label}
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 4,
                  bottom: 4,
                  fontSize: 5.8,
                }}
              >
                {bar.detail}
              </div>
            </div>
          );
        })}
      </div>
    </Interactive.Div>
  );
}
