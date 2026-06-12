
import { describe, expect, it } from "bun:test";
import {
  cursorPathAt,
  ripplePhase,
  clickPress,
  DEFAULT_DURATION,
  CLICK_FRAMES,
  PRESS_FRAMES,
  type CursorWaypoint,
} from "../use-cursor-path";
import { cursorConfig } from "../config";

function pathAt(waypoints: CursorWaypoint[], raw: number, speed = 1) {
  return cursorPathAt(waypoints, raw, { speed });
}

type SnippetValues = {
  variant?: string;
  size?: number;
  mode?: string;
  rippleColor?: string;
};

const snippet = (values: SnippetValues): string =>
  cursorConfig.snippet(values as Record<string, unknown>);

describe("cursor constants", () => {
  it("DEFAULT_DURATION is 24 frames", () => {
    expect(DEFAULT_DURATION).toBe(24);
  });

  it("CLICK_FRAMES is 16 frames", () => {
    expect(CLICK_FRAMES).toBe(16);
  });

  it("PRESS_FRAMES is 8 frames", () => {
    expect(PRESS_FRAMES).toBe(8);
  });
});

describe("ripplePhase: out of range → zero ripple", () => {
  it("returns zero opacity and scale before a click (sinceClick < 0)", () => {
    const r = ripplePhase(-1);
    expect(r.rippleOpacity).toBe(0);
    expect(r.rippleScale).toBe(0);
  });

  it("returns zero opacity and scale exactly at CLICK_FRAMES (expired)", () => {
    const r = ripplePhase(CLICK_FRAMES);
    expect(r.rippleOpacity).toBe(0);
    expect(r.rippleScale).toBe(0);
  });

  it("returns zero opacity and scale well past CLICK_FRAMES", () => {
    const r = ripplePhase(CLICK_FRAMES + 10);
    expect(r.rippleOpacity).toBe(0);
    expect(r.rippleScale).toBe(0);
  });
});

describe("ripplePhase: at frame 0 (click moment)", () => {
  it("rippleOpacity is 0.5 at click moment", () => {
    expect(ripplePhase(0).rippleOpacity).toBeCloseTo(0.5, 10);
  });

  it("rippleScale is 0 at click moment (easing.out(0) = 0)", () => {
    expect(ripplePhase(0).rippleScale).toBeCloseTo(0, 10);
  });
});

describe("ripplePhase: mid-flight (frame = CLICK_FRAMES / 2)", () => {
  const half = CLICK_FRAMES / 2;

  it("rippleOpacity is 0.25 at mid-flight", () => {
    expect(ripplePhase(half).rippleOpacity).toBeCloseTo(0.25, 10);
  });

  it("rippleScale is 2.5 * (1 - (1-0.5)^3) at mid-flight", () => {
    const p = 0.5;
    const expected = 2.5 * (1 - (1 - p) ** 3);
    expect(ripplePhase(half).rippleScale).toBeCloseTo(expected, 10);
  });
});

describe("ripplePhase: just before expiry (frame = CLICK_FRAMES - 1)", () => {
  const lastFrame = CLICK_FRAMES - 1;

  it("rippleOpacity approaches 0 near expiry", () => {
    const p = lastFrame / CLICK_FRAMES;
    const expected = 0.5 * (1 - p);
    expect(ripplePhase(lastFrame).rippleOpacity).toBeCloseTo(expected, 10);
  });

  it("rippleScale approaches max near expiry", () => {
    const p = lastFrame / CLICK_FRAMES;
    const expected = 2.5 * (1 - (1 - p) ** 3);
    expect(ripplePhase(lastFrame).rippleScale).toBeCloseTo(expected, 10);
  });
});

describe("ripplePhase: monotonic invariants across the window", () => {
  it("opacity decreases monotonically across all frames in [0, CLICK_FRAMES)", () => {
    for (let f = 0; f < CLICK_FRAMES - 1; f++) {
      expect(ripplePhase(f).rippleOpacity).toBeGreaterThan(ripplePhase(f + 1).rippleOpacity);
    }
  });

  it("scale increases monotonically across all frames in [0, CLICK_FRAMES)", () => {
    for (let f = 0; f < CLICK_FRAMES - 1; f++) {
      expect(ripplePhase(f).rippleScale).toBeLessThan(ripplePhase(f + 1).rippleScale);
    }
  });
});

