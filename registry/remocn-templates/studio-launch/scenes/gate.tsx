import type { SceneProps } from "../content";
import { Avatar } from "../interfaces";
import { ramp, smooth, tween } from "../motion";
import { Cursor, Glow, Headline, Landscape, Layer, row } from "../ui";

export function Gate(props: SceneProps) {
  const { t, content, accent } = props;
  if (t < 14.65)
    return (
      <>
        <Headline t={t} start={13.7667} size={24}>
          {content.gateHeadline}
        </Headline>
        <Glow t={t} accent={accent} />
      </>
    );
  const daylight = tween(t, 16.35, 17.05, 0, 1, smooth);
  const entered = tween(t, 14.65, 14.95);
  const h = 170 + daylight * 42;
  const fg = daylight > 0.5 ? "#141d28" : "#f3f8ff";
  return (
    <>
      <Landscape {...props} night={1 - daylight} />
      <Layer
        x={141}
        y={44 - daylight * 21 + (1 - entered) * 20}
        w={198}
        h={h}
        style={{
          opacity: entered,
          border: "0.6px solid #d8ebff66",
          borderRadius: 8,
          padding: 10,
          background: `rgba(${daylight > 0.5 ? "230,245,255" : "36,63,96"},0.4)`,
          backdropFilter: "blur(3px)",
          boxShadow: "0 5px 18px #051b4224",
          color: fg,
          fontSize: 7,
        }}
      >
        <div style={{ ...row, gap: 5, fontSize: 6 }}>
          <Avatar {...props} size={15} index={2} />
          <div>
            Marcus Jones
            <br />
            <span style={{ opacity: 0.5 }}>2h</span>
          </div>
          <span style={{ marginLeft: "auto" }}>···</span>
        </div>
        <div
          style={{
            marginTop: 11,
            fontWeight: 600,
            fontSize: 8,
            lineHeight: 1.3,
          }}
        >
          {content.postTitle}
        </div>
        <div style={{ marginTop: 10, fontSize: 6.4, lineHeight: 1.65 }}>
          Most reps lose the deal in the first ten seconds after “It's too
          expensive.”
          <br />
          Here's the exact framework I use when the conversation gets difficult.
        </div>
        <div
          style={{
            opacity: daylight,
            marginTop: 6,
            fontSize: 6.4,
            lineHeight: 1.7,
            height: 86 * daylight,
            overflow: "hidden",
          }}
        >
          You acknowledge the price concern, explain the outcome, and redirect
          the conversation to value.
          <br />
          You listen first. Ask what is really holding them back.
          <br />
          “Can I ask — what's it costing you right now to leave this unsolved?”
          <br />
          The quality of that question is worth more than another pitch.
          <br />
          Build trust. Make the next step clear.
        </div>
        <Layer
          x={10}
          y={111}
          w={178}
          h={42}
          style={{
            opacity: 1 - daylight,
            textAlign: "center",
            background: "linear-gradient(transparent,#2347679e)",
          }}
        >
          <div style={{ fontSize: 6, marginBottom: 5 }}>
            Unlock this post to keep reading
          </div>
          <div
            style={{
              background: "#397cff",
              borderRadius: 3,
              padding: 6,
              color: "white",
              transform: `scale(${1 - Math.sin(ramp(t, 16.25, 16.5) * Math.PI) * 0.02})`,
            }}
          >
            ♧ {content.unlockLabel}
          </div>
        </Layer>
        <Layer
          x={10}
          y={h - 21}
          w={178}
          style={{
            borderTop: "0.5px solid #ffffff44",
            paddingTop: 5,
            fontSize: 6,
          }}
        >
          ♡ 1.4K　♧ 74
        </Layer>
      </Layer>
      {t > 15.65 && (
        <Cursor
          x={tween(t, 15.65, 16.25, 388, 270)}
          y={tween(t, 15.65, 16.25, 265, 188) - daylight * 6}
          dark={daylight > 0.5}
          click={Math.sin(ramp(t, 16.25, 16.5) * Math.PI)}
        />
      )}
    </>
  );
}
