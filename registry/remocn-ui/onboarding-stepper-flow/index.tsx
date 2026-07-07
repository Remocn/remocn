"use client";

import { Button } from "@/components/remocn/button";
import { Input } from "@/components/remocn/input";
import { Radio } from "@/components/remocn/radio";
import { Stepper } from "@/components/remocn/stepper";
import { Switch } from "@/components/remocn/switch";
import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { useInputTransition } from "@/components/remocn/use-input-transition";
import { useRadioTransition } from "@/components/remocn/use-radio-transition";
import { useStepperTransition } from "@/components/remocn/use-stepper-transition";
import { useSwitchTransition } from "@/components/remocn/use-switch-transition";
import { clamp01, type RemocnTheme } from "@/lib/remocn-ui";

const DEFAULT_STEPS = ["Account", "Plan", "Settings"];
const DEFAULT_PLANS = ["Free", "Pro", "Team"];

const CONTENT_TOP = 300;
const CONTENT_HEIGHT = 220;
const NAV_TOP = 540;

export interface OnboardingStepperFlowProps {
  steps?: string[];
  name?: string;
  plans?: string[];
  nextLabel?: string;
  finishLabel?: string;
  theme?: Partial<RemocnTheme>;
}

export function OnboardingStepperFlow({
  steps = DEFAULT_STEPS,
  name = "jane@acme.com",
  plans = DEFAULT_PLANS,
  nextLabel = "Next",
  finishLabel = "Finish",
  theme,
}: OnboardingStepperFlowProps) {
  const opts = { theme };

  const stepperStyle = useStepperTransition([
    { at: 0, index: 0 },
    { at: 64, index: 1, duration: 20 },
    { at: 104, index: 2, duration: 20 },
  ]);

  const nameStyle = useInputTransition(
    [
      { at: 2, state: "active", duration: 8 },
      { at: 10, state: "typing", duration: 45 },
    ],
    opts,
  );

  const planStyle = useRadioTransition(
    [{ at: 90, state: "checked", duration: 14 }],
    opts,
  );

  const settingsStyle = useSwitchTransition(
    [{ at: 130, state: "checked", duration: 14 }],
    opts,
  );

  const navStyle = useButtonTransition(
    [
      { at: 60, state: "press", duration: 6 },
      { at: 64, state: "idle", duration: 6 },
      { at: 100, state: "press", duration: 6 },
      { at: 104, state: "idle", duration: 6 },
      { at: 150, state: "press", duration: 6 },
      { at: 156, state: "success", duration: 14 },
    ],
    opts,
  );

  const position = stepperStyle.position;
  const panelOpacity = (i: number) => clamp01(1 - Math.abs(position - i));

  const navLabel = position >= steps.length - 1 ? finishLabel : nextLabel;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 96,
          height: 100,
        }}
      >
        <Stepper style={stepperStyle} steps={steps} theme={theme} />
      </div>

      {}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: CONTENT_TOP,
          height: CONTENT_HEIGHT,
        }}
      >
        {}
        <div
          style={{ position: "absolute", inset: 0, opacity: panelOpacity(0) }}
        >
          <Input
            style={nameStyle}
            placeholder={name}
            value={name}
            theme={theme}
          />
        </div>

        {}
        <div
          style={{ position: "absolute", inset: 0, opacity: panelOpacity(1) }}
        >
          <Radio style={planStyle} label={plans[1] ?? "Pro"} theme={theme} />
        </div>

        {}
        <div
          style={{ position: "absolute", inset: 0, opacity: panelOpacity(2) }}
        >
          <Switch
            style={settingsStyle}
            label="Email notifications"
            theme={theme}
          />
        </div>
      </div>

      {}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: NAV_TOP,
          height: 64,
        }}
      >
        <Button label={navLabel} style={navStyle} theme={theme} />
      </div>
    </div>
  );
}
