import { AbsoluteFill, Interactive } from "remotion";
import type { SceneProps } from "../content";
import { fitSize, progress, slide } from "../motion";
import { FormStudyMark, Label } from "../ui";

export function ClosingIdentity({ scene, frame }: SceneProps) {
  const { theme, reducedMotion, content } = scene;
  const wordsOut = reducedMotion
    ? Number(frame >= 942)
    : slide(frame, 930, 944);
  const markIn = reducedMotion ? Number(frame >= 944) : slide(frame, 944, 959);
  const nameOut = reducedMotion
    ? Number(frame >= 1000)
    : slide(frame, 988, 1008);
  return (
    <AbsoluteFill style={{ background: theme.ink, color: theme.paper }}>
      {frame < 944
        ? scene.closingWords.map((word, index) => {
            const turn = slide(frame, 860 + index * 3, 883 + index * 3);
            const bounce = reducedMotion
              ? 0
              : Math.sin(
                  progress(frame, 806, 860) * Math.PI * 2 + index * 1.1,
                ) *
                (1 - turn) *
                17;
            const blockWidth = index === 0 ? 94 : 50;
            return (
              <Interactive.Div
                key={
                  index === 0
                    ? "first-word"
                    : index === 1
                      ? "second-word"
                      : "third-word"
                }
                name="Closing word tile"
                style={{
                  position: "absolute",
                  top: 241,
                  left: 88 + index * 292,
                  width: 200,
                  height: 65,
                  textAlign: "center",
                  perspective: 600,
                  opacity: 1 - wordsOut,
                  translate: `0 ${bounce - 20 * wordsOut}px`,
                }}
              >
                {!reducedMotion && turn < 0.5 ? (
                  <div
                    style={{
                      margin: "9px auto",
                      width: blockWidth,
                      height: 39,
                      background: theme.paper,
                      transform: `rotateX(${180 * turn}deg)`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      fontSize: fitSize(word, 42, 196),
                      fontWeight: 800,
                      letterSpacing: "-0.05em",
                      lineHeight: 1.2,
                      transform: reducedMotion
                        ? undefined
                        : `rotateX(${-180 * (1 - turn)}deg)`,
                    }}
                  >
                    {word}
                  </div>
                )}
              </Interactive.Div>
            );
          })
        : null}
      {frame >= 944 ? (
        <Interactive.Div
          name="Closing brand lockup"
          style={{
            position: "absolute",
            left: 100,
            width: 760,
            top: 175,
            height: 190,
            opacity: markIn,
            scale: reducedMotion ? 1 : 0.88 + 0.12 * markIn,
          }}
        >
          <div style={{ position: "absolute", left: 333, top: 44 * nameOut }}>
            <FormStudyMark scene={scene} color={theme.paper} size={94} />
          </div>
          <div
            style={{
              position: "absolute",
              top: 113,
              width: "100%",
              textAlign: "center",
              fontSize: fitSize(content.brandName, 40, 660),
              fontWeight: 800,
              letterSpacing: "-0.05em",
              opacity: 1 - nameOut,
              translate: `0 ${-12 * nameOut}px`,
            }}
          >
            {content.brandName}
          </div>
        </Interactive.Div>
      ) : null}
      <Label
        style={{
          position: "absolute",
          bottom: 26,
          left: 70,
          right: 70,
          textAlign: "center",
          fontSize: 11,
          color: theme.stone,
          opacity: reducedMotion
            ? Number(frame >= 1008)
            : slide(frame, 1006, 1024),
        }}
      >
        {content.footer}
      </Label>
    </AbsoluteFill>
  );
}
