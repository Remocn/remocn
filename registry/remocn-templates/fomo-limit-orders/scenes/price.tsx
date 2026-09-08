import type { SceneProps } from "../content";
import { ramp, travel, tween } from "../motion";
import { AssetIcon, Layer, muted } from "../ui";

export function Price({ t, content: c, theme }: SceneProps) {
  const zoom = tween(t, 11.65, 12.25, 1, 2.7, travel);
  const targetX = tween(t, 11.65, 12.25, 240, 277, travel);
  const typed =
    t < 11.84
      ? "$"
      : c.limitPrice.slice(
          0,
          Math.floor(tween(t, 11.84, 12.12, 1, c.limitPrice.length, (v) => v)),
        );

  const alpha = ramp(t, 10.9, 11.18);

  return (
    <>
      <Layer
        w={480}
        h={270}
        style={{
          background: `linear-gradient(145deg, ${theme.paper}, #e7ebfb 65%, #edf0ff)`,
        }}
      />
      <Layer
        x={240 - targetX * zoom}
        y={135 - 135 * zoom}
        w={480}
        h={270}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "0 0",
          color: "#171721",
        }}
      >
        <div style={{ opacity: alpha, fontWeight: 500 }}>
          <Layer x={100} y={61}>
            <AssetIcon size={30} />
          </Layer>
          <Layer x={140} y={63} style={{ fontSize: 12 }}>
            {c.ticker}
            <div style={{ marginTop: 2, color: muted, fontSize: 9 }}>
              {c.openInterest}
            </div>
          </Layer>
          <Layer
            x={300}
            y={65}
            w={79}
            style={{ textAlign: "right", fontSize: 12 }}
          >
            {c.marketPrice}
            <div style={{ marginTop: 3, color: theme.positive, fontSize: 9 }}>
              {c.change}
            </div>
          </Layer>
          <Layer
            x={100}
            y={110}
            w={279}
            h={0.6}
            style={{ background: "#c9cfdf66" }}
          />
          <Layer
            x={100}
            y={158}
            w={279}
            h={0.6}
            style={{ background: "#c9cfdf44" }}
          />
          <Layer x={117} y={120} style={{ fontSize: 11 }}>
            Limit price
            <div style={{ marginTop: 4, fontSize: 8, color: muted }}>
              -4.45% from Mid
            </div>
          </Layer>
          <Layer x={100} y={181} w={279} style={{ display: "flex", gap: 6 }}>
            {["+1%", "+5%", "+10%", "+20%"].map((s) => (
              <div
                key={s}
                style={{
                  width: 66,
                  height: 21,
                  borderRadius: 5,
                  border: "0.5px solid #ccd2e282",
                  background: "#ffffff24",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 9,
                }}
              >
                {s}
              </div>
            ))}
          </Layer>
        </div>
        <Layer
          x={225}
          y={122}
          w={96}
          h={28}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            transform: `translateX(${tween(t, 10.9, 11.18, -39, 0)}px)`,
            gap: 5,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: -0.35,
          }}
        >
          <span style={{ opacity: alpha }}>{typed}</span>
          <span
            style={{
              width: 1.5,
              height: 19,
              background: theme.accent,
              opacity: 1,
            }}
          />
          <span style={{ color: theme.accent, marginLeft: -1, opacity: alpha }}>
            Mid
          </span>
        </Layer>
      </Layer>
    </>
  );
}
