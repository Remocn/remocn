"use client";

import { NumberField } from "@base-ui/react/number-field";
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
  id,
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
    <NumberField.Root
      id={id}
      value={value}
      min={min}
      max={max}
      step={step}
      onValueChange={(next) => {
        if (next !== null) onChange(next);
      }}
      className={cn(CONTROL, CONTROL_FOCUS)}
    >
      <NumberField.ScrubArea className="flex cursor-ew-resize">
        <label htmlFor={id} className={cn(CONTROL_LABEL, "cursor-ew-resize")}>
          {label}
        </label>
        <NumberField.ScrubAreaCursor className="drop-shadow-[0_1px_1px_#0008]">
          <CursorGrowIcon />
        </NumberField.ScrubAreaCursor>
      </NumberField.ScrubArea>
      <NumberField.Input
        className={cn(
          CONTROL_VALUE,
          "min-w-0 flex-1 bg-transparent text-right tabular-nums caret-primary-soft outline-none max-md:text-base",
        )}
      />
    </NumberField.Root>
  );
}
