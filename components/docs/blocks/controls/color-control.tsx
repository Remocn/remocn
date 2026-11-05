"use client";

import { cn } from "@/lib/utils";
import {
  CONTROL,
  CONTROL_FOCUS,
  CONTROL_LABEL,
  CONTROL_VALUE,
} from "./control-styles";

/** Color prop: hex readout and a swatch that opens the native picker. */
export function ColorControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={cn(CONTROL, CONTROL_FOCUS, "pr-2")}>
      <label htmlFor={id} className={cn(CONTROL_LABEL, "cursor-pointer")}>
        {label}
      </label>
      <span className="flex items-center gap-2.5">
        <span className={cn(CONTROL_VALUE, "tabular-nums")}>
          {value.toUpperCase()}
        </span>
        <span
          className="relative size-5 shrink-0 overflow-hidden rounded-[5px] border border-white/15"
          style={{ backgroundColor: value }}
        >
          <input
            id={id}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </span>
      </span>
    </div>
  );
}
