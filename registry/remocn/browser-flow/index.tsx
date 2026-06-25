"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface BrowserFlowProps {
  url?: string;
  speed?: number;
  className?: string;
}

const FONT_FAMILY =
  "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif";
const MONO_FAMILY =
  "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace";

function MacDots({ size = 12 }: { size?: number }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <div
          key={c}
          style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: c,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  );
}

function CursorSVG() {
  return (
    <svg width="22" height="28" viewBox="0 0 22 28" fill="none">
      <path
        d="M2 2L2 22L7 17.5L10.5 25L13.5 23.5L10 16L17 16L2 2Z"
        fill="white"
        stroke="black"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

export function BrowserFlow({
  url = "remocn.dev",
  speed = 1,
  className,
}: BrowserFlowProps) {
  const frame = useCurrentFrame() * speed;
  const { fps } = useVideoConfig();

  // ── Browser dimensions ────────────────────────────
  const browserWidth = 1100;
  const browserHeight = 620;
  const chromeHeight = 56;
  const browserLeft = (1280 - browserWidth) / 2;
  const browserTop = (720 - browserHeight) / 2;

  // ── URL typing (frames 0..40) ─────────────────────
  const typingProgress = interpolate(frame, [4, 38], [0, url.length], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const typedChars = Math.floor(typingProgress);
  const typedUrl = url.slice(0, typedChars);
  const showCaret = frame < 50 && Math.floor(frame / 12) % 2 === 0;

  // Autocomplete suggestion appears once a few chars typed
  const showSuggestion = typedChars >= 2 && frame < 48;
  const suggestion = url;

  // ── Progress bar ──────────────────────────────────
  // 40..50: 0 -> 15
  // 50..65: hold at 15
  // 65..85: 15 -> 100
  // 85..95: fade out
  let progress = 0;
  if (frame < 40) progress = 0;
  else if (frame < 50)
    progress = interpolate(frame, [40, 50], [0, 15], {
      extrapolateRight: "clamp",
    });
  else if (frame < 65) progress = 15;
  else if (frame < 85)
    progress = interpolate(frame, [65, 85], [15, 100], {
      extrapolateRight: "clamp",
    });
  else progress = 100;

  const progressOpacity =
    frame < 40
      ? 0
      : frame < 85
        ? 1
        : interpolate(frame, [85, 95], [1, 0], {
            extrapolateRight: "clamp",
          });

  // ── Page render ───────────────────────────────────
  const pageStart = 95;
  const pageOpacity = interpolate(frame, [pageStart, pageStart + 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Page scroll & cursor motion ───────────────────
  const scrollStart = 115;
  const scrollEnd = 230;
  const scrollT = interpolate(frame, [scrollStart, scrollEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scrollEased = easeInOut(scrollT);
  const maxScroll = 600;
  const scrollY = scrollEased * maxScroll;

  // Cursor path: starts off the address bar area, moves down toward CTA inside viewport
  // Coordinates relative to the full 1280x720 frame.
  const cursorStartX = browserLeft + 380;
  const cursorStartY = browserTop + chromeHeight + 60;
  const cursorEndX = browserLeft + browserWidth / 2;
  const cursorEndY = browserTop + chromeHeight + 380;

  const cursorT = interpolate(frame, [pageStart + 5, scrollEnd], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cursorEased = easeInOut(cursorT);
  // arc bias on Y for organic feel
  const arcOffset = Math.sin(cursorEased * Math.PI) * 30;
  const cursorX =
    cursorStartX + (cursorEndX - cursorStartX) * cursorEased + arcOffset * 0.6;
  const cursorY =
    cursorStartY + (cursorEndY - cursorStartY) * cursorEased - arcOffset;

  // Click animation near the end
  const clickFrame = scrollEnd + 4;
  const clickSpring = spring({
    frame: frame - clickFrame,
    fps,
    config: { mass: 0.4, damping: 12, stiffness: 220 },
    durationInFrames: 18,
  });
  const cursorClickScale = interpolate(clickSpring, [0, 0.4, 1], [1, 0.85, 1], {
    extrapolateRight: "clamp",
  });
  const buttonClickScale =
    frame >= clickFrame
      ? interpolate(clickSpring, [0, 0.4, 1], [1, 0.98, 1], {
          extrapolateRight: "clamp",
        })
      : 1;

  // Address bar focus state (highlighted while typing)
  const addressFocused = frame < 50;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        fontFamily: FONT_FAMILY,
      }}
    >
      {/* Browser window */}
      <div
        style={{
          position: "absolute",
          left: browserLeft,
          top: browserTop,
          width: browserWidth,
          height: browserHeight,
          borderRadius: 16,
          overflow: "hidden",
          background: "#0a0a0c",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 50px 120px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Chrome */}
        <div
          style={{
            position: "relative",
            height: chromeHeight,
            display: "flex",
            alignItems: "center",
            gap: 14,
            paddingLeft: 18,
            paddingRight: 18,
            background: "rgba(20,20,24,0.95)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <MacDots />
          {/* nav arrows */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginLeft: 8,
              color: "rgba(255,255,255,0.35)",
              fontSize: 16,
            }}
          >
            <span>‹</span>
            <span>›</span>
          </div>
          {/* address bar */}
          <div
            style={{
              flex: 1,
              position: "relative",
              height: 32,
              borderRadius: 16,
              background: addressFocused
                ? "rgba(255,255,255,0.08)"
                : "rgba(255,255,255,0.05)",
              border: `1px solid ${
                addressFocused
                  ? "rgba(120,160,255,0.45)"
                  : "rgba(255,255,255,0.07)"
              }`,
              display: "flex",
              alignItems: "center",
              paddingLeft: 14,
              paddingRight: 14,
              fontFamily: MONO_FAMILY,
              fontSize: 13,
              color: "rgba(255,255,255,0.85)",
              boxShadow: addressFocused
                ? "0 0 0 3px rgba(120,160,255,0.12)"
                : "none",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.4)", marginRight: 8 }}>
              ⌕
            </span>
            <span>{typedUrl}</span>
            {showCaret && (
              <span
                style={{
                  display: "inline-block",
                  width: 1.5,
                  height: 16,
                  background: "rgba(255,255,255,0.85)",
                  marginLeft: 1,
                }}
              />
            )}

            {/* Autocomplete suggestion dropdown */}
            {showSuggestion && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "calc(100% + 6px)",
                  background: "rgba(22,22,26,0.98)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10,
                  padding: "10px 14px",
                  fontFamily: MONO_FAMILY,
                  fontSize: 13,
                  color: "rgba(255,255,255,0.85)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                  zIndex: 10,
                }}
              >
                <span style={{ color: "rgba(255,255,255,0.4)" }}>↗</span>
                <span>
                  <span style={{ color: "white" }}>{typedUrl}</span>
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>
                    {suggestion.slice(typedChars)}
                  </span>
                </span>
              </div>
            )}
          </div>
          <div style={{ width: 60 }} />

          {/* Progress bar */}
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 2,
              opacity: progressOpacity,
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)",
                boxShadow: "0 0 8px rgba(96,165,250,0.6)",
              }}
            />
          </div>
        </div>

        {/* Page viewport */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: chromeHeight,
            bottom: 0,
            overflow: "hidden",
            background: "#0a0a0c",
            opacity: pageOpacity,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              transform: `translateY(${-scrollY}px)`,
              willChange: "transform",
            }}
          >
            {/* Header */}
            <div
              style={{
                height: 68,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 60px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  color: "white",
                  letterSpacing: "-0.02em",
                }}
              >
                remocn
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 28,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.65)",
                }}
              >
                <span>Components</span>
                <span>Docs</span>
                <span>GitHub</span>
              </div>
            </div>

            {/* Hero */}
            <div
              style={{
                padding: "100px 60px 80px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  color: "rgba(120,160,255,0.85)",
                  fontWeight: 500,
                  letterSpacing: "0.02em",
                }}
              >
                shadcn registry for Remotion
              </div>
              <div
                style={{
                  fontSize: 64,
                  fontWeight: 700,
                  letterSpacing: "-0.04em",
                  color: "white",
                  lineHeight: 1.05,
                  maxWidth: 720,
                }}
              >
                Production-ready video blocks.
              </div>
              <div
                style={{
                  fontSize: 17,
                  color: "rgba(255,255,255,0.6)",
                  maxWidth: 520,
                  lineHeight: 1.5,
                }}
              >
                Drop-in animations, transitions, and backgrounds for Remotion.
                Own your code.
              </div>

              {/* CTA — clicked at the end */}
              <button
                type="button"
                style={{
                  marginTop: 12,
                  padding: "16px 32px",
                  borderRadius: 12,
                  background: "white",
                  color: "#0a0a0c",
                  fontFamily: FONT_FAMILY,
                  fontSize: 15,
                  fontWeight: 600,
                  border: "none",
                  transform: `scale(${buttonClickScale})`,
                  boxShadow:
                    frame >= clickFrame
                      ? "0 0 0 6px rgba(255,255,255,0.08)"
                      : "0 10px 30px rgba(255,255,255,0.1)",
                  willChange: "transform",
                }}
              >
                Browse components →
              </button>
            </div>

            {/* Sections */}
            {[
              { title: "Typography", color: "#3b82f6" },
              { title: "Backgrounds", color: "#a855f7" },
              { title: "Transitions", color: "#22c55e" },
            ].map((s) => (
              <div
                key={s.title}
                style={{
                  margin: "40px 60px",
                  padding: "40px",
                  borderRadius: 16,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 14,
                    background: `${s.color}22`,
                    border: `1px solid ${s.color}55`,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: "white",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: "rgba(255,255,255,0.55)",
                    }}
                  >
                    Hand-tuned primitives, copied straight into your project.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Virtual cursor */}
      {frame >= pageStart && (
        <div
          style={{
            position: "absolute",
            left: cursorX,
            top: cursorY,
            transform: `scale(${cursorClickScale})`,
            transformOrigin: "top left",
            zIndex: 9999,
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
            willChange: "transform",
          }}
        >
          <CursorSVG />
        </div>
      )}
    </div>
  );
}