describe("clickPress: out of range → 1 (up)", () => {
  it("returns 1 before click (sinceClick < 0)", () => {
    expect(clickPress(-1)).toBe(1);
  });

  it("returns 1 at exactly PRESS_FRAMES (released)", () => {
    expect(clickPress(PRESS_FRAMES)).toBe(1);
  });

  it("returns 1 well past PRESS_FRAMES", () => {
    expect(clickPress(PRESS_FRAMES + 10)).toBe(1);
  });
});

describe("clickPress: at click moment (frame 0)", () => {
  it("pressScale is 1 at frame 0 (not yet dipped)", () => {
    expect(clickPress(0)).toBeCloseTo(1, 10);
  });
});

describe("clickPress: fully pressed at half-way (frame = PRESS_FRAMES/2)", () => {
  const half = PRESS_FRAMES / 2;

  it("pressScale is 0 at the bottom of the press dip", () => {
    expect(clickPress(half)).toBeCloseTo(0, 10);
  });
});

describe("clickPress: returning up at frame PRESS_FRAMES - 1", () => {
  const lastFrame = PRESS_FRAMES - 1;

  it("pressScale is back above 0 near the end of the press window", () => {
    expect(clickPress(lastFrame)).toBeGreaterThan(0);
    expect(clickPress(lastFrame)).toBeLessThan(1);
  });
});

describe("clickPress: dip then rise (down-up triangle shape)", () => {
  it("pressScale decreases from frame 0 to the midpoint", () => {
    for (let f = 0; f < PRESS_FRAMES / 2 - 1; f++) {
      expect(clickPress(f)).toBeGreaterThan(clickPress(f + 1));
    }
  });

  it("pressScale increases from the midpoint back toward 1", () => {
    const half = PRESS_FRAMES / 2;
    for (let f = half; f < PRESS_FRAMES - 1; f++) {
      expect(clickPress(f)).toBeLessThan(clickPress(f + 1));
    }
  });
});

