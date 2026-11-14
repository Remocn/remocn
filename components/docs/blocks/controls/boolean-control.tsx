"use client";

import { Switch, SwitchThumb } from "@ui-sdk/react/switch";
import { cn } from "@/lib/utils";
import { CONTROL, CONTROL_LABEL } from "./control-styles";

/** Boolean prop: the whole tile toggles; the switch lights up fuchsia when on. */
export function BooleanControl({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label htmlFor={id} className={cn(CONTROL, "cursor-pointer")}>
      <span className={CONTROL_LABEL}>{label}</span>
      <Switch
        id={id}
        checked={value}
        onCheckedChange={(checked) => onChange(checked)}
        className="relative h-5 w-[34px] shrink-0 cursor-pointer rounded-full bg-[#34383c] outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-primary-bright focus-visible:ring-offset-1 focus-visible:ring-offset-dark-surface data-checked:bg-primary"
      >
        <SwitchThumb className="absolute top-0.5 left-0.5 size-4 rounded-full bg-[#fafafa] transition-transform duration-150 ease-[cubic-bezier(0.19,1,0.22,1)] data-checked:translate-x-3.5 motion-reduce:transition-none" />
      </Switch>
    </label>
  );
}
