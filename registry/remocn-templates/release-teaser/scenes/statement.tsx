import { Interactive, interpolate } from "remotion";
import type { ReleaseTeaserScene } from "../content";
import { characterState, fitText, graphemes } from "../motion";

export function Statement({
  scene,
  text,
  frame,
  duration,
}: {
  scene: ReleaseTeaserScene;
  text: string;
  frame: number;
  duration: number;
}) {
  return (
    <Interactive.Div
      name="Statement"
      role="img"
      aria-label={text}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        fontSize: fitText(text),
        fontWeight: 500,
        lineHeight: 1.13,
        color: scene.theme.foreground,
        scale: scene.reducedMotion
          ? 1
          : interpolate(frame, [0, duration], [0.99, 1.025], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
      }}
    >
      {text.split("\n").map((line, lineIndex) => {
        const chars = graphemes(line);
        return (
          <div
            key={`${lineIndex}-${line}`}
            style={{
              whiteSpace: "pre",
              textAlign: "center",
              minHeight: "1.13em",
            }}
          >
            {scene.reducedMotion
              ? line
              : chars.map((char, index) => {
                  const state = characterState(
                    frame,
                    duration,
                    index,
                    chars.length,
                  );
                  return (
                    <span
                      key={`${index}-${char}`}
                      style={{
                        display: "inline-block",
                        opacity: state.opacity,
                        filter:
                          state.blur > 0.08
                            ? `blur(${state.blur}px)`
                            : undefined,
                        translate: `0 ${state.y}px`,
                      }}
                    >
                      {char}
                    </span>
                  );
                })}
          </div>
        );
      })}
    </Interactive.Div>
  );
}
