"use client";

import { Field, FieldLabel } from "@ui-sdk/react/field";
import {
  NumberInput,
  NumberInputControl,
  NumberInputGroup,
  NumberInputScrubArea,
  NumberInputScrubAreaCursor,
} from "@ui-sdk/react/number-input";
import { CursorGrowIcon } from "@/components/ui/number-field";
import { cn } from "@/lib/utils";
import {
  CONTROL,
  CONTROL_FOCUS,
  CONTROL_LABEL,
  CONTROL_VALUE,
} from "./control-styles";

/**
 * Unbounded number prop: type the value, or drag the label left and right to
 * scrub it.
 */
export function NumberControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field className={cn(CONTROL, CONTROL_FOCUS)}>
      <NumberInput
        value={value}
        min={min}
        max={max}
        step={step}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
        }}
        className="contents"
      >
        <NumberInputScrubArea className="flex cursor-ew-resize">
          <FieldLabel className={cn(CONTROL_LABEL, "cursor-ew-resize")}>
            {label}
          </FieldLabel>
          <NumberInputScrubAreaCursor className="-mt-[7px] -ml-3 drop-shadow-[0_1px_1px_#0008]">
            <CursorGrowIcon />
          </NumberInputScrubAreaCursor>
        </NumberInputScrubArea>
        <NumberInputGroup className="flex min-w-0 flex-1">
          <NumberInputControl
            className={cn(
              CONTROL_VALUE,
              "min-w-0 flex-1 bg-transparent text-right tabular-nums caret-primary-soft outline-none max-md:text-base",
            )}
          />
        </NumberInputGroup>
      </NumberInput>
    </Field>
  );
}
