import { Easing, Interactive } from "remotion";
import type { SceneProps } from "../content";
import { move, ramp, typed } from "../motion";
import { AccentText, mono } from "../ui";

export function Delivery({ scene, t }: SceneProps) {
  const c = scene.content;
  const full = `${c.campaign} is ${c.delivery} -`;
  return (
    <Interactive.Div
      name="Release rollout response"
      style={{
        position: "absolute",
        top: 115,
        left: move(t, 19.5, 21.7, 155, 70),
        fontFamily: mono,
        fontSize: 18,
        lineHeight: "25px",
        color: "#e6e6e6",
        width: 560,
        opacity: 1 - move(t, 21.75, 22),
        maskImage: "linear-gradient(90deg,#000 20%,transparent 90%)",
      }}
    >
      <div style={{ whiteSpace: "pre" }}>
        <AccentText
          text={typed(full, t, 19.8, 20.35)}
          fullText={full}
          highlight={c.delivery}
          accent={scene.accent}
        />
      </div>
      <div style={{ color: "#9ab0c4", opacity: 0.85, whiteSpace: "pre" }}>
        {typed(c.deliveryDetail, t, 20, 20.8)}
      </div>
    </Interactive.Div>
  );
}

export function Recommendation({ scene, t }: SceneProps) {
  const c = scene.content;
  const scale = move(t, 35.5, 37.15, 1, 1.65, Easing.linear);
  const full = c.recommendation;
  const target =
    move(
      t,
      32.85,
      35.5,
      Math.min(11, full.length * 0.25),
      Math.min(25, full.length * 0.55),
      Easing.linear,
    ) +
    move(
      t,
      35.5,
      37.2,
      0,
      Math.max(0, full.length - 4 - Math.min(25, full.length * 0.55)),
      Easing.linear,
    );
  const left = 240 - target * 26 * 0.6 * scale;
  const budget = `${c.budgetLabel}: ${c.oldBudget} → ${c.newBudget}.`;
  return (
    <Interactive.Div
      name="Pipeline recommendation"
      style={{
        position: "absolute",
        left,
        top: move(t, 34.8, 37.15, 106, 112),
        fontFamily: mono,
        fontSize: 26,
        lineHeight: "37px",
        width: 1800,
        color: "#e9e9e9",
        scale,
        transformOrigin: "0 0",
        whiteSpace: "pre",
        opacity: 1 - move(t, 37.15, 37.35),
      }}
    >
      <div>
        <AccentText
          text={typed(full, t, 32.85, 33.9)}
          fullText={full}
          accent={scene.accent}
        />
      </div>
      <div style={{ color: "#9ab0c4", opacity: 1 - ramp(t, 35.9, 36.7) }}>
        <AccentText
          text={typed(budget, t, 33.35, 34.6)}
          fullText={budget}
          highlight={c.newBudget}
          accent={scene.accent}
        />
      </div>
    </Interactive.Div>
  );
}
