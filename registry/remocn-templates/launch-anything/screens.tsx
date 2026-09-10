import { useId } from "react";
import type { SceneProps } from "./content";
import { clamp, getShowcase, key, tween } from "./motion";
import { LogoGlyph } from "./ui";

const surface = {
  position: "absolute" as const,
  inset: 0,
  overflow: "hidden" as const,
  background: "#fcfaf7",
  color: "#302921",
};

function Dashboard({ scene, t }: SceneProps) {
  const p = tween(t, 7.33, 8.25);
  const id = useId();
  return (
    <div style={{ ...surface, fontSize: 9 }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 112,
          padding: 17,
          background: "#faf8f6",
          borderRight: "1px solid #e8e4df",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 26 }}>
          ◈ Overview
        </div>
        {[
          "Workspace",
          "Overview",
          "Analytics",
          "Projects",
          "Customers",
          "Reports",
          "Settings",
        ].map((label, i) => (
          <div
            key={label}
            style={{
              padding: "10px 2px",
              color: i === 1 ? scene.accent : "#958b86",
              background: i === 1 ? "#efedf9" : undefined,
              borderRadius: 4,
            }}
          >
            {label}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 134, top: 22, right: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          <span>Good morning, Alex</span>
          <span style={{ fontSize: 9, color: "#94837a" }}>This month ▾</span>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          {[
            ["Revenue", "$48,290"],
            ["Customers", "2,408"],
            ["Conversion", "8.42%"],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                flex: 1,
                padding: 13,
                border: "1px solid #e8e2dc",
                borderRadius: 7,
              }}
            >
              <div style={{ color: "#a7978e" }}>{label}</div>
              <div style={{ fontSize: 19, marginTop: 9 }}>{value}</div>
              <div style={{ color: "#6b9869", fontSize: 7, marginTop: 5 }}>
                ↗ 12.5% from last month
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 14, marginTop: 20 }}>
          <div
            style={{
              width: 285,
              padding: 12,
              border: "1px solid #e8e2dc",
              borderRadius: 7,
            }}
          >
            <b>Revenue overview</b>
            <svg
              width="258"
              height="153"
              viewBox="0 0 258 153"
              role="img"
              aria-label="Revenue growth chart"
            >
              <defs>
                <linearGradient id={id} x2="0" y2="1">
                  <stop stopColor={scene.accent} />
                  <stop offset="1" stopColor="#c5b9ef" />
                </linearGradient>
              </defs>
              {[0, 1, 2, 3].map((n) => (
                <path key={n} d={`M0 ${20 + n * 35}H258`} stroke="#e8e3de" />
              ))}
              {[53, 89, 68, 104, 75, 113, 81, 131].map((h, i) => (
                <g key={i}>
                  <rect
                    x={i * 31 + 5}
                    y={145 - h * p}
                    width="10"
                    height={h * p}
                    rx="3"
                    fill={`url(#${id})`}
                  />
                  <rect
                    x={i * 31 + 17}
                    y={145 - h * 0.67 * p}
                    width="8"
                    height={h * 0.67 * p}
                    rx="3"
                    fill="#d9a39c"
                  />
                </g>
              ))}
            </svg>
          </div>
          <div
            style={{
              flex: 1,
              border: "1px solid #e8e2dc",
              padding: 11,
              borderRadius: 7,
            }}
          >
            <b>Recent activity</b>
            {[
              "New customer",
              "Payment received",
              "Project completed",
              "New subscription",
              "Order confirmed",
            ].map((label, n) => (
              <div
                key={label}
                style={{ display: "flex", gap: 6, marginTop: 18, fontSize: 8 }}
              >
                <span style={{ color: scene.accent }}>●</span>
                <span>
                  {label}
                  <small
                    style={{ display: "block", color: "#b0a59e", marginTop: 4 }}
                  >
                    {n * 4 + 2} minutes ago
                  </small>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Shoppers({ scene, t }: SceneProps) {
  const p = tween(t, 8.433, 9.1);
  return (
    <div style={{ ...surface, background: "#fdfbec" }}>
      <div
        style={{
          textAlign: "center",
          color: scene.accent,
          fontSize: 41,
          fontWeight: 800,
          letterSpacing: "-0.055em",
          paddingTop: 34,
        }}
      >
        {scene.content.shoppers}
      </div>
      {[
        [-80, 120, "#619bea"],
        [515, 280, "#fd9476"],
        [500, 85, "#f4e768"],
        [40, 310, "#eb8dba"],
      ].map(([x, y, color], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: Number(x) + Math.sin(t * 3 + i) * 15,
            top: Number(y),
            width: 50,
            height: 50,
            background: String(color),
            borderRadius: i % 2 ? "30%" : "4px",
            transform: `rotate(${i * 30 + t * 15}deg)`,
            boxShadow: "inset 0 4px 5px #ffffff70, 3px 6px 2px #0002",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 198,
          top: 115,
          width: 235,
          height: 406,
          borderRadius: 38,
          border: "7px solid #24202e",
          background: "#fcfaff",
          transform: `translateY(${(1 - p) * 135}px) rotateY(${(1 - p) * 75}deg) rotateZ(${tween(t, 8.43, 9.2, 8, -4)}deg)`,
          overflow: "hidden",
          boxShadow: "10px 14px 25px #32208224",
        }}
      >
        <div
          style={{
            width: 78,
            height: 18,
            borderRadius: 20,
            background: "#201c26",
            margin: "6px auto",
          }}
        />
        <div
          style={{
            padding: "8px 18px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <b>alo</b>
          <span>♡ ☰</span>
        </div>
        <div
          style={{
            height: 140,
            margin: "6px 10px",
            borderRadius: 11,
            background:
              "linear-gradient(140deg, #a7ac80, #646b50 44%, #303c2c 45%, #bbb791 72%, #f2d6ba)",
            display: "flex",
            alignItems: "end",
            padding: 12,
            color: "#fff",
            fontSize: 24,
          }}
        >
          Find your flow.
        </div>
        <div style={{ padding: "12px 15px", fontSize: 13 }}>
          <b>Made for your every day.</b>
          <p style={{ fontSize: 9, color: "#827c82" }}>
            New season. New possibilities.
          </p>
          <div
            style={{
              background: scene.accent,
              color: "#fff",
              padding: 12,
              borderRadius: 7,
              textAlign: "center",
            }}
          >
            Shop the collection
          </div>
        </div>
      </div>
    </div>
  );
}

function Exchange({ t }: SceneProps) {
  const p = tween(t, 9.25, 9.83);
  return (
    <div style={{ ...surface, background: "#060609", color: "#fff" }}>
      <div
        style={{
          paddingTop: 58,
          fontSize: 22,
          lineHeight: 1.22,
          textAlign: "center",
          opacity: p,
        }}
      >
        120+ Cryptocurrency, Equity &<br />
        Commodity pairs to trade
      </div>
      <div
        style={{
          position: "absolute",
          left: 270,
          top: 196,
          width: 104,
          height: 123,
          background: "linear-gradient(120deg,#f8dafc,#a453da 48%,#532289)",
          clipPath: "polygon(50% 0,100% 100%,60% 75%,50% 51%,34% 93%,0 100%)",
          transform: `rotateY(${t * 30}deg)`,
        }}
      />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * Math.PI) / 6 + t * 0.3;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 308 + Math.cos(angle) * 102 * p,
              top: 237 + Math.sin(angle) * 103 * p,
              width: 23,
              height: 23,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: "#d6c2f5",
              background: "#332442",
              border: "1px solid #8c66b8",
              boxShadow: "0 0 12px #9763a936",
              fontSize: 14,
            }}
          >
            {["₿", "Ξ", "S", "◎", "₮", "◈"][i % 6]}
          </div>
        );
      })}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: 53,
          borderTop: "1px solid #33313b",
          background: "linear-gradient(#16131f88, #08070b)",
        }}
      />
    </div>
  );
}

