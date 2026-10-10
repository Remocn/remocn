import { AbsoluteFill } from "remotion";
import type { SceneProps } from "../content";
import { slide } from "../motion";
import { Label } from "../ui";

export function Palette({ scene, frame }: SceneProps) {
  const { theme, reducedMotion } = scene;
  const x = (start: number, end: number, to: number) =>
    reducedMotion ? to : 960 + (to - 960) * slide(frame, start, end);
  const accentX = x(166, 201, 422);
  const panels = [
    { color: theme.accent, left: accentX, text: theme.paper },
    { color: theme.stone, left: x(211, 241, 566), text: theme.ink },
    { color: theme.paper, left: x(249, 279, 744), text: theme.ink },
  ];
  return (
    <AbsoluteFill
      style={{
        background: theme.ink,
        translate: reducedMotion
          ? undefined
          : `${-960 * slide(frame, 294, 326)}px 0`,
      }}
    >
      <Label
        style={{
          position: "absolute",
          left: accentX / 2,
          top: 258,
          translate: "-50% 0",
          color: theme.paper,
          fontSize: 16,
        }}
      >
        {theme.ink.toUpperCase()}
      </Label>
      {panels.map((panel, i) => (
        <div
          key={i === 0 ? "accent" : i === 1 ? "stone" : "paper"}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: panel.left,
            width: 960,
            background: panel.color,
            color: panel.text,
          }}
        >
          <Label
            style={{ position: "absolute", left: 16, top: 258, fontSize: 16 }}
          >
            {panel.color.toUpperCase()}
          </Label>
        </div>
      ))}
    </AbsoluteFill>
  );
}
