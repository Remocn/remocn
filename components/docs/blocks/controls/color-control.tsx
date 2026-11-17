"use client";

import { Button } from "@ui-sdk/react/button";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerAreaThumb,
  ColorPickerInput,
  ColorPickerSlider,
  ColorPickerSliderThumb,
  ColorPickerSwatch,
} from "@ui-sdk/react/color-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@ui-sdk/react/popover";
import type { ChangeSource } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CONTROL, CONTROL_LABEL, CONTROL_VALUE } from "./control-styles";

const THUMB =
  "size-3.5 rounded-full border-2 border-white bg-(--color-picker-color) shadow-[0_0_0_1px_rgb(0_0_0/40%),0_1px_3px_rgb(0_0_0/50%)] outline-none [translate:-50%_-50%] has-focus-visible:ring-2 has-focus-visible:ring-primary-bright focus-visible:ring-2 focus-visible:ring-primary-bright";

/** Where the picker opens while the value is auto; any pick replaces it. */
const AUTO_START = "#808080";

/**
 * Color prop: the tile shows the hex and a swatch, and opens a picker with a
 * saturation/brightness area, a hue slider and a hex field. An empty value is
 * auto (the component takes the colour from its theme): the tile reads Auto,
 * and once a colour is picked the popover offers the way back.
 */
export function ColorControl({
  label,
  value,
  auto = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  /** The prop has a theme colour to fall back on. */
  auto?: boolean;
  onChange: (value: string, source?: ChangeSource) => void;
}) {
  const isAuto = value === "";
  return (
    <ColorPicker
      aria-label={label}
      value={isAuto ? AUTO_START : value}
      format="hex"
      onValueChange={(next, details) => onChange(next, details.source)}
    >
      <Popover>
        <PopoverTrigger
          aria-label={label}
          className={cn(
            CONTROL,
            "w-full cursor-pointer pr-2 outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary-bright focus-visible:ring-inset data-open:bg-white/8",
          )}
        >
          <span className={CONTROL_LABEL}>{label}</span>
          <span className="flex items-center gap-2.5">
            <span className={cn(CONTROL_VALUE, "tabular-nums")}>
              {isAuto ? "Auto" : value.toUpperCase()}
            </span>
            {isAuto ? (
              <span
                aria-hidden="true"
                className="size-5 shrink-0 rounded-[5px] border border-white/15 bg-[linear-gradient(135deg,#f4f4f5_0_50%,#18181b_50%_100%)]"
              />
            ) : (
              <ColorPickerSwatch className="size-5 shrink-0 rounded-[5px] border border-white/15 bg-(--color-picker-color)" />
            )}
          </span>
        </PopoverTrigger>
        <PopoverContent
          side="bottom"
          align="end"
          sideOffset={6}
          className="m-0 right-auto bottom-auto flex h-fit w-[232px] origin-(--transform-origin) flex-col gap-2.5 rounded-control-sm border border-dark-border bg-dark-raised p-2.5 text-inherit shadow-[0_12px_24px_-8px_rgb(0_0_0/60%)] outline-none transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.19,1,0.22,1)] data-ending-style:scale-98 data-ending-style:opacity-0 data-ending-style:duration-100 data-starting-style:scale-98 data-starting-style:opacity-0 motion-reduce:transition-opacity"
        >
          <ColorPickerArea className="relative h-36 w-full touch-none rounded-tile bg-(image:--color-area-background)">
            <ColorPickerAreaThumb className={THUMB} />
          </ColorPickerArea>
          <ColorPickerSlider
            channel="hue"
            className="relative h-3 w-full touch-none rounded-full bg-(image:--color-slider-background)"
          >
            <ColorPickerSliderThumb className={cn(THUMB, "top-1/2")} />
          </ColorPickerSlider>
          <ColorPickerInput
            aria-label={`${label} hex`}
            spellCheck={false}
            className={cn(
              CONTROL_VALUE,
              "h-8 w-full rounded-tile bg-white/5 px-2.5 text-caption tabular-nums uppercase caret-primary-soft outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary-bright focus-visible:ring-inset max-md:h-11 max-md:text-base",
            )}
          />
          {auto && !isAuto ? (
            <Button
              aria-label={`${label}: auto`}
              onClick={() => onChange("")}
              className="h-8 w-full cursor-pointer rounded-tile bg-white/5 text-caption text-white/70 outline-none hover:bg-white/8 hover:text-[#fafafa] focus-visible:ring-[1.5px] focus-visible:ring-primary-bright focus-visible:ring-inset max-md:h-11 max-md:text-small"
            >
              Use theme color
            </Button>
          ) : null}
        </PopoverContent>
      </Popover>
    </ColorPicker>
  );
}
