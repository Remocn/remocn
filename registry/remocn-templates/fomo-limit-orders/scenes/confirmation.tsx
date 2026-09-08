import type { SceneProps } from "../content";
import { key, tween } from "../motion";
import { AssetIcon, Badge, Layer, muted, row } from "../ui";

export function Confirmation({ t, content: c, theme }: SceneProps) {
  const scale = key(
    t,
    [14.45, 14.65, 15.25, 15.6, 15.8, 16],
    [0.67, 0.73, 1, 1.16, 1.25, 1.3],
  );
  const exit = tween(t, 15.77, 16, 0, 210, (v) => v * v);
  const fill = Math.round(
    key(t, [14.45, 14.7, 15, 15.25, 15.45], [20, 50, 83, 97, 100]),
  );
  return (
    <Layer
      x={240}
      y={135 + exit}
      w={300}
      h={110}
      style={{
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${key(t, [14.45, 15.4, 16], [-1.2, 0, 2])}deg)`,
        background: theme.panel,
        borderRadius: 12,
        boxShadow: "0 0 10px #18131e65",
        fontWeight: 500,
        letterSpacing: -0.4,
      }}
    >
      <Layer x={10} y={10}>
        <Badge theme={theme}>{c.position}</Badge>
      </Layer>
      <Layer
        x={235}
        y={12}
        w={55}
        style={{ fontSize: 14, textAlign: "right", color: "#d0ced9" }}
      >
        Cancel
      </Layer>
      <Layer x={10} y={41} style={{ ...row, gap: 5, fontSize: 16 }}>
        <AssetIcon size={18} />
        <span>{c.ticker}</span>
        <span style={{ color: muted, fontSize: 12 }}>⊙</span>
        <span>{c.limitPrice}</span>
      </Layer>
      <Layer
        x={214}
        y={45}
        style={{ ...row, gap: 8, fontSize: 12, color: muted }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <circle
            cx="7"
            cy="7"
            r="5"
            fill="none"
            stroke="#302946"
            strokeWidth="1.8"
          />
          <circle
            cx="7"
            cy="7"
            r="5"
            fill="none"
            stroke={theme.accent}
            strokeWidth="1.8"
            strokeDasharray={`${(31.416 * fill) / 100} 31.416`}
            transform="rotate(-90 7 7)"
          />
        </svg>
        <span>{fill}% filled</span>
      </Layer>
      <Layer
        x={10}
        y={86}
        w={280}
        style={{
          ...row,
          justifyContent: "space-between",
          fontSize: 12,
          color: "#bbb8c6",
        }}
      >
        <span>
          Margin{" "}
          <span style={{ color: "white", fontSize: 15, marginLeft: 4 }}>
            {c.margin}
          </span>
        </span>
        <span>
          Lev. size{" "}
          <span style={{ color: "white", fontSize: 15, marginLeft: 4 }}>
            {c.orderSize}
          </span>
        </span>
      </Layer>
    </Layer>
  );
}
