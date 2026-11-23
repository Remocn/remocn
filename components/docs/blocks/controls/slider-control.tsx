"use client";

import { Field, FieldLabel } from "@ui-sdk/react/field";
import {
  Slider,
  SliderControl as SliderArea,
  SliderIndicator,
  SliderThumb,
  SliderTrack,
  SliderValue,
} from "@ui-sdk/react/slider";
import { type PointerEvent, useLayoutEffect, useRef, useState } from "react";
import type { ChangeSource } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CONTROL, CONTROL_LABEL, formatStep } from "./control-styles";

const TICKS = [10, 20, 30, 40, 50, 60, 70, 80, 90];

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(Math.max(v, lo), hi);

/**
 * A bounded number as a fill slider: the whole tile is the track, the fill
 * ends in a thin handle line, and ticks appear while it is hovered or dragged.
 * Keys, mouse and agents go through ui-sdk's slider; touch has its own gate
 * below.
 */
export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number, source?: ChangeSource) => void;
}) {
  const areaRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLLabelElement>(null);
  const valueRef = useRef<HTMLOutputElement>(null);
  const [touchDragging, setTouchDragging] = useState(false);

  // Where the label ends and the value starts, in % of the track, so the
  // handle line can step aside instead of striking through the text.
  const [clear, setClear] = useState({ from: 0, to: 100 });
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (!area) return;
    const measure = () => {
      const width = area.offsetWidth;
      const label = labelRef.current;
      const val = valueRef.current;
      if (!width || !label || !val) return;
      const from = ((label.offsetLeft + label.offsetWidth + 8) / width) * 100;
      const to = ((val.offsetLeft - 8) / width) * 100;
      setClear((prev) =>
        prev.from === from && prev.to === to ? prev : { from, to },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(area);
    if (valueRef.current) observer.observe(valueRef.current);
    return () => observer.disconnect();
  }, []);

  const commit = (raw: number) => {
    const snapped = Math.round((raw - min) / step) * step + min;
    const next = Number(clamp(snapped, min, max).toFixed(10));
    if (next !== value) onChange(next, "touch");
  };

  const fromPointer = (clientX: number) => {
    const box = areaRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    commit(min + ((clientX - box.left) / box.width) * (max - min));
  };

  // ui-sdk's slider takes every touch, so a finger scrolling the page across
  // a full-width tile would move the value. Touch stays ours: it only grabs
  // once it moves sideways, or lifts as a tap.
  const touchStart = useRef<number | null>(null);
  const onPointerDownCapture = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    event.stopPropagation();
    touchStart.current = event.clientX;
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    if (touchDragging) {
      fromPointer(event.clientX);
    } else if (
      touchStart.current !== null &&
      Math.abs(event.clientX - touchStart.current) > 6
    ) {
      touchStart.current = null;
      event.currentTarget.setPointerCapture(event.pointerId);
      setTouchDragging(true);
      fromPointer(event.clientX);
    }
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "touch") return;
    if (touchStart.current !== null) fromPointer(event.clientX);
    touchStart.current = null;
    setTouchDragging(false);
  };
  const onPointerCancel = () => {
    touchStart.current = null;
    setTouchDragging(false);
  };

  return (
    <Field className="min-w-0">
      <Slider
        value={value}
        min={min}
        max={max}
        step={step}
        format={(v: number) => formatStep(v, step)}
        onValueChange={(next, details) => {
          if (typeof next === "number") onChange(next, details.source);
        }}
        data-touch-dragging={touchDragging || undefined}
        onPointerDownCapture={onPointerDownCapture}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="group/slider"
      >
        <SliderArea
          ref={areaRef}
          className={cn(
            CONTROL,
            "block cursor-ew-resize p-0 select-none touch-pan-y! has-focus-visible:ring-[1.5px] has-focus-visible:ring-primary-bright has-focus-visible:ring-inset data-dragging:ring-0",
          )}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            {TICKS.filter((tick) => tick > clear.from && tick < clear.to).map(
              (tick) => (
                <span
                  key={tick}
                  className="absolute top-1/2 h-2 w-px -translate-y-1/2 rounded-full bg-white/15 opacity-0 transition-opacity duration-150 group-hover/slider:opacity-100 group-data-dragging/slider:opacity-100 group-data-touch-dragging/slider:opacity-100"
                  style={{ left: `${tick}%` }}
                />
              ),
            )}
          </span>
          <SliderTrack className="size-full">
            <SliderIndicator className="bg-white/11 transition-colors duration-150 group-hover/slider:bg-white/13 group-data-dragging/slider:bg-white/18 group-data-touch-dragging/slider:bg-white/18" />
            <SliderThumb
              className={(state) =>
                cn(
                  "h-5 w-[3px] rounded-full bg-white/50 transition-[background-color,opacity] duration-150 group-data-dragging/slider:bg-[#fafafa] group-data-touch-dragging/slider:bg-[#fafafa]",
                  (state.percent < clear.from || state.percent > clear.to) &&
                    "opacity-0",
                )
              }
            />
          </SliderTrack>
          <span className="pointer-events-none absolute inset-0 flex items-center justify-between gap-3 px-3">
            <FieldLabel ref={labelRef} className={CONTROL_LABEL}>
              {label}
            </FieldLabel>
            <SliderValue
              ref={valueRef}
              className="text-[#fafafa] tabular-nums"
            />
          </span>
        </SliderArea>
      </Slider>
    </Field>
  );
}