describe("cursorPathAt: empty waypoints", () => {
  it("returns origin with scale=1, no ripple, at any frame", () => {
    const result = cursorPathAt([], 0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
    expect(result.scale).toBe(1);
    expect(result.rippleOpacity).toBe(0);
    expect(result.rippleScale).toBe(0);
  });

  it("same result at a large frame with no waypoints", () => {
    const result = cursorPathAt([], 999);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });
});

describe("cursorPathAt: before first arrival — cursor waits at first waypoint", () => {
  const wps: CursorWaypoint[] = [{ at: 30, x: 100, y: 200 }];

  it("parks at first waypoint x/y at raw=0 (before at)", () => {
    const r = pathAt(wps, 0);
    expect(r.x).toBe(100);
    expect(r.y).toBe(200);
    expect(r.scale).toBe(1);
    expect(r.rippleOpacity).toBe(0);
    expect(r.rippleScale).toBe(0);
    expect(r.pressScale).toBe(1);
  });

  it("parks at first waypoint when raw equals first.at", () => {
    const r = pathAt(wps, 30);
    expect(r.x).toBe(100);
    expect(r.y).toBe(200);
  });
});

describe("cursorPathAt: single waypoint — holds at arrival position past at", () => {
  const wps: CursorWaypoint[] = [{ at: 10, x: 50, y: 80 }];

  it("holds exactly at the waypoint after its arrival", () => {
    const r = pathAt(wps, 100);
    expect(r.x).toBe(50);
    expect(r.y).toBe(80);
  });
});

describe("cursorPathAt: two waypoints — interpolation window", () => {
  const wps: CursorWaypoint[] = [
    { at: 0, x: 0, y: 0 },
    { at: 24, x: 100, y: 200 },
  ];

  it("position at midpoint uses inOut easing (default)", () => {
    const r = pathAt(wps, 12);
    expect(r.x).toBeCloseTo(50, 10);
    expect(r.y).toBeCloseTo(100, 10);
  });

  it("position at raw=0 is at the FROM waypoint (t=0)", () => {
    const r = pathAt(wps, 0);
    expect(r.x).toBeCloseTo(0, 10);
    expect(r.y).toBeCloseTo(0, 10);
  });

  it("position at raw=24 (arrival) holds at TO waypoint (t=1)", () => {
    const r = pathAt(wps, 24);
    expect(r.x).toBeCloseTo(100, 10);
    expect(r.y).toBeCloseTo(200, 10);
  });

  it("position past arrival holds at TO waypoint", () => {
    const r = pathAt(wps, 999);
    expect(r.x).toBeCloseTo(100, 10);
    expect(r.y).toBeCloseTo(200, 10);
  });
});

describe("cursorPathAt: easing override", () => {
  const wpsLinear: CursorWaypoint[] = [
    { at: 0, x: 0, y: 0 },
    { at: 24, x: 100, y: 0, easing: "linear" },
  ];
  const wpsOut: CursorWaypoint[] = [
    { at: 0, x: 0, y: 0 },
    { at: 24, x: 100, y: 0, easing: "out" },
  ];

  it("linear easing: x=50 at midpoint", () => {
    expect(pathAt(wpsLinear, 12).x).toBeCloseTo(50, 10);
  });

  it("out easing: x = 100 * (1-(1-0.5)^3) at midpoint", () => {
    expect(pathAt(wpsOut, 12).x).toBeCloseTo(87.5, 10);
  });

  it("easing=linear gives different x than easing=out at midpoint", () => {
    expect(pathAt(wpsLinear, 12).x).not.toBeCloseTo(pathAt(wpsOut, 12).x, 3);
  });
});

describe("cursorPathAt: custom duration override", () => {
  const wps: CursorWaypoint[] = [
    { at: 0, x: 0, y: 0 },
    { at: 24, x: 100, y: 0, duration: 12 },
  ];

  it("duration=12 — cursor holds FROM position before the window start", () => {
    const r = pathAt(wps, 10);
    expect(r.x).toBeCloseTo(0, 10);
  });

  it("duration=12 — x=50 at midpoint of the 12-frame window (raw=18)", () => {
    const r = pathAt(wps, 18);
    expect(r.x).toBeCloseTo(50, 10);
  });
});

describe("cursorPathAt: defaultDuration option", () => {
  const wps: CursorWaypoint[] = [
    { at: 0, x: 0, y: 0 },
    { at: 24, x: 100, y: 0 },
  ];

  it("defaultDuration=12 gives x=50 at raw=18 (midpoint of 12-frame window)", () => {
    const r = cursorPathAt(wps, 18, { defaultDuration: 12 });
    expect(r.x).toBeCloseTo(50, 10);
  });

  it("changing defaultDuration changes the interpolated position at the same raw frame", () => {
    const r12 = cursorPathAt(wps, 18, { defaultDuration: 12 });
    const r24 = cursorPathAt(wps, 18, { defaultDuration: 24 });
    expect(r12.x).not.toBeCloseTo(r24.x, 3);
  });
});

describe("cursorPathAt: scale is always 1", () => {
  const wps: CursorWaypoint[] = [
    { at: 0, x: 0, y: 0 },
    { at: 24, x: 100, y: 200, click: true },
  ];

  it("scale is 1 before the path starts", () => {
    expect(pathAt(wps, 0).scale).toBe(1);
  });

  it("scale is 1 during motion", () => {
    expect(pathAt(wps, 12).scale).toBe(1);
  });

  it("scale is 1 after arrival with a click", () => {
    expect(pathAt(wps, 30).scale).toBe(1);
  });
});

describe("cursorPathAt: no click — ripple stays zero", () => {
  const wps: CursorWaypoint[] = [
    { at: 0, x: 0, y: 0 },
    { at: 24, x: 100, y: 0 },
  ];

  it("rippleOpacity is 0 at any frame when no waypoint has click:true", () => {
    expect(pathAt(wps, 0).rippleOpacity).toBe(0);
    expect(pathAt(wps, 24).rippleOpacity).toBe(0);
    expect(pathAt(wps, 30).rippleOpacity).toBe(0);
  });
});

describe("cursorPathAt: click:true — ripple and press-dip fire at arrival", () => {
  const wps: CursorWaypoint[] = [
    { at: 0, x: 0, y: 0 },
    { at: 24, x: 100, y: 0, click: true },
  ];

  it("rippleOpacity is 0 before the click waypoint arrival", () => {
    expect(pathAt(wps, 20).rippleOpacity).toBe(0);
    expect(pathAt(wps, 23).rippleOpacity).toBe(0);
  });

  it("rippleOpacity is 0.5 exactly at click arrival (sinceClick=0)", () => {
    expect(pathAt(wps, 24).rippleOpacity).toBeCloseTo(0.5, 10);
  });

  it("rippleOpacity decays to 0 after CLICK_FRAMES since click", () => {
    expect(pathAt(wps, 24 + CLICK_FRAMES).rippleOpacity).toBe(0);
  });

  it("pressScale is 1 at frame 0 of click dip (not yet dipped)", () => {
    expect(pathAt(wps, 24).pressScale).toBeCloseTo(1, 10);
  });

  it("pressScale is 0 at the midpoint of the press dip", () => {
    expect(pathAt(wps, 24 + PRESS_FRAMES / 2).pressScale).toBeCloseTo(0, 10);
  });

  it("pressScale returns to 1 after the press window completes", () => {
    expect(pathAt(wps, 24 + PRESS_FRAMES).pressScale).toBeCloseTo(1, 10);
  });
});

describe("cursorPathAt: multiple clicks — only the most recent active click fires", () => {
  const wps: CursorWaypoint[] = [
    { at: 0,  x: 0,   y: 0,   click: true },
    { at: 48, x: 100, y: 100, click: true },
  ];

  it("ripple fires from the first click at raw=5 (sinceClick=5)", () => {
    const r = pathAt(wps, 5);
    const expected = ripplePhase(5);
    expect(r.rippleOpacity).toBeCloseTo(expected.rippleOpacity, 10);
    expect(r.rippleScale).toBeCloseTo(expected.rippleScale, 10);
  });

  it("ripple fires from the second click at raw=50 (sinceClick=2)", () => {
    const r = pathAt(wps, 50);
    const expected = ripplePhase(2);
    expect(r.rippleOpacity).toBeCloseTo(expected.rippleOpacity, 10);
    expect(r.rippleScale).toBeCloseTo(expected.rippleScale, 10);
  });

  it("between clicks, first ripple has expired at raw=40 (sinceClick=40 >= CLICK_FRAMES=16)", () => {
    const r = pathAt(wps, 40);
    expect(r.rippleOpacity).toBe(0);
    expect(r.rippleScale).toBe(0);
  });
});

describe("cursorPathAt: press:true — held press look", () => {
  const wps: CursorWaypoint[] = [
    { at: 0,  x: 0,   y: 0,   press: true },
    { at: 48, x: 100, y: 100 },
  ];

  it("pressScale is 0 (fully pressed) while the press segment is active", () => {
    expect(pathAt(wps, 10).pressScale).toBe(0);
  });

  it("pressScale is 0 just before second waypoint arrives", () => {
    expect(pathAt(wps, 47).pressScale).toBe(0);
  });

  it("pressScale is 1 after the second (non-press) waypoint arrives", () => {
    expect(pathAt(wps, 48).pressScale).toBe(1);
  });
});

describe("cursorPathAt: no press flag — pressScale is always 1", () => {
  const wps: CursorWaypoint[] = [
    { at: 0,  x: 0,   y: 0 },
    { at: 24, x: 100, y: 0 },
  ];

  it("pressScale is 1 during motion (no press, no click)", () => {
    expect(pathAt(wps, 12).pressScale).toBe(1);
  });
});

describe("cursorPathAt: speed contract", () => {
  const wps: CursorWaypoint[] = [
    { at: 0, x: 0, y: 0 },
    { at: 24, x: 100, y: 0 },
  ];

  it("speed=2: arrival reached at raw=12 (effectiveFrame=24)", () => {
    const r = pathAt(wps, 12, 2);
    expect(r.x).toBeCloseTo(100, 10);
  });

  it("speed=2: midpoint at raw=6 (effectiveFrame=12)", () => {
    const r = pathAt(wps, 6, 2);
    expect(r.x).toBeCloseTo(50, 10);
  });

  it("speed=0.5: arrival not reached at raw=24 (effectiveFrame=12)", () => {
    const r = pathAt(wps, 24, 0.5);
    expect(r.x).toBeCloseTo(50, 10);
  });

  it("speed=0.5: arrival reached at raw=48 (effectiveFrame=24)", () => {
    const r = pathAt(wps, 48, 0.5);
    expect(r.x).toBeCloseTo(100, 10);
  });

  it("speed=1 matches the default (no speed option) at every sample", () => {
    for (const raw of [0, 6, 12, 18, 24, 30]) {
      const withSpeed = pathAt(wps, raw, 1);
      const withDefault = cursorPathAt(wps, raw);
      expect(withSpeed.x).toBeCloseTo(withDefault.x, 10);
      expect(withSpeed.y).toBeCloseTo(withDefault.y, 10);
    }
  });
});

describe("cursorPathAt: three waypoints — segment selection", () => {
  const wps: CursorWaypoint[] = [
    { at: 0,  x: 0,   y: 0 },
    { at: 24, x: 100, y: 0 },
    { at: 48, x: 200, y: 0 },
  ];

  it("during first segment, x is between 0 and 100", () => {
    const r = pathAt(wps, 12);
    expect(r.x).toBeGreaterThan(0);
    expect(r.x).toBeLessThan(100);
  });

  it("at first arrival (raw=24), x is exactly 100", () => {
    expect(pathAt(wps, 24).x).toBeCloseTo(100, 10);
  });

  it("during second segment, x is between 100 and 200", () => {
    const r = pathAt(wps, 36);
    expect(r.x).toBeGreaterThan(100);
    expect(r.x).toBeLessThan(200);
  });

  it("at second arrival (raw=48), x is exactly 200", () => {
    expect(pathAt(wps, 48).x).toBeCloseTo(200, 10);
  });

  it("past last arrival, x holds at 200", () => {
    expect(pathAt(wps, 999).x).toBeCloseTo(200, 10);
  });
});

describe("cursorConfig.controls: variant", () => {
  it("variant is a select control", () => {
    expect(cursorConfig.controls.variant.type).toBe("select");
  });

  it("variant options are ['arrow', 'pointer']", () => {
    const ctrl = cursorConfig.controls.variant;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["arrow", "pointer"]);
  });

  it("variant default is 'arrow'", () => {
    expect(cursorConfig.controls.variant.default).toBe("arrow");
  });
});

