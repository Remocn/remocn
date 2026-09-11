import { Interactive } from "remotion";
import type { SceneProps } from "../content";
import { move, typed } from "../motion";
import { mono } from "../ui";

export function ToolRun({ scene, t }: SceneProps) {
  const local = t - 16.8;
  return (
    <Interactive.Div
      name="Tool execution log"
      style={{
        position: "absolute",
        left: 85,
        top: 54,
        width: 320,
        height: 173,
        background: "#14263a",
        boxSizing: "border-box",
        padding: "24px 26px",
        color: "#a0a0a0",
        fontFamily: mono,
        fontSize: 10.5,
        lineHeight: "16px",
        opacity: move(local, 0, 0.22) * (1 - move(t, 19.75, 19.9)),
        clipPath: `inset(${move(t, 18.8, 19.6, 0, 32)}% 0 0 0)`,
        scale: move(local, 0, 2.5, 0.93, 1.02),
      }}
    >
      {scene.tools.map((text, i) => (
        <div
          key={text}
          style={{
            opacity: local >= i * 0.15 ? 1 : 0,
            whiteSpace: "nowrap",
            color: i === 1 || i === 3 || i === 6 ? "#8198ae" : "#b9ccdc",
          }}
        >
          <span style={{ color: "#bababa", marginRight: 7 }}>◆</span>
          {typed(text, local, i * 0.15, i * 0.15 + 0.43)}
        </div>
      ))}
    </Interactive.Div>
  );
}
