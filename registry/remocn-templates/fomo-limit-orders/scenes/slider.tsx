import type { SceneProps } from "../content";
import { contraction, key, money, ramp, tween } from "../motion";
import { Chevron, Layer, lightMuted as muted } from "../ui";

export function Slider({ t, theme, content }: SceneProps) {
  const label = t < 8.65;
  const barW =
    t < 10.4833
      ? key(
          t,
          [8.65, 8.8, 9, 9.2, 9.3, 9.55, 9.8, 10.05, 10.3, 10.4833],
          [3500, 2600, 1800, 820, 464, 322, 292, 276, 255, 220],
        )
      : tween(t, 10.4833, 10.8833, 220, 2, contraction);
  const barH = key(
    t,
    [8.65, 8.8, 9, 9.2, 9.3, 9.55, 9.8, 10.3, 10.5],
    [650, 400, 154, 66, 35, 24, 22, 20, 19],
  );
  const centerX = tween(t, 10.45, 10.8833, 240, 250, contraction);
  const price = key(t, [9.3, 9.55, 9.8, 10.05, 10.3], [79, 79.5, 80, 81, 82]);
  const quantity = key(
    t,
    [9.3, 9.55, 9.8, 10.05, 10.3],
    [40, 72, 112, 144, 160],
  );
  const percent = Math.round((quantity / 160) * 100);
  const detailAlpha = ramp(t, 9.15, 9.4) * (1 - ramp(t, 10.3, 10.56));
  const uiScale = key(t, [9.3, 9.55, 9.8, 10.3], [1.6, 1.1, 1, 0.93]);
  const roll = tween(t, 8.18, 8.55, 0, 1, (v) => v);
  const knobSize = barH * 0.77;
  return (
    <>
      <Layer
        w={480}
        h={270}
        style={{
          background: label
            ? "white"
            : `linear-gradient(145deg, ${theme.paper}, #ebe1ce 65%, #f7f0e3)`,
        }}
      />
      {label ? (
        <Layer
          x={130}
          y={116}
          w={220}
          h={38}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 9,
            color: "#865616",
            fontSize: 23,
            letterSpacing: -0.6,
            opacity: ramp(t, 8.01, 8.1),
          }}
        >
          <span style={{ transform: "rotate(90deg)", display: "flex" }}>
            <Chevron color={theme.accent} size={16} />
          </span>
          <div
            style={{
              width: 78,
              height: 35,
              position: "relative",
              overflow: "visible",
            }}
          >
            <Layer y={-roll * 35} style={{ opacity: 1 - roll }}>
              Market
            </Layer>
            <Layer y={(1 - roll) * 35} style={{ opacity: roll }}>
              Limit
            </Layer>
          </div>
        </Layer>
      ) : (
        <>
          <Layer
            x={centerX - barW / 2}
            y={135 - barH / 2}
            w={barW}
            h={barH}
            style={{
              background: `linear-gradient(100deg, #c78a30, ${theme.accent})`,
              borderRadius: Math.min(9, barH / 3),
              boxShadow:
                t < 10.7
                  ? "inset 0 0.5px 1px #f3d8a3, 0 1px 2px #8d6a301f"
                  : undefined,
            }}
          >
            <Layer
              x={
                barW *
                  key(t, [8.65, 9.2, 9.3, 10.3], [0.5, 0.57, 0.58, 0.955]) -
                knobSize / 2
              }
              y={(barH - knobSize) / 2}
              w={knobSize}
              h={knobSize}
              style={{
                background: "#fff",
                borderRadius: "50%",
                boxShadow: "0 1px 3px #4d3b2126",
                opacity: 1 - ramp(t, 10.4, 10.65),
              }}
            />
          </Layer>
          <Layer
            x={240}
            y={135}
            style={{
              transform: `scale(${uiScale})`,
              opacity: detailAlpha,
              color: "#28281f",
              fontSize: 9,
              whiteSpace: "nowrap",
            }}
          >
            <Layer
              x={-146}
              y={-65}
              w={292}
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 7,
                fontSize: 11,
              }}
            >
              <span>Limit price</span>
              <span>
                {money(price)}{" "}
                <span style={{ color: muted }}>
                  (+{(((price - 79) / 79) * 100).toFixed(2)}%)
                </span>
              </span>
            </Layer>
            <Layer x={-142} y={-31} style={{ fontSize: 13, color: "#5b5548" }}>
              {quantity.toFixed(2)} {content.ticker}
            </Layer>
            <Layer
              x={113}
              y={-31}
              w={30}
              style={{
                textAlign: "right",
                fontSize: 13,
                color: "#865616",
                fontWeight: 600,
              }}
            >
              {percent}%
            </Layer>
            <Layer
              x={-146}
              y={25}
              w={292}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
              }}
            >
              <span style={{ color: muted }}>Est. profit</span>
              <span style={{ color: "#326846" }}>
                {money(quantity * (price - 75))}
              </span>
            </Layer>
            <Layer
              x={-128}
              y={53}
              w={274}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
              }}
            >
              <span style={{ color: muted }}>Details</span>
              <span>&lt;0.01% fee ﹀</span>
            </Layer>
          </Layer>
        </>
      )}
    </>
  );
}