describe("cursorConfig.controls: size", () => {
  it("size is a number control", () => {
    expect(cursorConfig.controls.size.type).toBe("number");
  });

  it("size default is 28", () => {
    expect(cursorConfig.controls.size.default).toBe(28);
  });

  it("size min is 16", () => {
    const ctrl = cursorConfig.controls.size;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(16);
  });

  it("size max is 64", () => {
    const ctrl = cursorConfig.controls.size;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.max).toBe(64);
  });
});

describe("cursorConfig.controls: mode", () => {
  it("mode is a select control", () => {
    expect(cursorConfig.controls.mode.type).toBe("select");
  });

  it("mode options are ['light', 'dark']", () => {
    const ctrl = cursorConfig.controls.mode;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["light", "dark"]);
  });

  it("mode default is 'light'", () => {
    expect(cursorConfig.controls.mode.default).toBe("light");
  });
});

describe("cursorConfig.controls: rippleColor", () => {
  it("rippleColor is a color control", () => {
    expect(cursorConfig.controls.rippleColor.type).toBe("color");
  });

  it("rippleColor default is '#171717'", () => {
    expect(cursorConfig.controls.rippleColor.default).toBe("#171717");
  });
});

describe("cursorConfig.snippet: import lines", () => {
  it("includes 'import { Cursor }' from the correct path", () => {
    const out = snippet({});
    expect(out).toContain("import { Cursor }");
    expect(out).toContain('from "@/components/remocn/cursor"');
  });

  it("includes 'import { useCursorPath }' from the correct path", () => {
    const out = snippet({});
    expect(out).toContain("import { useCursorPath }");
    expect(out).toContain('from "@/components/remocn/use-cursor-path"');
  });
});

