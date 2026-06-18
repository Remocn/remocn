"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
import { Input } from "@/components/remocn/input";
import { useInputTransition } from "@/components/remocn/use-input-transition";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { Skeleton } from "@/components/remocn/skeleton";
import { SkeletonBlock } from "@/components/remocn/skeleton-block";
import { useSkeletonTransition } from "@/components/remocn/use-skeleton-transition";
import { Toast } from "@/components/remocn/toast";
import { useToastTransition } from "@/components/remocn/use-toast-transition";

export interface AiPromptFlowProps {
  prompt?: string;
  buttonLabel?: string;
  answerLines?: string[];
  toastTitle?: string;
  mode?: "light" | "dark";
  theme?: Partial<RemocnTheme>;
}

const STAGE_W = 1280;
const PROMPT_W = 520;
const PROMPT_LEFT = (STAGE_W - PROMPT_W) / 2;
const PROMPT_TOP = 168;
const PROMPT_H = 92;

const BTN_W = 200;
const BTN_LEFT = (STAGE_W - BTN_W) / 2;
const BTN_TOP = 278;
const BTN_H = 64;

const ANSWER_W = 560;
const ANSWER_LEFT = (STAGE_W - ANSWER_W) / 2;
const ANSWER_TOP = 380;

const DEFAULT_ANSWER = [
  "The thread debates the Q3 roadmap: ship the editor first,",
  "defer billing to Q4, and pull the migration forward so",
  "infra is unblocked before the team scales next quarter.",
];

export function AiPromptFlow({
  prompt = "Summarize this thread",
  buttonLabel = "Generate",
  answerLines = DEFAULT_ANSWER,
  toastTitle = "Response ready",
  mode = "light",
  theme,
}: AiPromptFlowProps) {
  const resolved = useRemocnTheme(theme, mode);
  const opts = { mode, theme };

  const inputStyle = useInputTransition(
    [
      { at: 0, state: "active", duration: 1 },
      { at: 0, state: "typing", duration: 50 },
    ],
    opts,
  );

  const buttonStyle = useButtonTransition(
    [
      { at: 52, state: "hover", duration: 6 },
      { at: 58, state: "press", duration: 4 },
      { at: 62, state: "loading", duration: 4 },
    ],
    opts,
  );

  const skeletonStyle = useSkeletonTransition(
    [
      { at: 64, state: "loading", duration: 1 },
      { at: 150, state: "loaded", duration: 16 },
    ],
    { mode },
  );

  const panelOpacity = buttonStyle.spinnerOpacity;

  const toastStyle = useToastTransition(
    [
      { at: 160, state: "visible", duration: 14 },
      { at: 220, state: "hidden", duration: 14 },
    ],
    { mode },
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: resolved.background,
      }}
    >
      {}
      <div
        style={{
          position: "absolute",
          left: PROMPT_LEFT,
          top: PROMPT_TOP,
          width: PROMPT_W,
          height: PROMPT_H,
        }}
      >
        <Input
          placeholder="Ask anything…"
          value={prompt}
          style={inputStyle}
          mode={mode}
          theme={theme}
        />
      </div>

      {}
      <div
        style={{
          position: "absolute",
          left: BTN_LEFT,
          top: BTN_TOP,
          width: BTN_W,
          height: BTN_H,
        }}
      >
        <Button
          label={buttonLabel}
          style={buttonStyle}
          mode={mode}
          theme={theme}
        />
      </div>

      {}
      <div
        style={{
          position: "absolute",
          left: ANSWER_LEFT,
          top: ANSWER_TOP,
          width: ANSWER_W,
          display: "flex",
          justifyContent: "center",
          opacity: panelOpacity,
        }}
      >
        <Skeleton
          style={skeletonStyle}
          theme={theme}
          placeholder={
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                width: ANSWER_W,
              }}
            >
              {answerLines.map((_, i) => (
                <SkeletonBlock
                  key={i}
                  width={i === answerLines.length - 1 ? "70%" : "100%"}
                  height={18}
                  baseColor={resolved.muted}
                />
              ))}
            </div>
          }
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: ANSWER_W,
              fontFamily:
                "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
              fontSize: 18,
              lineHeight: 1.45,
              letterSpacing: "-0.01em",
              color: resolved.foreground,
            }}
          >
            {answerLines.map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </div>
        </Skeleton>
      </div>

      {}
      <div style={{ position: "absolute", right: 32, bottom: 32 }}>
        <Toast
          title={toastTitle}
          variant="success"
          style={toastStyle}
          theme={theme}
        />
      </div>
    </div>
  );
}
