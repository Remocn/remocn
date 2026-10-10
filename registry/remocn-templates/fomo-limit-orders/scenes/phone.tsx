import type { SceneProps } from "../content";
import { key, phoneBorderPoint, ramp, travel, tween } from "../motion";
import { AssetIcon, Badge, Layer, muted, row } from "../ui";

function PhoneUI({ t, content: c, theme }: SceneProps) {
  return (
    <>
      <Layer
        x={62}
        y={32}
        style={{ opacity: ramp(t, 3.85, 4.3), fontSize: 14, fontWeight: 600 }}
      >
        9:41
      </Layer>
      <Layer
        x={280}
        y={37}
        style={{ opacity: ramp(t, 3.85, 4.3), fontSize: 9, letterSpacing: 3 }}
      >
        ▮▮▮ ◔ ▰
      </Layer>
      <Layer x={54} y={73} style={{ ...row, gap: 14 }}>
        <span style={{ position: "relative", display: "flex" }}>
          <AssetIcon size={44} color={theme.accent} />
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "black",
              opacity: 1 - ramp(t, 3.5, 4.1),
              mixBlendMode: "darken",
            }}
          />
          <svg
            width="44"
            height="44"
            viewBox="0 0 40 40"
            style={{ position: "absolute", opacity: 1 - ramp(t, 3.5, 4.1) }}
          >
            <circle
              cx="20"
              cy="20"
              r="19.8"
              fill="none"
              stroke="#ffffff10"
              strokeWidth="0.4"
            />
            <path d="M9 25h5v6H9Zm8-8h5v14h-5Zm8-8h6v22h-6Z" fill="white" />
          </svg>
        </span>
        <div>
          <div style={{ ...row, gap: 8, fontSize: 16.5, letterSpacing: -0.5 }}>
            {c.ticker}
            <span
              style={{
                fontSize: 12,
                color: theme.accent,
                borderRadius: 3,
                padding: "1px 5px",
                background: `${theme.accent}25`,
                opacity: ramp(t, 3.35, 3.85),
              }}
            >
              {c.leverage}
            </span>
          </div>
          <div style={{ marginTop: 3, fontSize: 12, color: muted }}>
            {c.assetName.slice(
              0,
              Math.floor(tween(t, 3.28, 4.1, 0, c.assetName.length)),
            )}
          </div>
        </div>
      </Layer>
      <div style={{ opacity: ramp(t, 3.85, 4.3) }}>
        <Layer x={23} y={135} style={{ fontSize: 24, letterSpacing: -0.9 }}>
          {c.marketPrice}
        </Layer>
        <Layer x={24} y={169} style={{ fontSize: 12, color: theme.positive }}>
          ↑ $1.00 ({c.change})
        </Layer>
        <Layer x={22} y={215} w={355} h={110}>
          <svg width="355" height="110" viewBox="0 0 355 110" aria-hidden>
            {[20, 55, 90].map((y) => (
              <path
                key={y}
                d={`M0 ${y}H355`}
                stroke="#ffffff0a"
                strokeWidth="0.5"
              />
            ))}
            {Array.from({ length: 57 }, (_, i) => {
              const y =
                85 - i * 1.07 + Math.sin(i * 0.6) * 13 + Math.sin(i * 1.4) * 4;
              const positive = i % 5 !== 1 && i % 7 !== 2;
              return (
                <g
                  key={i}
                  stroke={positive ? theme.positive : "#cf495e"}
                  fill={positive ? theme.positive : "#cf495e"}
                >
                  <path d={`M${i * 6 + 2} ${y - 6}v20`} strokeWidth="0.6" />
                  <rect
                    x={i * 6}
                    y={y}
                    width="3.5"
                    height={5 + (i % 6)}
                    rx="0.3"
                  />
                </g>
              );
            })}
          </svg>
        </Layer>
        <Layer
          x={9}
          y={334}
          w={365}
          style={{
            ...row,
            justifyContent: "space-between",
            color: "#b5b2be",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <span>
            <span style={{ color: theme.positive }}>╂</span> 15m ⌃
          </span>
          {["1D", "1W", "3M", "6M", "1Y", "All"].map((s, i) => (
            <span
              key={s}
              style={{
                padding: 4,
                background: i === 0 ? "#2b2c26" : undefined,
                borderRadius: 4,
                color: i === 0 ? "white" : undefined,
              }}
            >
              {s}
            </span>
          ))}
          <span style={{ color: theme.positive, fontSize: 21 }}>ϟ</span>
        </Layer>
        <Layer
          x={17}
          y={379}
          w={366}
          h={138}
          style={{
            background: `linear-gradient(125deg, ${theme.ink}, ${theme.panel})`,
            borderRadius: 11,
            boxShadow: "inset 0 1px 8px #ffffff04",
          }}
        >
          <Layer x={11} y={9}>
            <Badge theme={theme}>{c.position}</Badge>
          </Layer>
          <Layer
            x={11}
            y={39}
            w={344}
            style={{
              ...row,
              justifyContent: "space-between",
              fontSize: 21,
              fontWeight: 500,
              letterSpacing: -1.1,
            }}
          >
            <span>{c.positionValue}</span>
            <span style={{ color: theme.positive }}>{c.positionProfit}</span>
          </Layer>
          <Layer x={11} y={70} style={{ fontSize: 13, color: muted }}>
            Lev. size <span style={{ color: "#e7e6ed" }}>{c.positionSize}</span>{" "}
            ({c.positionQuantity})
          </Layer>
          <Layer x={265} y={70} style={{ fontSize: 13, color: "#bab7c4" }}>
            <span style={{ color: theme.positive }}>▴</span> {c.positionReturn}
          </Layer>
          <Layer
            x={16}
            y={97}
            w={334}
            h={0.6}
            style={{ background: "#ffffff0b" }}
          />
          <Layer
            x={11}
            y={108}
            w={344}
            style={{
              ...row,
              justifyContent: "space-between",
              fontSize: 13,
              color: muted,
            }}
          >
            <span>
              Avg. entry{" "}
              <span style={{ color: "white", marginLeft: 6 }}>
                {c.entryPrice}
              </span>
            </span>
            <span>
              Liq. price{" "}
              <span style={{ color: "white", marginLeft: 6 }}>
                {c.liquidationPrice}
              </span>
            </span>
          </Layer>
        </Layer>
        <Layer
          x={28}
          y={541}
          w={345}
          style={{
            ...row,
            justifyContent: "space-between",
            color: theme.accent,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <span>
            <span style={{ color: muted, marginRight: 10 }}>＋</span>Add a note
          </span>
          <span>Add SL/TP</span>
        </Layer>
        <Layer x={51} y={575} style={{ fontSize: 11, color: muted }}>
          Overview　　Activity　　Details
        </Layer>
        <Layer
          x={24}
          y={593}
          w={350}
          h={44}
          style={{ ...row, gap: 15, fontSize: 13, fontWeight: 600 }}
        >
          <div
            style={{
              width: 43,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: 11,
              background: "#282c22",
              border: "1px solid #7e806c",
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24">
              <path d="m4 16 11-11 5 5-11 11-6 1Z" fill="white" />
              <path d="m13 7 5 5" stroke="#282c22" />
            </svg>
          </div>
          <div
            style={{
              background: theme.accent,
              color: theme.ink,
              borderRadius: 9,
              padding: "11px 14px",
              whiteSpace: "nowrap",
              boxShadow: "inset 0 1px 1px #ffffff99",
            }}
          >
            Close position
          </div>
          <div
            style={{
              background: theme.panel,
              color: theme.positive,
              borderRadius: 9,
              padding: "11px 32px",
            }}
          >
            Long
          </div>
        </Layer>
      </div>
    </>
  );
}

export function Phone(props: SceneProps) {
  const { t } = props;
  const push = tween(t, 4.63, 5.18, 0, 1, travel);
  const pull = tween(t, 6.04, 6.92, 0, 1, travel);
  const orbit = tween(t, 6.92, 7.7, 0, 1, travel);
  const openingScale = tween(t, 3.4, 4.3, 1.45, 1);
  const s = openingScale + 0.18 * push - 0.28 * pull + 0.55 * orbit;
  const x = tween(t, 3.4, 4.3, 62, 75) - 67 * push + 134 * pull + 95 * orbit;
  const y = tween(t, 3.4, 4.3, 9, 45) - 435 * push - 13 * pull - 309 * orbit;
  const dotTimes = [
    6.55, 6.75, 7, 7.25, 7.5, 7.65, 7.75, 7.8, 7.85, 7.9, 7.95, 8,
  ];
  const point = phoneBorderPoint(tween(t, 6.55, 7.75, 0, 1, travel));
  const dotX = tween(t, 7.85, 8, x + point.x * s, 240);
  const dotY = tween(t, 7.85, 8, y + point.y * s, 135);
  const radius = key(
    t,
    dotTimes,
    [4, 6, 6, 6.5, 7.5, 9.5, 12, 16, 24, 57, 160, 390],
  );
  return (
    <>
      <Layer
        w={480}
        h={270}
        style={{ background: "black", opacity: ramp(t, 2.7, 2.9) }}
      />
      <Layer
        x={x}
        y={y}
        w={400}
        h={680}
        style={{
          transform: `scale(${s})`,
          transformOrigin: "0 0",
          opacity: ramp(t, 2.7, 3),
          filter: `blur(${Math.sin(push * Math.PI) * 1.1}px)`,
        }}
      >
        <Layer
          w={400}
          h={680}
          style={{
            border: "1.7px solid #55584a",
            boxSizing: "border-box",
            borderRadius: 59,
            opacity: ramp(t, 3.65, 4.35) * (1 - 0.8 * push * (1 - pull)),
            boxShadow: "0 0 2px #ad926155, inset 0 0 4px #ad926122",
            background: "#000",
          }}
        />
        <Layer
          w={400}
          h={680}
          style={{
            borderLeft: "1.2px solid #e8b45a",
            boxSizing: "border-box",
            borderBottom: "1.2px solid #e8b45a",
            borderRadius: 59,
            opacity: ramp(t, 6.55, 7.2),
            maskImage: "linear-gradient(0deg, black, transparent 34%)",
            boxShadow: "-1px 1px 3px #d59b4044",
          }}
        />
        <div style={{ opacity: 1 - ramp(t, 7.78, 7.96), fontWeight: 500 }}>
          <PhoneUI {...props} />
        </div>
      </Layer>
      <Layer
        w={480}
        h={270}
        style={{
          opacity: Math.sin(push * Math.PI) * 0.24,
          background:
            "linear-gradient(120deg, transparent 10%, #ebc47b 53%, transparent 75%)",
          mixBlendMode: "screen",
        }}
      />
      <Layer
        w={480}
        h={270}
        style={{
          opacity: ramp(t, 6.1, 7),
          background:
            "linear-gradient(100deg, #000 0%, transparent 43%, #0004 66%, #000 96%)",
        }}
      />
      {t >= 6.55 && (
        <>
          <Layer
            x={dotX - radius * 2}
            y={dotY - radius * 2}
            w={radius * 4}
            h={radius * 4}
            style={{
              background: "#eed7a6",
              borderRadius: "50%",
              filter: `blur(${Math.min(10, radius)}px)`,
              opacity: t < 7.88 ? 0.2 : 0,
            }}
          />
          <Layer
            x={dotX - radius}
            y={dotY - radius}
            w={radius * 2}
            h={radius * 2}
            style={{
              background: "#fff",
              borderRadius: "50%",
              boxShadow: "0 0 4px #f6e3bf",
            }}
          />
        </>
      )}
    </>
  );
}