describe("cursorConfig.snippet: structural invariants", () => {
  it("contains a <Cursor JSX element", () => {
    expect(snippet({})).toContain("<Cursor");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({}).trimEnd().endsWith("/>")).toBe(true);
  });

  it("contains the useCursorPath invocation with an example waypoint array", () => {
    const out = snippet({});
    expect(out).toContain("useCursorPath(");
  });
});

describe("cursorConfig.snippet: default props are omitted", () => {
  const allDefaults = snippet({ variant: "arrow", size: 28, mode: "light" });

  it("omits variant when it equals 'arrow'", () => {
    expect(allDefaults).not.toContain("variant=");
  });

  it("omits size when it equals 28", () => {
    expect(allDefaults).not.toContain("size=");
  });

  it("omits mode when it equals 'light'", () => {
    expect(allDefaults).not.toContain("mode=");
  });
});

describe("cursorConfig.snippet: non-default props are emitted", () => {
  it("emits variant='pointer' when non-default", () => {
    expect(snippet({ variant: "pointer" })).toContain('variant="pointer"');
  });

  it("emits size={32} when non-default", () => {
    expect(snippet({ size: 32 })).toContain("size={32}");
  });

  it("emits mode='dark' when non-default", () => {
    expect(snippet({ mode: "dark" })).toContain('mode="dark"');
  });

  it("does NOT emit variant for the default 'arrow' even when explicitly passed", () => {
    expect(snippet({ variant: "arrow" })).not.toContain("variant=");
  });
});

describe("cursorConfig.snippet: snippet always includes style={style} prop", () => {
  it("includes style={style} in every variant", () => {
    expect(snippet({})).toContain("style={style}");
    expect(snippet({ variant: "pointer" })).toContain("style={style}");
    expect(snippet({ mode: "dark", size: 40 })).toContain("style={style}");
  });
});
