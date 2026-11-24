"use client";

import { useSceneConfig, useSceneFrame } from "@/lib/remocn/frame-rate";
import { type Timing, useTimeline } from "@/lib/remocn/timeline";
import {
  CHARS_PER_FRAME,
  EVENTS,
  type LiveCodeCompilationElementId,
  liveCodeCompilationTimeline,
  typingFrames,
  type UIState,
} from "./timeline";

export interface LiveCodeCompilationProps {
  accentColor?: string;
  speed?: number;
  className?: string;
  /**
   * Moves, trims or stretches the typing of single code fragments, by the
   * ids in `./timeline`. Frames on the scene timeline, after `speed`.
   */
  timing?: Timing<LiveCodeCompilationElementId>;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";
const MONO_FAMILY =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

function highlightLine(line: string, accentColor: string) {
  // very simple tokenizer: keywords, strings, props
  const tokens: { text: string; color: string }[] = [];
  const regex =
    /(\bexport\b|\bfunction\b|\breturn\b)|("[^"]*")|(\b[a-zA-Z_][a-zA-Z0-9_]*)(?=:)|(\{|\}|\(|\)|<|>|\/)|([0-9]+)/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null = regex.exec(line);
  while (m !== null) {
    if (m.index > lastIndex) {
      tokens.push({
        text: line.slice(lastIndex, m.index),
        color: "#e4e4e7",
      });
    }
    if (m[1]) tokens.push({ text: m[1], color: "#c084fc" });
    else if (m[2]) tokens.push({ text: m[2], color: "#86efac" });
    else if (m[3]) tokens.push({ text: m[3], color: accentColor });
    else if (m[4]) tokens.push({ text: m[4], color: "#71717a" });
    else if (m[5]) tokens.push({ text: m[5], color: "#fbbf24" });
    lastIndex = regex.lastIndex;
    m = regex.exec(line);
  }
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), color: "#e4e4e7" });
  }
  return tokens;
}

export function LiveCodeCompilation(props: LiveCodeCompilationProps) {
  const { accentColor = "#3b82f6", speed = 1, className, timing } = props;
  const frame = useSceneFrame() * speed;
  const { durationInFrames } = useSceneConfig();
  const tl = useTimeline(
    liveCodeCompilationTimeline,
    props,
    durationInFrames * speed,
    timing,
  );
  const edits = tl.lane("Code");
  const TIMELINE_END = edits[edits.length - 1].end;

  // Build the visible code character-by-character from the auto-staggered
  // timeline. UI state only flips once a fragment is fully typed.
  let visibleCode = "";
  const ui: UIState = {};
  for (const [i, ev] of EVENTS.entries()) {
    const t = edits[i];
    if (frame < t.start) break;
    const elapsed = frame - t.start;
    // A trimmed or stretched fragment types faster or slower; untouched, the
    // ratio is exactly 1.
    const rate =
      t.length > 0
        ? CHARS_PER_FRAME * (typingFrames(ev.code) / t.length)
        : Number.POSITIVE_INFINITY;
    const charsTyped = Math.min(ev.code.length, Math.floor(elapsed * rate));
    visibleCode += ev.code.slice(0, charsTyped);
    if (frame >= t.end) Object.assign(ui, ev.ui);
  }

  const lines = visibleCode.split("\n");
  const buttonLabel = ui.label ?? "Button";

  // Blinking caret while typing is still in progress.
  const cursorVisible =
    frame < TIMELINE_END && Math.floor(frame / 12) % 2 === 0;
  const lastLineIndex = lines.length - 1;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        background: "#070708",
        overflow: "hidden",
        fontFamily: FONT_FAMILY,
        display: "flex",
      }}
    >
      {/* subtle backdrop gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(59,130,246,0.08), transparent 60%), radial-gradient(ellipse at 80% 70%, rgba(168,85,247,0.06), transparent 60%)",
        }}
      />

      {/* LEFT: Glass code window */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            position: "relative",
            borderRadius: 14,
            padding: 1,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.06) 100%)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.4)",
          }}
        >
          <div
            style={{
              borderRadius: 13,
              background: "rgba(12,12,14,0.85)",
              backdropFilter: "blur(20px)",
              overflow: "hidden",
            }}
          >
            {/* Title bar */}
            <div
              style={{
                height: 38,
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 6,
                  background: "#ff5f57",
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 6,
                  background: "#febc2e",
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  width: 11,
                  height: 11,
                  borderRadius: 6,
                  background: "#28c840",
                  opacity: 0.6,
                }}
              />
              <div
                style={{
                  marginLeft: 12,
                  fontSize: 12,
                  color: "rgba(255,255,255,0.45)",
                  fontFamily: MONO_FAMILY,
                }}
              >
                Button.tsx
              </div>
            </div>
            {/* Code body */}
            <div
              style={{
                padding: "20px 22px",
                fontFamily: MONO_FAMILY,
                fontSize: 14,
                lineHeight: 1.65,
                color: "#e4e4e7",
                minHeight: 360,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
              }}
            >
              {lines.map((line, i) => {
                const tokens = highlightLine(line, accentColor);
                const isLast = i === lastLineIndex;
                return (
                  <div key={i} style={{ display: "flex", whiteSpace: "pre" }}>
                    <span
                      style={{
                        width: 28,
                        color: "rgba(255,255,255,0.2)",
                        userSelect: "none",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>
                      {tokens.length === 0 ? (
                        <span> </span>
                      ) : (
                        tokens.map((t, j) => (
                          <span key={j} style={{ color: t.color }}>
                            {t.text}
                          </span>
                        ))
                      )}
                      {isLast && cursorVisible && (
                        <span
                          style={{
                            display: "inline-block",
                            width: 8,
                            height: 16,
                            marginLeft: 1,
                            verticalAlign: "text-bottom",
                            background: accentColor,
                          }}
                        />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Live preview */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderLeft: "1px solid rgba(255,255,255,0.05)",
          background:
            "repeating-conic-gradient(rgba(255,255,255,0.018) 0deg 90deg, transparent 90deg 180deg) 0 0 / 28px 28px",
        }}
      >
        {/* Preview label */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              background: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
            }}
          />
          <div
            style={{
              fontSize: 11,
              fontFamily: MONO_FAMILY,
              color: "rgba(255,255,255,0.5)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Preview · HMR
          </div>
        </div>

        {/* The button — all styles applied with no transition */}
        <button
          type="button"
          style={{
            background: ui.background ?? "rgba(255,255,255,0.06)",
            color: ui.color ?? "rgba(255,255,255,0.4)",
            padding: ui.padding ?? "10px 20px",
            borderRadius: ui.borderRadius ?? "4px",
            fontWeight: ui.fontWeight ?? 400,
            fontSize: 18,
            fontFamily: FONT_FAMILY,
            border: ui.background
              ? "none"
              : "1px dashed rgba(255,255,255,0.15)",
            cursor: "pointer",
            transition: "none",
            boxShadow: ui.background
              ? `0 10px 30px ${ui.background}55, 0 0 0 1px rgba(255,255,255,0.08)`
              : "none",
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