function Builder({ scene, t }: SceneProps) {
  const prompt = scene.content.builderPrompt.slice(
    0,
    Math.floor(clamp((t - 10.35) / 0.55) * scene.content.builderPrompt.length),
  );
  return (
    <div style={surface}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 27,
        }}
      >
        <div
          style={{ fontSize: 20, color: "#ad6b5f", letterSpacing: "-0.02em" }}
        >
          {scene.content.builder}
        </div>
        <div
          style={{
            border: "1px solid #ded9d3",
            borderRadius: 8,
            width: 565,
            height: 65,
            display: "flex",
            alignItems: "center",
            padding: 16,
            fontSize: 11,
            boxShadow: "0 5px 15px #38291604",
          }}
        >
          <span style={{ flex: 1 }}>
            {prompt}
            <span style={{ color: "#9c88e7" }}>│</span>
          </span>
          <span
            style={{
              width: 21,
              height: 23,
              borderRadius: 5,
              background: "linear-gradient(130deg,#829def,#8261cd)",
              color: "#fff",
              display: "grid",
              placeItems: "center",
            }}
          >
            ↑
          </span>
        </div>
      </div>
    </div>
  );
}

function Trading({ scene, t }: SceneProps) {
  return (
    <div style={{ ...surface, background: "#050604", color: "#f4f1df" }}>
      <div
        style={{
          position: "absolute",
          left: -28,
          top: 35,
          width: 215,
          height: 336,
          background: "#08100f",
          opacity: 0.7,
          transform: "rotateY(28deg) rotateZ(-7deg)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 12, fontSize: 10 }}>Market depth</div>
        {Array.from({ length: 25 }, (_, i) => (
          <div
            key={i}
            style={{
              marginTop: 6,
              height: 5,
              background: i < 11 ? "#632a36" : "#135d4c",
              width: 35 + ((i * 17) % 160),
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 158,
          top: 31,
          width: 217,
          height: 357,
          background: "linear-gradient(120deg,#0b0c0b,#080909)",
          border: "1px solid #32312b",
          borderRadius: 8,
          padding: 16,
          boxShadow: "8px 0 15px #d5b77810",
          transform: `perspective(900px) rotateY(${tween(t, 11.25, 12.35, -12, 0)}deg)`,
        }}
      >
        <div style={{ fontSize: 10 }}>Market　 Limit　 Stop</div>
        <div style={{ height: 1, background: "#34312a", marginTop: 16 }} />
        <div style={{ fontSize: 9, color: "#aba694", marginTop: 15 }}>
          Order type
        </div>
        <div style={{ fontSize: 13, marginTop: 8 }}>Market order　⌄</div>
        <div style={{ fontSize: 9, color: "#9f9d8c", marginTop: 22 }}>
          Amount (USD)
        </div>
        <div style={{ fontSize: 22, marginTop: 9 }}>
          $1,000
          <span style={{ fontSize: 10, float: "right", color: "#a09a81" }}>
            USD
          </span>
        </div>
        <div style={{ display: "flex", marginTop: 18, gap: 6 }}>
          <span
            style={{
              flex: 1,
              background: "#008963",
              textAlign: "center",
              padding: 9,
              fontSize: 13,
              borderRadius: 4,
            }}
          >
            Buy
          </span>
          <span
            style={{
              flex: 1,
              background: "#b2253c",
              textAlign: "center",
              padding: 9,
              fontSize: 13,
              borderRadius: 4,
            }}
          >
            Sell
          </span>
        </div>
        {[
          "Margin available",
          "Order value",
          "Trading fee",
          "Liquidation price",
        ].map((label, i) => (
          <div
            key={label}
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 18,
              fontSize: 8,
              color: "#8a877a",
            }}
          >
            <span>{label}</span>
            <span>{["$24,350.00", "$1,000.00", "$0.60", "$58,190.00"][i]}</span>
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: 395,
          top: 175,
          width: 222,
          whiteSpace: "pre-line",
          fontSize: 29,
          lineHeight: 1.14,
          letterSpacing: "-0.045em",
          opacity: tween(t, 11.25, 11.55),
          color: "#ecdfa7",
        }}
      >
        {scene.content.trading}
      </div>
    </div>
  );
}

function Loyalty({ scene, t }: SceneProps) {
  const age = t - 12.35;
  const grow = tween(age, 0.68, 1.5, 0, 1);
  const id = useId();
  const cards = [-1, 1];
  return (
    <div style={{ ...surface, background: "#fffef9" }}>
      {cards.map((side) => (
        <div
          key={side}
          style={{
            position: "absolute",
            left: 285 + side * (164 + grow * 68),
            top: 160 + side * grow * 21,
            width: 177,
            height: 130,
            background: "#fffefb",
            borderRadius: 8,
            border: "1px solid #e0dce4",
            padding: 14,
            boxShadow: `${side * 24}px 0 20px ${scene.accent}35`,
            transform: `rotate(${side * grow * 14}deg) translateX(${tween(age, 0, 0.4, side * 140, -70)}px)`,
            fontSize: 10,
          }}
        >
          <b>◎ Loyalty rewards</b>
          <p>Earn points on every purchase</p>
          {[80, 106, 63].map((width, n) => (
            <div
              key={n}
              style={{ height: 3, width, background: "#d9d5d9", marginTop: 9 }}
            />
          ))}
        </div>
      ))}
      <svg
        viewBox="0 0 260 280"
        width={95 + grow * 230}
        height={104 + grow * 248}
        role="img"
        aria-label="Purple loyalty mascot"
        style={{
          position: "absolute",
          left: 265 - grow * 97,
          top: 173 - grow * 104,
          transform: `rotate(${key(age, [0, 0.65, 1.4, 1.66], [0, -10, 16, 4])}deg)`,
        }}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
            <stop stopColor="#7772f5" />
            <stop offset="0.3" stopColor={scene.accent} />
            <stop offset="1" stopColor="#200780" />
          </linearGradient>
        </defs>
        <rect
          x="6"
          y="6"
          width="247"
          height="261"
          rx="62"
          fill={`url(#${id})`}
        />
        <ellipse cx="171" cy="45" rx="11" ry="20" fill="#fffdeb" />
        <ellipse cx="220" cy="47" rx="11" ry="20" fill="#fffdeb" />
        <ellipse cx="173" cy="47" rx="4" ry="9" fill="#130b43" />
        <ellipse cx="222" cy="49" rx="4" ry="9" fill="#130b43" />
        <path
          d={`M20 ${88 - grow * 12}Q117 ${57 - grow * 9} 217 96Q261 153 216 ${220 + grow * 17}Q110 275 20 218Q-14 149 20 88Z`}
          fill="#050407"
          stroke="#f9eb9b"
          strokeWidth="3"
        />
        {[0, 1, 2, 3, 4].map((n) => (
          <g key={n} fill="#f5e693">
            <rect
              x={31 + n * 40}
              y={66 + Math.abs(n - 2) * 6}
              width="25"
              height={33 + grow * 8}
              rx="10"
              transform={`rotate(${(n - 2) * 8} ${42 + n * 40} 84)`}
            />
            <rect
              x={27 + n * 39}
              y={217 - grow * 8}
              width="27"
              height="39"
              rx="10"
              transform={`rotate(${(n - 2) * 8} ${42 + n * 40} 232)`}
            />
          </g>
        ))}
      </svg>
      {[
        [-1, 65],
        [1, 70],
        [-1, 317],
      ].map(([side, y], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 302 + side * (205 + Math.sin(age * 3 + i) * 24),
            top: y,
            width: 26 + i * 5,
            height: 26 + i * 5,
            borderRadius: 5,
            background: i === 1 ? "#f4ff49" : scene.accent,
            transform: `rotate(${age * 70 + i * 30}deg)`,
            opacity: tween(age, 0.1 + i * 0.1, 0.45 + i * 0.1),
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 21,
          textAlign: "center",
        }}
      >
        <span
          style={{
            background: "#554941bf",
            color: "#fff",
            fontSize: 14,
            padding: "3px 7px",
          }}
        >
          {age > 1.35 ? scene.content.loyaltyPayoff : scene.content.loyalty}
        </span>
      </div>
    </div>
  );
}

function Integrations({ scene, t }: SceneProps) {
  const names = scene.content.integrations;
  const index = Math.min(
    names.length - 1,
    Math.floor(clamp((t - 14.017) / 1.1) * names.length),
  );
  const progress = (((t - 14.017) * names.length) / 1.1) % 1;
  return (
    <div
      style={{
        ...surface,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontSize: 17,
      }}
    >
      <span>{scene.content.integration}</span>
      <span
        style={{
          width: 33,
          height: 33,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          background: index === 0 ? "#271c29" : "#242326",
          color: index === 0 ? "#e6a749" : "white",
          transform: `scale(${tween(progress, 0, 0.3, 0.6, 1)})`,
        }}
      >
        <LogoGlyph variant={[2, 1, 6][index % 3]} size={22} />
      </span>
      <span
        style={{
          borderRadius: 5,
          color: "#fff",
          background: "#da4416",
          padding: "10px 13px",
          transform: `translateY(${tween(progress, 0, 0.3, 12, 0)}px)`,
          opacity: tween(progress, 0, 0.17),
        }}
      >
        {names[index]}
      </span>
    </div>
  );
}

export function ShowcaseScreen(props: SceneProps) {
  switch (getShowcase(props.t).id) {
    case "dashboard":
      return <Dashboard {...props} />;
    case "shoppers":
      return <Shoppers {...props} />;
    case "exchange":
      return <Exchange {...props} />;
    case "builder":
      return <Builder {...props} />;
    case "trading":
      return <Trading {...props} />;
    case "loyalty":
      return <Loyalty {...props} />;
    case "integrations":
      return <Integrations {...props} />;
  }
}
