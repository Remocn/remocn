import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A checkout applying a promo code: the card and the payment column come in,
// the camera pushes toward the promo field, the cursor focuses it and types
// a code that is rejected with a shake, retypes, applies, and the total rolls
// down before the cursor heads to pay. Frames on the 30 fps scene timeline,
// after `delay` and `speed`. The ids are public: a saved `timing` prop
// refers to them.

export type CouponApplyElementId =
  | "card"
  | "side"
  | "zoom"
  | "cursor"
  | "focus"
  | "type-invalid"
  | "apply-invalid"
  | "reject"
  | "refocus"
  | "type"
  | "apply"
  | "accept"
  | "strike"
  | "roll"
  | "pay";

export interface CouponApplyTimingProps {
  invalidCode?: string;
  code?: string;
}

export const DEFAULT_INVALID_CODE = "LAUNCH";
export const DEFAULT_CODE = "LAUNCH24";

/** Frames per typed character. */
const CH = 3;

export const couponApplyTimeline = defineTimeline<
  CouponApplyElementId,
  CouponApplyTimingProps
>(({ invalidCode = DEFAULT_INVALID_CODE, code = DEFAULT_CODE }) => {
  const hasInvalid = invalidCode.length > 0;
  const retype =
    hasInvalid && code.startsWith(invalidCode)
      ? code.slice(invalidCode.length)
      : code;
  const t: Record<string, number> = { focus: 30, type1: 34 };
  t.apply1 = t.type1 + (hasInvalid ? invalidCode.length * CH : 0) + 8;
  t.reject = t.apply1 + 9;
  t.refocus = hasInvalid ? t.reject + 18 : t.focus;
  t.type2 = hasInvalid ? t.refocus + 4 : t.type1;
  t.apply2 = t.type2 + retype.length * CH + 8;
  t.accept = t.apply2 + 10;
  t.strike = t.accept + 6;
  t.roll = t.strike + 4;
  t.pay = t.roll + 4;

  const elements: TimelineElement<CouponApplyElementId>[] = [
    { id: "card", lane: "Card", label: "checkout card", start: 0, length: 10 },
    { id: "side", lane: "Card", label: "payment column", start: 6, length: 12 },
    { id: "zoom", lane: "Camera", label: "push in", start: 8, length: 32 },
    { id: "cursor", lane: "Cursor", label: "cursor", start: 10, length: 8 },
    {
      id: "focus",
      lane: "Promo",
      label: "focus the field",
      start: t.focus,
      length: t.type1 - t.focus,
      // The cursor arrives at `reach` and rests until `rest`; the focus ring
      // grows over `ring`.
      beats: { reach: -2, rest: 4, ring: 6 },
    },
  ];
  if (hasInvalid) {
    elements.push(
      {
        id: "type-invalid",
        lane: "Promo",
        label: invalidCode,
        start: t.type1,
        length: t.apply1 - t.type1,
        follows: "focus",
        beats: { char: CH },
      },
      {
        id: "apply-invalid",
        lane: "Promo",
        label: "apply, rejected",
        start: t.apply1,
        length: t.reject - t.apply1,
        follows: "type-invalid",
        beats: { reach: -2, load: 1 },
      },
      {
        id: "reject",
        lane: "Promo",
        label: "shake and error",
        start: t.reject,
        length: t.refocus - t.reject,
        follows: "apply-invalid",
        beats: { border: 4, shake: 12, leave: 6, message: 3, messageIn: 9 },
      },
      {
        id: "refocus",
        lane: "Promo",
        label: "back into the field",
        start: t.refocus,
        length: t.type2 - t.refocus,
        follows: "reject",
        beats: { reach: -2, rest: 3 },
      },
    );
  }
  elements.push(
    {
      id: "type",
      lane: "Promo",
      label: hasInvalid ? retype : code,
      start: t.type2,
      length: t.apply2 - t.type2,
      follows: hasInvalid ? "refocus" : "focus",
      // Without a rejected attempt the cursor heads to the button at `hover`.
      beats: hasInvalid
        ? { char: CH, clear: 6 }
        : { char: CH, clear: 6, hover: t.apply1 - 2 - t.type1 },
    },
    {
      id: "apply",
      lane: "Promo",
      label: "apply",
      start: t.apply2,
      length: t.accept - t.apply2,
      follows: "type",
      beats: { reach: -2, load: 1 },
    },
    {
      id: "accept",
      lane: "Promo",
      label: "code accepted",
      start: t.accept,
      length: t.strike - t.accept,
      follows: "apply",
      beats: {
        fieldOut: 5,
        discount: 2,
        chip: 4,
        cursor: 2,
        zoomOut: -2,
        zoomOutEnd: 26,
        drift: 20,
      },
    },
    {
      id: "strike",
      lane: "Total",
      label: "strike the old total",
      start: t.strike,
      length: t.roll - t.strike,
      follows: "accept",
      beats: { strike: 8, old: 10 },
    },
    {
      id: "roll",
      lane: "Total",
      label: "total rolls down",
      start: t.roll,
      length: t.pay - t.roll,
      follows: "strike",
      // Each changing digit rolls over `digit`, `stagger` after the last; the
      // pay button's copy starts `button` later.
      beats: { stagger: 3, digit: 16, button: 2 },
    },
    {
      id: "pay",
      lane: "Total",
      label: "pay",
      start: t.pay,
      length: 26,
      follows: "roll",
      beats: { press: 10, glow: 18, glowEnd: 26, cursor: 22 },
    },
  );
  return elements;
});
