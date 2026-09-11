import { Interactive } from "remotion";
import { type SceneProps, type TerminalRun, terminalContent } from "../content";
import { move, ramp, typed } from "../motion";
import { AccentText, Command, mono } from "../ui";

function Terminal({
  scene,
  t,
  run,
  start,
  end,
}: SceneProps & { run: TerminalRun; start: number; end: number }) {
  const rows = scene.terminalRows[run]?.length
    ? scene.terminalRows[run]
    : terminalContent(run, scene.content);
  const local = t - start;
  const departure = move(t, end - (run === "launched" ? 0.15 : 0.65), end);
  return (
    <>
      <Interactive.Div
        name="Campaign terminal"
        style={{
          position: "absolute",
          left: 50,
          top: 36,
          width: 380,
          height: 204,
          padding: "13px 14px 12px",
          boxSizing: "border-box",
          background: "#14263a",
          fontFamily: mono,
          fontSize: 6.4,
          color: "#c1d4e2",
          overflow: "hidden",
          opacity: move(t, start, start + 0.23) * (1 - departure * 0.8),
          translate: `${-departure * 390}px 0px`,
          scale: move(t, start, start + 0.45, 0.92, 1),
          transformOrigin: "50% 60%",
          maskImage:
            "linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 5.5,
            color: "#839bb0",
            height: 20,
          }}
        >
          <span>{scene.content.terminalTitle}</span>
          <span>⌘ K　▥</span>
        </div>
        <div style={{ height: 142, overflow: "hidden" }}>
          {rows.map((row, i) => (
            <div
              key={`${i}-${row.at}`}
              style={{
                minHeight: row.kind === "thought" ? 8 : 12.5,
                marginTop:
                  row.kind === "prompt" && i > 0
                    ? 8
                    : row.kind === "result"
                      ? 5
                      : 0,
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                lineHeight: "10px",
                color:
                  row.kind === "thought"
                    ? "#718ba1"
                    : row.kind === "note"
                      ? "#96aabd"
                      : row.kind === "result"
                        ? scene.accent
                        : "#c1d4e2",
                fontSize: row.kind === "thought" ? 5 : 6.4,
                opacity: local >= row.at ? 1 : 0,
              }}
            >
              {row.kind === "prompt" ? "❯ " : ""}
              <AccentText
                text={typed(
                  row.text,
                  local,
                  row.at,
                  row.at + (row.kind === "thought" ? 0.05 : 0.28),
                )}
                highlight={row.highlight}
                fullText={row.text}
                accent={scene.accent}
              />
            </div>
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 25,
            height: 13,
            border: "0.4px solid #3b536c",
            display: "flex",
            alignItems: "center",
            paddingLeft: 5,
            color: "#d8d8d8",
          }}
        >
          ❯
        </div>
        <div
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 10,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 4.6,
            color: "#8ba4ba",
          }}
        >
          <span>
            Send enter　Mode tab　History ↑↓　Multiline ⇧↵　Quit ^C　Commands /
          </span>
          <span>[1]</span>
        </div>
      </Interactive.Div>
      {run === "campaign" && t > 10.3 ? (
        <div style={{ opacity: ramp(t, 10.3, 10.7) }}>
          <Command
            text={scene.content.launchCommand}
            t={t}
            start={10.3}
            finish={11.23}
            end={12.7}
          />
        </div>
      ) : null}
      {run === "stats" && t > 31 ? (
        <div style={{ opacity: ramp(t, 31, 31.4) }}>
          <Command
            text={scene.content.changeCommand}
            t={t}
            start={31}
            finish={32.24}
            end={32.85}
          />
        </div>
      ) : null}
    </>
  );
}

export const AnalysisTerminal = (props: SceneProps) => (
  <Terminal {...props} run="campaign" start={8.1} end={10.7} />
);
export const LaunchedTerminal = (props: SceneProps) => (
  <Terminal {...props} run="launched" start={22} end={24} />
);
export const StatsTerminal = (props: SceneProps) => (
  <Terminal {...props} run="stats" start={27.8} end={31.4} />
);
