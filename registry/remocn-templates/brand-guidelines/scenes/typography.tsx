import { AbsoluteFill, Interactive } from "remotion";
import { Caret } from "@/components/remocn/caret";
import type { SceneProps } from "../content";
import { fitSize, progress, slide, specimenState } from "../motion";
import { Label } from "../ui";

const styles = [
  { fontFamily: "Manrope", fontWeight: 800, label: "Manrope / ExtraBold" },
  { fontFamily: "Manrope", fontWeight: 400, label: "Manrope / Regular" },
  {
    fontFamily: "Inter",
    fontWeight: 500,
    fontStyle: "italic",
    label: "Inter / Medium Italic",
  },
  {
    fontFamily: "Inter",
    fontWeight: 300,
    fontStyle: "italic",
    label: "Inter / Light Italic",
  },
  { fontFamily: "Manrope", fontWeight: 800, label: "Manrope / ExtraBold" },
  { fontFamily: "Manrope", fontWeight: 500, label: "Manrope / Medium" },
  {
    fontFamily: "Inter",
    fontWeight: 500,
    fontStyle: "italic",
    label: "Inter / Medium Italic",
  },
  { fontFamily: "Manrope", fontWeight: 800, label: "Manrope / ExtraBold" },
] as const;

export function Typography({ scene, frame }: SceneProps) {
  const state = specimenState(frame, scene.phrases, scene.reducedMotion);
  const spec = styles[state.index];
  const fontSize = fitSize(state.fullText, 80, 850);
  const guides = 1 - progress(frame, 600, 620);
  return (
    <AbsoluteFill
      style={{
        background: scene.theme.paper,
        translate: scene.reducedMotion
          ? undefined
          : `${960 * (1 - slide(frame, 294, 326))}px 0`,
      }}
    >
      <div style={{ opacity: guides }}>
        <Label
          style={{
            position: "absolute",
            top: 195,
            width: "100%",
            textAlign: "center",
          }}
        >
          {scene.content.guidelinesLabel}
        </Label>
        {[226, 268, 310].map((y) => (
          <div
            key={y}
            style={{
              position: "absolute",
              left: 48,
              right: 48,
              top: y,
              height: 1,
              background: scene.theme.stone,
            }}
          />
        ))}
        <Label
          style={{
            position: "absolute",
            top: 335,
            width: "100%",
            textAlign: "center",
          }}
        >
          {spec.label}
        </Label>
      </div>
      <Interactive.Div
        name="Editable type specimen"
        style={{
          position: "absolute",
          left: 48,
          top: 216,
          height: 104,
          display: "flex",
          alignItems: "center",
          fontFamily: spec.fontFamily,
          fontWeight: spec.fontWeight,
          fontStyle: "fontStyle" in spec ? spec.fontStyle : "normal",
          fontSize,
          letterSpacing: "-0.055em",
          lineHeight: 1.1,
          whiteSpace: "nowrap",
          filter:
            !scene.reducedMotion && frame > 636
              ? `blur(${progress(frame, 636, 660) * 2}px)`
              : undefined,
        }}
      >
        <span>
          {state.caret ? state.settledText : state.text}
          {state.caret ? (
            <span style={{ color: scene.theme.accent }}>
              {state.activeText}
            </span>
          ) : null}
        </span>
        {state.caret ? (
          <Caret
            height={88}
            width={3}
            radius={0}
            marginLeft={5}
            color={scene.theme.accent}
            opacity={1}
          />
        ) : null}
      </Interactive.Div>
    </AbsoluteFill>
  );
}
