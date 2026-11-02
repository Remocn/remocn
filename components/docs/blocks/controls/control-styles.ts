/**
 * Shared surfaces for the customizer controls on the dark player panel: a
 * 36px tile (44px on phones) with the label on the left and the value on the
 * right, a lighter fill on hover and a fuchsia ring while editing.
 * `customizer-control` is a hook for the compact density in
 * `ComponentCustomizer`.
 */
export const CONTROL =
  "customizer-control relative flex h-9 min-w-0 items-center justify-between gap-3 overflow-hidden rounded-tile bg-white/5 px-3 text-caption leading-[17px] font-medium transition-colors duration-150 hover:bg-white/8 max-md:h-11 max-md:text-small max-md:leading-[18px]";

export const CONTROL_FOCUS =
  "focus-within:ring-[1.5px] focus-within:ring-primary-bright focus-within:ring-inset";

export const CONTROL_LABEL = "shrink-0 text-white/70";

export const CONTROL_VALUE = "text-[#fafafa]";

/** Decimal places implied by a step (0.01 → 2), so 0.9 reads as 0.90. */
export function formatStep(value: number, step: number) {
  const dot = String(step).indexOf(".");
  const decimals = dot === -1 ? 0 : String(step).length - dot - 1;
  return value.toFixed(decimals);
}
