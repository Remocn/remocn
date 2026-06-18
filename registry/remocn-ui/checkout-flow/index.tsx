"use client";

import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";
import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { Input } from "@/components/remocn/input";
import { useInputTransition } from "@/components/remocn/use-input-transition";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { Checkbox } from "@/components/remocn/checkbox";
import { useCheckboxTransition } from "@/components/remocn/use-checkbox-transition";
import {
  ToggleGroup,
  type ToggleGroupItem,
} from "@/components/remocn/toggle-group";
import { useToggleGroupTransition } from "@/components/remocn/use-toggle-group-transition";
import { Toast } from "@/components/remocn/toast";
import { useToastTransition } from "@/components/remocn/use-toast-transition";
import { BlurIn } from "@/components/remocn/blur-in";
import { useBlurInTransition } from "@/components/remocn/use-blur-in-transition";
import {
  Field,
  FieldControl,
  FieldGroup,
  FieldLabel,
} from "@/components/remocn/field";

const DEFAULT_PLANS: ToggleGroupItem[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

const STAGE_W = 1280;
const CARD_W = 420;
const CARD_PAD = 28;
const CARD_TOP = 96;
const CARD_LEFT = (STAGE_W - CARD_W) / 2;
const CENTER_X = STAGE_W / 2;
const CONTENT_LEFT = CARD_LEFT + CARD_PAD;
const CONTENT_RIGHT = CARD_LEFT + CARD_W - CARD_PAD;

const TOGGLE_Y = 222;
const YEARLY_X = CONTENT_LEFT + 4 + 88 + 44;
const CARD_X = CENTER_X;
const CARD_Y = 312;
const TERMS_X = CONTENT_LEFT + 12;
const TERMS_Y = 376;
const PAY_X = CONTENT_RIGHT - 48;
const PAY_Y = 442;

export interface CheckoutFlowProps {
  title?: string;
  description?: string;
  plans?: ToggleGroupItem[];
  cardLabel?: string;
  cardPlaceholder?: string;
  termsLabel?: string;
  payLabel?: string;
  toastTitle?: string;
  mode?: "light" | "dark";
  theme?: Partial<RemocnTheme>;
}

export function CheckoutFlow({
  title = "Upgrade your plan",
  description = "Complete your purchase to unlock every feature.",
  plans = DEFAULT_PLANS,
  cardLabel = "Card number",
  cardPlaceholder = "4242 4242 4242 4242",
  termsLabel = "I accept the terms and conditions",
  payLabel = "Pay $49",
  toastTitle = "Payment successful",
  mode = "light",
  theme,
}: CheckoutFlowProps) {
  const resolved = useRemocnTheme(theme, mode);
  const opts = { mode, theme };

  const cardEnter = useBlurInTransition(
    [{ at: 0, state: "revealed", duration: 18 }],
    { distance: 0 },
  );
  const enterHeader = useBlurInTransition([
    { at: 18, state: "revealed", duration: 16 },
  ]);
  const enterToggle = useBlurInTransition([
    { at: 24, state: "revealed", duration: 16 },
  ]);
  const enterCard = useBlurInTransition([
    { at: 30, state: "revealed", duration: 16 },
  ]);
  const enterTerms = useBlurInTransition([
    { at: 36, state: "revealed", duration: 16 },
  ]);
  const enterButton = useBlurInTransition([
    { at: 42, state: "revealed", duration: 16 },
  ]);

  const cursorStyle = useCursorPath([
    { at: 0, x: 140, y: 90 },
    { at: 64, x: YEARLY_X, y: TOGGLE_Y, duration: 22, click: true },
    { at: 96, x: CARD_X, y: CARD_Y, duration: 24, click: true },
    { at: 150, x: TERMS_X, y: TERMS_Y, duration: 30, click: true },
    { at: 180, x: PAY_X, y: PAY_Y, duration: 26, click: true },
  ]);

  const toggleStyle = useToggleGroupTransition(
    [{ at: 64, state: plans[1]?.value ?? "yearly", duration: 16 }],
    { items: plans, ...opts },
  );

  const cardStyle = useInputTransition(
    [
      { at: 96, state: "active", duration: 6 },
      { at: 100, state: "typing", duration: 40 },
      { at: 150, state: "blur", duration: 8 },
    ],
    opts,
  );

  const checkboxStyle = useCheckboxTransition(
    [{ at: 150, state: "checked", duration: 14 }],
    opts,
  );

  const payStyle = useButtonTransition(
    [
      { at: 172, state: "hover", duration: 8 },
      { at: 180, state: "press", duration: 6 },
      { at: 186, state: "loading", duration: 6 },
      { at: 224, state: "success", duration: 16 },
    ],
    opts,
  );

  const toastStyle = useToastTransition(
    [
      { at: 224, state: "visible", duration: 14 },
      { at: 286, state: "hidden", duration: 14 },
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
      <div
        style={{
          position: "absolute",
          left: CARD_LEFT,
          top: CARD_TOP,
          width: CARD_W,
          height: 420,
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

        <BlurIn display="block" style={enterToggle}>
          <FieldControl height={44}>
            <ToggleGroup
              style={toggleStyle}
              items={plans}
              align="start"
              mode={mode}
              theme={theme}
            />
          </FieldControl>
        </BlurIn>

        <FieldGroup gap={24}>
          <BlurIn display="block" style={enterCard}>
            <Field>
              <FieldLabel mode={mode} theme={theme}>
                {cardLabel}
              </FieldLabel>
              <FieldControl>
                <Input
                  placeholder={cardPlaceholder}
                  value={cardPlaceholder}
                  style={cardStyle}
                  fullWidth
                  mode={mode}
                  theme={theme}
                />
              </FieldControl>
            </Field>
          </BlurIn>

          <BlurIn display="block" style={enterTerms}>
            <FieldControl>
              <Checkbox
                label={termsLabel}
                style={checkboxStyle}
                align="start"
                theme={theme}
              />
            </FieldControl>
          </BlurIn>
        </FieldGroup>

        <BlurIn display="block" style={enterButton}>
          <Field gap={10}>
            <FieldControl height={44}>
              <Button
                label={payLabel}
                style={payStyle}
                align="end"
                mode={mode}
                theme={theme}
              />
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
