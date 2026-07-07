"use client";

import { BlurIn } from "@/components/remocn/blur-in";
import { Button } from "@/components/remocn/button";
import { Cursor } from "@/components/remocn/cursor";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/remocn/field";
import { Input } from "@/components/remocn/input";
import { Toast } from "@/components/remocn/toast";
import { useBlurInTransition } from "@/components/remocn/use-blur-in-transition";
import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { useInputTransition } from "@/components/remocn/use-input-transition";
import { useToastTransition } from "@/components/remocn/use-toast-transition";
import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

export interface SignupFlowProps {
  title?: string;
  description?: string;
  fullName?: string;
  email?: string;
  password?: string;
  createLabel?: string;
  googleLabel?: string;
  signinText?: string;
  toastTitle?: string;
  theme?: Partial<RemocnTheme>;
}

const STAGE_W = 1280;
const CARD_W = 376;
const CARD_TOP = 48;
const CARD_LEFT = (STAGE_W - CARD_W) / 2;
const CENTER_X = STAGE_W / 2;

const NAME_Y = 216;
const EMAIL_Y = 296;
const PASS_Y = 398;
const CONFIRM_Y = 500;
const CREATE_Y = 564;

export function SignupFlow({
  title = "Create an account",
  description = "Enter your information below to create your account",
  fullName = "John Doe",
  email = "m@example.com",
  password = "••••••••",
  createLabel = "Create account",
  toastTitle = "Account created",
  theme,
}: SignupFlowProps) {
  const resolved = useRemocnTheme(theme);
  const opts = { theme };

  const cardEnter = useBlurInTransition(
    [{ at: 0, state: "revealed", duration: 18 }],
    { distance: 0 },
  );
  const enterHeader = useBlurInTransition([
    { at: 18, state: "revealed", duration: 16 },
  ]);
  const enterName = useBlurInTransition([
    { at: 24, state: "revealed", duration: 16 },
  ]);
  const enterEmail = useBlurInTransition([
    { at: 30, state: "revealed", duration: 16 },
  ]);
  const enterPass = useBlurInTransition([
    { at: 36, state: "revealed", duration: 16 },
  ]);
  const enterConfirm = useBlurInTransition([
    { at: 42, state: "revealed", duration: 16 },
  ]);
  const enterButton = useBlurInTransition([
    { at: 48, state: "revealed", duration: 16 },
  ]);

  const DEMO = 48;

  const cursorStyle = useCursorPath([
    { at: 0, x: 160, y: 120 },
    { at: 18 + DEMO, x: CENTER_X, y: NAME_Y, duration: 18, click: true },
    { at: 52 + DEMO, x: CENTER_X, y: EMAIL_Y, duration: 30, click: true },
    { at: 96 + DEMO, x: CENTER_X, y: PASS_Y, duration: 40, click: true },
    { at: 134 + DEMO, x: CENTER_X, y: CONFIRM_Y, duration: 32, click: true },
    { at: 176 + DEMO, x: CENTER_X, y: CREATE_Y, duration: 38, click: true },
  ]);

  const nameStyle = useInputTransition(
    [
      { at: 18 + DEMO, state: "active", duration: 6 },
      { at: 20 + DEMO, state: "typing", duration: 20 },
      { at: 52 + DEMO, state: "blur", duration: 8 },
    ],
    opts,
  );
  const emailStyle = useInputTransition(
    [
      { at: 52 + DEMO, state: "active", duration: 6 },
      { at: 54 + DEMO, state: "typing", duration: 28 },
      { at: 96 + DEMO, state: "blur", duration: 8 },
    ],
    opts,
  );
  const passStyle = useInputTransition(
    [
      { at: 96 + DEMO, state: "active", duration: 6 },
      { at: 98 + DEMO, state: "typing", duration: 22 },
      { at: 134 + DEMO, state: "blur", duration: 8 },
    ],
    opts,
  );
  const confirmStyle = useInputTransition(
    [
      { at: 134 + DEMO, state: "active", duration: 6 },
      { at: 136 + DEMO, state: "typing", duration: 22 },
      { at: 176 + DEMO, state: "blur", duration: 8 },
    ],
    opts,
  );

  const buttonStyle = useButtonTransition(
    [
      { at: 176 + DEMO, state: "hover", duration: 8 },
      { at: 186 + DEMO, state: "press", duration: 6 },
      { at: 192 + DEMO, state: "loading", duration: 6 },
      { at: 234 + DEMO, state: "success", duration: 16 },
    ],
    opts,
  );

  const toastStyle = useToastTransition(
    [
      { at: 234 + DEMO, state: "visible", duration: 14 },
      { at: 300 + DEMO, state: "hidden", duration: 14 },
    ],
    {},
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "transparent",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: CARD_LEFT,
          top: CARD_TOP,
          width: CARD_W,
          height: 580,
          boxSizing: "border-box",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          background: resolved.background,
          border: `1px solid ${resolved.border}`,
          borderRadius: 14,
          boxShadow:
            "0 10px 30px -12px rgba(0,0,0,0.22), 0 2px 8px -3px rgba(0,0,0,0.10)",
          opacity: cardEnter.opacity,
          filter: cardEnter.blur > 0 ? `blur(${cardEnter.blur}px)` : "none",
        }}
      >
        <BlurIn display="block" style={enterHeader}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                fontSize: 22,
                lineHeight: "28px",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                color: resolved.cardForeground,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: "20px",
                color: resolved.mutedForeground,
              }}
            >
              {description}
            </div>
          </div>
        </BlurIn>

        <FieldGroup gap={16}>
          <BlurIn display="block" style={enterName}>
            <Field>
              <FieldLabel theme={theme}>Full Name</FieldLabel>
              <FieldControl>
                <Input
                  placeholder={fullName}
                  value={fullName}
                  style={nameStyle}
                  theme={theme}
                />
              </FieldControl>
            </Field>
          </BlurIn>

          <BlurIn display="block" style={enterEmail}>
            <Field>
              <FieldLabel theme={theme}>Email</FieldLabel>
              <FieldControl>
                <Input
                  placeholder={email}
                  value={email}
                  style={emailStyle}
                  theme={theme}
                />
              </FieldControl>
              <FieldDescription theme={theme}>
                We'll use this to contact you.
              </FieldDescription>
            </Field>
          </BlurIn>

          <BlurIn display="block" style={enterPass}>
            <Field>
              <FieldLabel theme={theme}>Password</FieldLabel>
              <FieldControl>
                <Input
                  placeholder={password}
                  value={password}
                  style={passStyle}
                  theme={theme}
                />
              </FieldControl>
              <FieldDescription theme={theme}>
                Must be at least 8 characters long.
              </FieldDescription>
            </Field>
          </BlurIn>

          <BlurIn display="block" style={enterConfirm}>
            <Field>
              <FieldLabel theme={theme}>Confirm Password</FieldLabel>
              <FieldControl>
                <Input
                  placeholder={password}
                  value={password}
                  style={confirmStyle}
                  theme={theme}
                />
              </FieldControl>
            </Field>
          </BlurIn>
        </FieldGroup>

        <BlurIn display="block" style={enterButton}>
          <Field gap={10}>
            <FieldControl>
              <Button label={createLabel} style={buttonStyle} theme={theme} />
            </FieldControl>
          </Field>
        </BlurIn>
      </div>

      <div style={{ position: "absolute", right: 32, bottom: 32 }}>
        <Toast
          title={toastTitle}
          variant="success"
          style={toastStyle}
          theme={theme}
        />
      </div>

      <Cursor style={cursorStyle} variant="pointer" theme={theme} />
    </div>
  );
}
