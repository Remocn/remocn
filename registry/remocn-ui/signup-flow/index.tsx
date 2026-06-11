"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { Input } from "@/components/remocn/input";
import { useInputTransition } from "@/components/remocn/use-input-transition";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { Toast } from "@/components/remocn/toast";
import { useToastTransition } from "@/components/remocn/use-toast-transition";
import {
  Field,
  FieldControl,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/remocn/field";

export interface SignupFlowProps {
  /** Card title. */
  title?: string;
  /** Card description under the title. */
  description?: string;
  /** Value typed into the Full Name field. */
  fullName?: string;
  /** Value typed into the Email field. */
  email?: string;
  /** Value typed into the password fields (rendered as the masked string). */
  password?: string;
  /** Primary submit button label. */
  createLabel?: string;
  /** Outline (social) button label. */
  googleLabel?: string;
  /** Footer prompt shown before the "Sign in" link. */
  signinText?: string;
  /** Title shown in the success toast. */
  toastTitle?: string;
  mode?: "light" | "dark";
  theme?: Partial<RemocnTheme>;
}

// ── Stage + card geometry (1280×720). The card surface is theme.background so
// the Input/Button atoms (which paint their own inset:0 theme.background fill)
// blend into it in BOTH light and dark; the stage sits on theme.muted so the
// card lifts off the page via tone + border + shadow. Card content flows in a
// padded column; the cursor targets each control's vertical center, derived
// from the fixed field metrics below (label 18 + gap 6 + control 40, group
// gap 16) so the click visually lands on the field. The focus itself is
// frame-driven (each click `at` == the field's `active` `at`), not position-
// driven, so the animation stays exact regardless of pixel rounding.
const STAGE_W = 1280;
const CARD_W = 376;
const CARD_TOP = 48;
const CARD_LEFT = (STAGE_W - CARD_W) / 2; // 452
const CENTER_X = STAGE_W / 2; // 640 — the centered content column

// Cursor tip targets — each control's vertical center (see metrics above).
const NAME_Y = 196;
const EMAIL_Y = 276;
const PASS_Y = 378;
const CONFIRM_Y = 480;
const CREATE_Y = 544;

/**
 * Cursor-driven signup card: the pointer fills each labeled field top-to-bottom
 * (Full Name → Email → Password → Confirm), then clicks "Create account"
 * (hover → press → loading → success) and a success toast slides in. A pure
 * orchestrator — every animated channel comes from a composed primitive's own
 * transition hook (`useCursorPath` / `use*Transition`); the block holds no
 * state, effects, or frame reads of its own. The card chrome and form layout
 * are composed from the static `Field` family (FieldGroup / Field / FieldLabel
 * / FieldControl / FieldDescription).
 *
 * Frame-sync: each cursor-click `at` equals the field's `active` `at`
 * (18, 52, 96, 134) and the button `hover` `at` (176); the button `success`
 * `at` equals the toast enter `at` (234). Type windows never overlap the next
 * field's click.
 */
export function SignupFlow({
  title = "Create an account",
  description = "Enter your information below to create your account",
  fullName = "John Doe",
  email = "m@example.com",
  password = "••••••••",
  createLabel = "Create account",
  googleLabel = "Sign up with Google",
  signinText = "Already have an account?",
  toastTitle = "Account created",
  mode = "light",
  theme,
}: SignupFlowProps) {
  const resolved = useRemocnTheme(theme, mode);
  const opts = { mode, theme };

  // Cursor: park → Name (18) → Email (52) → Password (96) → Confirm (134) →
  // Create (176). Each click `at` matches the target field's `active`/`hover`.
  const cursorStyle = useCursorPath([
    { at: 0, x: 160, y: 120 },
    { at: 18, x: CENTER_X, y: NAME_Y, duration: 18, click: true },
    { at: 52, x: CENTER_X, y: EMAIL_Y, duration: 30, click: true },
    { at: 96, x: CENTER_X, y: PASS_Y, duration: 40, click: true },
    { at: 134, x: CENTER_X, y: CONFIRM_Y, duration: 32, click: true },
    { at: 176, x: CENTER_X, y: CREATE_Y, duration: 38, click: true },
  ]);

  // Each field focuses on its click, then reveals its typed value. Each field's
  // own hook holds the filled visual afterward.
  const nameStyle = useInputTransition(
    [
      { at: 18, state: "active", duration: 6 },
      { at: 20, state: "typing", duration: 20 },
    ],
    opts,
  );
  const emailStyle = useInputTransition(
    [
      { at: 52, state: "active", duration: 6 },
      { at: 54, state: "typing", duration: 28 },
    ],
    opts,
  );
  const passStyle = useInputTransition(
    [
      { at: 96, state: "active", duration: 6 },
      { at: 98, state: "typing", duration: 22 },
    ],
    opts,
  );
  const confirmStyle = useInputTransition(
    [
      { at: 134, state: "active", duration: 6 },
      { at: 136, state: "typing", duration: 22 },
    ],
    opts,
  );

  // Create button: hover on arrival (176) → press → loading spinner → success.
  const buttonStyle = useButtonTransition(
    [
      { at: 176, state: "hover", duration: 8 },
      { at: 186, state: "press", duration: 6 },
      { at: 192, state: "loading", duration: 6 },
      { at: 234, state: "success", duration: 16 },
    ],
    opts,
  );

  // Toast: enters with success (234), auto-dismisses at 300. (No `theme` option
  // — the Toast component resolves the theme for its own surface.)
  const toastStyle = useToastTransition(
    [
      { at: 234, state: "visible", duration: 14 },
      { at: 300, state: "hidden", duration: 14 },
    ],
    { mode },
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: resolved.muted,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Card — surface = theme.background so the atoms' fills blend in. The
          content flows in a padded column. */}
      <div
        style={{
          position: "absolute",
          left: CARD_LEFT,
          top: CARD_TOP,
          width: CARD_W,
          height: 620,
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
        }}
      >
        {/* Header. */}
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

        {/* Fields. */}
        <FieldGroup gap={16}>
          <Field>
            <FieldLabel mode={mode} theme={theme}>
              Full Name
            </FieldLabel>
            <FieldControl>
              <Input
                placeholder={fullName}
                value={fullName}
                valueWidth={72}
                style={nameStyle}
                mode={mode}
                theme={theme}
              />
            </FieldControl>
          </Field>

          <Field>
            <FieldLabel mode={mode} theme={theme}>
              Email
            </FieldLabel>
            <FieldControl>
              <Input
                placeholder={email}
                value={email}
                valueWidth={108}
                style={emailStyle}
                mode={mode}
                theme={theme}
              />
            </FieldControl>
            <FieldDescription mode={mode} theme={theme}>
              We'll use this to contact you.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel mode={mode} theme={theme}>
              Password
            </FieldLabel>
            <FieldControl>
              <Input
                placeholder={password}
                value={password}
                valueWidth={70}
                style={passStyle}
                mode={mode}
                theme={theme}
              />
            </FieldControl>
            <FieldDescription mode={mode} theme={theme}>
              Must be at least 8 characters long.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel mode={mode} theme={theme}>
              Confirm Password
            </FieldLabel>
            <FieldControl>
              <Input
                placeholder={password}
                value={password}
                valueWidth={70}
                style={confirmStyle}
                mode={mode}
                theme={theme}
              />
            </FieldControl>
          </Field>
        </FieldGroup>

        {/* Actions + footer. */}
        <Field gap={10}>
          <FieldControl>
            <Button
              label={createLabel}
              style={buttonStyle}
              mode={mode}
              theme={theme}
            />
          </FieldControl>
          <FieldControl>
            <Button
              label={googleLabel}
              variant="outline"
              state="idle"
              mode={mode}
              theme={theme}
            />
          </FieldControl>
          <FieldDescription align="center" mode={mode} theme={theme}>
            {signinText}{" "}
            <span
              style={{
                color: resolved.foreground,
                fontWeight: 500,
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              Sign in
            </span>
          </FieldDescription>
        </Field>
      </div>

      {/* Success toast, anchored bottom-right of the stage. */}
      <div style={{ position: "absolute", right: 32, bottom: 32 }}>
        <Toast
          title={toastTitle}
          variant="success"
          style={toastStyle}
          mode={mode}
          theme={theme}
        />
      </div>

      <Cursor style={cursorStyle} variant="pointer" mode={mode} theme={theme} />
    </div>
  );
}
