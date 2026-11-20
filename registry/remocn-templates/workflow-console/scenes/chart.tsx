import { Interactive, useVideoConfig } from "remotion";
import type { SceneProps } from "../content";
import { barHeights, chartBarGrowth, move, useGlide } from "../motion";

// The zoom and the bars have no clean progress (eased products, staggered
// windows), so a value moves on any frame where it differs from a neighbour.
const changing = (at: (u: number) => number, t: number, step: number) =>
  at(t + step) !== at(t) || at(t) !== at(t - step);

export function PerformanceChart({ scene, t }: SceneProps) {
  const glide = useGlide();
  const { fps } = useVideoConfig();
  const step = 1 / fps;
  const bars = scene.bars;
  const heights = barHeights(
    bars.map((bar) => bar.value),
    1,
    117,
  );
  const width = 286 / bars.length;
  const exit = move(t, 40.7, 40.8);
  const zoomAt = (u: number) => move(u, 38.8, 40.4, 0.88, 1.05);
  const zooming = changing(zoomAt, t, step);
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
        // The layer `will-change` made is gone: it slid one texture that
        // differed from tab to tab in a split render.
        transform: `scale(${zoomAt(t)})${glide(zooming)}`,
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
          const rising = changing(
            (u) => heights[i] * (1 - chartBarGrowth(u, i)),
            t,
            step,
          );
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
                  transform: `scaleY(${growth})`,
                  transformOrigin: "50% 100%",
                }}
              />
              <div
                style={{
                  padding: "5px 4px",
                  fontSize: Math.min(6.5, width / 9),
                  whiteSpace: "nowrap",
                  transform: `translateY(${heights[i] * (1 - growth)}px)${glide(rising)}`,
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
