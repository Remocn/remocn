"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { ChevronDownIcon } from "lucide-react";
import { ElasticSlider } from "@/components/ui/elastic-slider";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldInput,
  NumberFieldScrubArea,
} from "@/components/ui/number-field";
import { SelectContent, SelectItem } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { ControlConfig, ControlType } from "@/lib/customizer-config";
import { cn } from "@/lib/utils";

/** Shared pill surface so every non-slider control matches the elastic slider. */
const PILL =
  "flex h-9 items-center gap-3 rounded-xl control-surface px-3 text-sm transition-colors";

/** Strip trailing zeros so the value reads like the reference (1, 0.8, 0.1). */
function formatNumber(v: number) {
  return String(v);
}

function SelectPill({
  id,
  ctrl,
  value,
  onChange,
}: {
  id: string;
  ctrl: Extract<ControlType, { type: "select" }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <SelectPrimitive.Root
      value={value}
      // base-ui types the value as `string | null` (null on deselect); the
      // customizer never deselects, but guard it so a null can't leak out.
      onValueChange={(v) => {
        if (v !== null) onChange(v as string);
      }}
    >
      <SelectPrimitive.Trigger
        id={id}
        className={cn(
          PILL,
          "control-surface-interactive w-full justify-between outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/40",
        )}
      >
        <span className="font-medium text-muted-foreground">{ctrl.label}</span>
        <span className="flex items-center gap-1 font-medium text-foreground">
          <SelectPrimitive.Value />
          {/* Raw primitive instead of the SelectTrigger wrapper so the chevron
              sits beside the value inside our custom pill layout. */}
          <SelectPrimitive.Icon
            render={
              <ChevronDownIcon className="size-4 text-muted-foreground" />
            }
          />
        </span>
      </SelectPrimitive.Trigger>
      <SelectContent alignItemWithTrigger={false}>
        {ctrl.options.map((opt) => (
          <SelectItem key={opt} value={opt}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectPrimitive.Root>
  );
}

function NumberInputPill({
  id,
  ctrl,
  value,
  onChange,
}: {
  id: string;
  ctrl: Extract<ControlType, { type: "number-input" }>;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <NumberField
      id={id}
      value={value}
      onValueChange={(v) => {
        if (v !== null) onChange(v);
      }}
      min={ctrl.min}
      max={ctrl.max}
      step={ctrl.step}
      className={cn(PILL, "flex-row justify-between")}
    >
      <NumberFieldScrubArea
        label={ctrl.label}
        className="shrink-0 text-muted-foreground"
      />
      <NumberFieldInput className="h-auto min-w-0 flex-1 rounded-none px-0 text-right font-mono text-base font-medium leading-none text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:h-auto sm:text-sm" />
    </NumberField>
  );
}

function Control({
  id,
  ctrl,
  value,
  onChange,
}: {
  id: string;
  ctrl: ControlType;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  switch (ctrl.type) {
    case "number":
      return (
        <ElasticSlider
          label={ctrl.label}
          value={value as number}
          onValueChange={onChange}
          min={ctrl.min}
          max={ctrl.max}
          step={ctrl.step}
          formatValue={formatNumber}
        />
      );

    case "number-input":
      return (
        <NumberInputPill
          id={id}
          ctrl={ctrl}
          value={value as number}
          onChange={onChange}
        />
      );

    case "select":
      return (
        <SelectPill
          id={id}
          ctrl={ctrl}
          value={value as string}
          onChange={onChange}
        />
      );

    case "boolean":
      return (
        <label
          htmlFor={id}
          className={cn(
            PILL,
            "control-surface-interactive cursor-pointer justify-between",
          )}
        >
          <span className="font-medium text-muted-foreground">
            {ctrl.label}
          </span>
          <Switch
            id={id}
            checked={value as boolean}
            onCheckedChange={onChange}
          />
        </label>
      );

    case "color":
      return (
        <div className={cn(PILL, "justify-between")}>
          <Label htmlFor={id} className="font-medium text-muted-foreground">
            {ctrl.label}
          </Label>
          {/* The native input fills the swatch box, so it is directly
              clickable — no wrapping <label> (which would double-label it). */}
          <span className="flex items-center gap-2">
            <span className="font-mono text-sm font-medium uppercase text-foreground">
              {value as string}
            </span>
            <span className="relative inline-flex size-5 shrink-0 overflow-hidden rounded-lg border border-border/60">
              <input
                id={id}
                type="color"
                value={value as string}
                onChange={(e) => onChange(e.target.value)}
                className="absolute top-1/2 left-1/2 size-[200%] -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent p-0"
              />
            </span>
          </span>
        </div>
      );

    case "text":
      return (
        <div className={PILL}>
          <Label
            htmlFor={id}
            className="shrink-0 font-medium text-muted-foreground"
          >
            {ctrl.label}
          </Label>
          <input
            id={id}
            type="text"
            spellCheck={false}
            autoComplete="off"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-right font-mono text-base font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/40 placeholder:text-muted-foreground/50 sm:text-sm"
          />
        </div>
      );

    default: {
      // Compile-time exhaustiveness: adding a new ControlType errors here.
      const _exhaustive: never = ctrl;
      void _exhaustive;
      return null;
    }
  }
}

export function ComponentCustomizer({
  controls,
  values,
  onChange,
}: {
  controls: ControlConfig;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Object.entries(controls).map(([key, ctrl]) => (
        <Control
          key={key}
          id={`ctrl-${key}`}
          ctrl={ctrl}
          value={values[key]}
          onChange={(value) => onChange(key, value)}
        />
      ))}
    </div>
  );
}
