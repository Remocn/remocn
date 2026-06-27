
import { describe, expect, it } from "bun:test";
import {
  messageBubbleStyle,
  messageBubbleStyleContext,
  messageBubbleReactionStyle,
  type MessageBubbleState,
  type MessageBubbleVariant,
} from "../index";
import {
  tweenMessageBubbleStyle,
  DEFAULT_DURATION,
} from "../use-message-bubble-transition";
import { messageBubbleConfig } from "../config";
import { defaultLightTheme, defaultDarkTheme, easings, clamp01 } from "@/lib/remocn-ui";
import type { Step } from "@/lib/remocn-ui";

const VALID_STATES: readonly MessageBubbleState[] = ["hidden", "visible"];
const VALID_VARIANTS: readonly MessageBubbleVariant[] = ["incoming", "outgoing"];

type SnippetValues = {
  state?: string;
  variant?: string;
  text?: string;
  reaction?: string;
};
const snippet = (values: SnippetValues): string =>
  messageBubbleConfig.snippet(values as Record<string, unknown>);

describe("DEFAULT_DURATION", () => {
  it("is 14 frames", () => {
    expect(DEFAULT_DURATION).toBe(14);
  });
});

describe("messageBubbleStyle: hidden state — off-screen keyframe", () => {
  const s = messageBubbleStyle("hidden");

  it("opacity is 0 (invisible)", () => {
    expect(s.opacity).toBe(0);
  });

  it("translateY is 12 (enters from 12px below)", () => {
    expect(s.translateY).toBe(12);
  });

  it("scale is 0.94 (slightly shrunken at rest-hidden)", () => {
    expect(s.scale).toBeCloseTo(0.94, 10);
  });
});

describe("messageBubbleStyle: visible state — resting keyframe", () => {
  const s = messageBubbleStyle("visible");

  it("opacity is 1 (fully visible)", () => {
    expect(s.opacity).toBe(1);
  });

  it("translateY is 0 (at rest position)", () => {
    expect(s.translateY).toBe(0);
  });

  it("scale is 1 (full size)", () => {
    expect(s.scale).toBe(1);
  });
});

describe("messageBubbleStyle: both states are complete keyframes", () => {
  it("every MessageBubbleStyle field is defined and numeric for every state", () => {
    for (const state of VALID_STATES) {
      const s = messageBubbleStyle(state);
      expect(typeof s.opacity).toBe("number");
      expect(typeof s.translateY).toBe("number");
      expect(typeof s.scale).toBe("number");
    }
  });

  it("hidden and visible have distinct opacity (0 vs 1)", () => {
    expect(messageBubbleStyle("hidden").opacity).toBe(0);
    expect(messageBubbleStyle("visible").opacity).toBe(1);
  });

  it("hidden and visible have distinct translateY (12 vs 0)", () => {
    expect(messageBubbleStyle("hidden").translateY).toBe(12);
    expect(messageBubbleStyle("visible").translateY).toBe(0);
  });

  it("hidden and visible have distinct scale (0.94 vs 1)", () => {
    expect(messageBubbleStyle("hidden").scale).toBeCloseTo(0.94, 10);
    expect(messageBubbleStyle("visible").scale).toBe(1);
  });
});

describe("messageBubbleStyleContext: incoming variant (light theme)", () => {
  const ctx = messageBubbleStyleContext("incoming", defaultLightTheme);

  it("background equals theme.muted", () => {
    expect(ctx.background).toBe(defaultLightTheme.muted);
  });

  it("color equals theme.foreground", () => {
    expect(ctx.color).toBe(defaultLightTheme.foreground);
  });

  it("align is 'flex-start'", () => {
    expect(ctx.align).toBe("flex-start");
  });

  it("reactionSide is 'left'", () => {
    expect(ctx.reactionSide).toBe("left");
  });
});

describe("messageBubbleStyleContext: outgoing variant (light theme)", () => {
  const ctx = messageBubbleStyleContext("outgoing", defaultLightTheme);

  it("background equals theme.primary", () => {
    expect(ctx.background).toBe(defaultLightTheme.primary);
  });

  it("color equals theme.primaryForeground", () => {
    expect(ctx.color).toBe(defaultLightTheme.primaryForeground);
  });

  it("align is 'flex-end'", () => {
    expect(ctx.align).toBe("flex-end");
  });

  it("reactionSide is 'right'", () => {
    expect(ctx.reactionSide).toBe("right");
  });
});

describe("messageBubbleStyleContext: incoming variant (dark theme)", () => {
  const ctx = messageBubbleStyleContext("incoming", defaultDarkTheme);

  it("background equals dark theme.muted", () => {
    expect(ctx.background).toBe(defaultDarkTheme.muted);
  });

  it("color equals dark theme.foreground", () => {
    expect(ctx.color).toBe(defaultDarkTheme.foreground);
  });

  it("align is 'flex-start'", () => {
    expect(ctx.align).toBe("flex-start");
  });

  it("reactionSide is 'left'", () => {
    expect(ctx.reactionSide).toBe("left");
  });
});

describe("messageBubbleStyleContext: outgoing variant (dark theme)", () => {
  const ctx = messageBubbleStyleContext("outgoing", defaultDarkTheme);

  it("background equals dark theme.primary", () => {
    expect(ctx.background).toBe(defaultDarkTheme.primary);
  });

  it("color equals dark theme.primaryForeground", () => {
    expect(ctx.color).toBe(defaultDarkTheme.primaryForeground);
  });

  it("align is 'flex-end'", () => {
    expect(ctx.align).toBe("flex-end");
  });

  it("reactionSide is 'right'", () => {
    expect(ctx.reactionSide).toBe("right");
  });
});

describe("messageBubbleStyleContext: light and dark muted colors differ", () => {
  it("incoming background differs between light and dark themes", () => {
    const light = messageBubbleStyleContext("incoming", defaultLightTheme);
    const dark = messageBubbleStyleContext("incoming", defaultDarkTheme);
    expect(light.background).not.toBe(dark.background);
  });
});

describe("messageBubbleReactionStyle: visible state", () => {
  const r = messageBubbleReactionStyle("visible");

  it("opacity is 1", () => {
    expect(r.opacity).toBe(1);
  });

  it("scale is 1", () => {
    expect(r.scale).toBe(1);
  });
});

describe("messageBubbleReactionStyle: hidden state", () => {
  const r = messageBubbleReactionStyle("hidden");

  it("opacity is 0", () => {
    expect(r.opacity).toBe(0);
  });

  it("scale is 0", () => {
    expect(r.scale).toBe(0);
  });
});

describe("tweenMessageBubbleStyle: t=0 returns values equal to `a`", () => {
  const a = messageBubbleStyle("hidden");
  const b = messageBubbleStyle("visible");
  const r = tweenMessageBubbleStyle(a, b, 0);

  it("opacity equals a.opacity at t=0", () => {
    expect(r.opacity).toBeCloseTo(a.opacity, 10);
  });

  it("translateY equals a.translateY at t=0", () => {
    expect(r.translateY).toBeCloseTo(a.translateY, 10);
  });

  it("scale equals a.scale at t=0", () => {
    expect(r.scale).toBeCloseTo(a.scale, 10);
  });
});

describe("tweenMessageBubbleStyle: t=1 returns values equal to `b`", () => {
  const a = messageBubbleStyle("hidden");
  const b = messageBubbleStyle("visible");
  const r = tweenMessageBubbleStyle(a, b, 1);

  it("opacity equals b.opacity at t=1", () => {
    expect(r.opacity).toBeCloseTo(b.opacity, 10);
  });

  it("translateY equals b.translateY at t=1", () => {
    expect(r.translateY).toBeCloseTo(b.translateY, 10);
  });

  it("scale equals b.scale at t=1", () => {
    expect(r.scale).toBeCloseTo(b.scale, 10);
  });
});

describe("tweenMessageBubbleStyle: t=0.5 midpoint (hidden → visible)", () => {
  const a = messageBubbleStyle("hidden");
  const b = messageBubbleStyle("visible");
  const r = tweenMessageBubbleStyle(a, b, 0.5);

  it("opacity midpoint: 0 → 1 gives 0.5", () => {
    expect(r.opacity).toBeCloseTo(0.5, 10);
  });

  it("translateY midpoint: 12 → 0 gives 6", () => {
    expect(r.translateY).toBeCloseTo(6, 10);
  });

  it("scale midpoint: 0.94 → 1 gives 0.97", () => {
    expect(r.scale).toBeCloseTo(0.97, 10);
  });
});

describe("tweenMessageBubbleStyle: identity (a === b, any t)", () => {
  const s = messageBubbleStyle("visible");

  it("opacity is unchanged when both endpoints are the same", () => {
    expect(tweenMessageBubbleStyle(s, s, 0.5).opacity).toBeCloseTo(s.opacity, 10);
  });

  it("translateY is unchanged when both endpoints are the same", () => {
    expect(tweenMessageBubbleStyle(s, s, 0.5).translateY).toBeCloseTo(s.translateY, 10);
  });

  it("scale is unchanged when both endpoints are the same", () => {
    expect(tweenMessageBubbleStyle(s, s, 0.5).scale).toBeCloseTo(s.scale, 10);
  });
});

describe("tweenMessageBubbleStyle: t=0.25 quarter-point (hidden → visible)", () => {
  const a = messageBubbleStyle("hidden");
  const b = messageBubbleStyle("visible");
  const r = tweenMessageBubbleStyle(a, b, 0.25);

  it("opacity at t=0.25 is 0.25", () => {
    expect(r.opacity).toBeCloseTo(0.25, 10);
  });

  it("translateY at t=0.25 is 9", () => {
    expect(r.translateY).toBeCloseTo(9, 10);
  });

  it("scale at t=0.25 is 0.955", () => {
    expect(r.scale).toBeCloseTo(0.955, 10);
  });
});

function clamp01Mirror(t: number): number {
  return Math.max(0, Math.min(1, t));
}

function easingOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function resolveStateTransition<S extends string>(
  raw: number,
  steps: Step<S>[],
  defaultState: S,
  speed = 1,
  defaultDuration = 8,
): { from: S; to: S; progress: number } {
  const effectiveFrame = raw * speed;
  const started = steps
    .map((step, index) => ({ step, index }))
    .sort((a, b) => a.step.at - b.step.at || a.index - b.index)
    .filter((e) => e.step.at <= effectiveFrame);
  if (started.length === 0)
    return { from: defaultState, to: defaultState, progress: 1 };
  const to = started[started.length - 1].step;
  const from = started.length >= 2 ? started[started.length - 2].step : null;
  const dur = to.duration ?? defaultDuration;
  const progress = dur > 0 ? clamp01Mirror((effectiveFrame - to.at) / dur) : 1;
  return { from: from ? from.state : defaultState, to: to.state, progress };
}

function resolveMessageBubbleTransition(
  raw: number,
  steps: Step<MessageBubbleState>[],
  speed = 1,
  defaultDuration = DEFAULT_DURATION,
): { style: ReturnType<typeof tweenMessageBubbleStyle>; progress: number; from: MessageBubbleState; to: MessageBubbleState } {
  const { from, to, progress } = resolveStateTransition(
    raw,
    steps,
    "hidden",
    speed,
    defaultDuration,
  );
  const t = easingOut(progress);
  const style = tweenMessageBubbleStyle(
    messageBubbleStyle(from as MessageBubbleState),
    messageBubbleStyle(to as MessageBubbleState),
    t,
  );
  return { style, progress, from: from as MessageBubbleState, to: to as MessageBubbleState };
}

describe("resolveMessageBubbleTransition: before any step — holds at hidden", () => {
  it("returns the hidden style when no steps have started", () => {
    const { style } = resolveMessageBubbleTransition(0, []);
    const hidden = messageBubbleStyle("hidden");
    expect(style.opacity).toBeCloseTo(hidden.opacity, 10);
    expect(style.translateY).toBeCloseTo(hidden.translateY, 10);
    expect(style.scale).toBeCloseTo(hidden.scale, 10);
  });

  it("from and to are both 'hidden' before any step", () => {
    const { from, to } = resolveMessageBubbleTransition(0, []);
    expect(from).toBe("hidden");
    expect(to).toBe("hidden");
  });
});

describe("resolveMessageBubbleTransition: exactly at hidden→visible step boundary", () => {
  const steps: Step<MessageBubbleState>[] = [{ at: 10, state: "visible" }];

  it("at raw=10 exactly, progress=0, t=out(0)=0 → style equals hidden (from)", () => {
    const { style, progress } = resolveMessageBubbleTransition(10, steps);
    expect(progress).toBe(0);
    const hidden = messageBubbleStyle("hidden");
    expect(style.opacity).toBeCloseTo(hidden.opacity, 10);
    expect(style.translateY).toBeCloseTo(hidden.translateY, 10);
    expect(style.scale).toBeCloseTo(hidden.scale, 10);
  });

  it("from='hidden', to='visible' at the step boundary", () => {
    const { from, to } = resolveMessageBubbleTransition(10, steps);
    expect(from).toBe("hidden");
    expect(to).toBe("visible");
  });
});

describe("resolveMessageBubbleTransition: mid-window uses easings.out (not linear)", () => {
  const steps: Step<MessageBubbleState>[] = [{ at: 0, state: "visible" }];

  it("opacity at raw=7 is tween(0,1,out(0.5)) ≈ 0.875 (not linear 0.5)", () => {
    const { style } = resolveMessageBubbleTransition(7, steps, 1, 14);
    const expectedT = easingOut(0.5);
    expect(style.opacity).toBeCloseTo(expectedT, 8);
  });

  it("translateY at raw=7 is tween(12,0,out(0.5)): 12*(1-out(0.5))", () => {
    const { style } = resolveMessageBubbleTransition(7, steps, 1, 14);
    const t = easingOut(0.5);
    const expected = 12 * (1 - t);
    expect(style.translateY).toBeCloseTo(expected, 8);
  });

  it("scale at raw=7 is tween(0.94,1,out(0.5))", () => {
    const { style } = resolveMessageBubbleTransition(7, steps, 1, 14);
    const t = easingOut(0.5);
    const expected = 0.94 + (1 - 0.94) * t;
    expect(style.scale).toBeCloseTo(expected, 8);
  });
});

describe("resolveMessageBubbleTransition: past the transition window → fully visible", () => {
  const steps: Step<MessageBubbleState>[] = [{ at: 0, state: "visible" }];

  it("opacity is 1 after DEFAULT_DURATION frames", () => {
    const { style } = resolveMessageBubbleTransition(DEFAULT_DURATION, steps);
    expect(style.opacity).toBeCloseTo(1, 10);
  });

  it("translateY is 0 after DEFAULT_DURATION frames", () => {
    const { style } = resolveMessageBubbleTransition(DEFAULT_DURATION, steps);
    expect(style.translateY).toBeCloseTo(0, 10);
  });

  it("scale is 1 after DEFAULT_DURATION frames", () => {
    const { style } = resolveMessageBubbleTransition(DEFAULT_DURATION, steps);
    expect(style.scale).toBeCloseTo(1, 10);
  });
});

describe("resolveMessageBubbleTransition: speed contract", () => {
  const steps: Step<MessageBubbleState>[] = [{ at: 14, state: "visible" }];

  it("speed=2: step at=14 fires at raw=7 (eff=14)", () => {
    const { to } = resolveMessageBubbleTransition(7, steps, 2);
    expect(to).toBe("visible");
  });

  it("speed=2: step at=14 has NOT fired at raw=6 (eff=12 < 14)", () => {
    const { to } = resolveMessageBubbleTransition(6, steps, 2);
    expect(to).toBe("hidden");
  });
});

describe("messageBubbleConfig.controls: variant", () => {
  it("variant is a select control", () => {
    expect(messageBubbleConfig.controls.variant.type).toBe("select");
  });

  it("variant options are ['incoming', 'outgoing']", () => {
    const ctrl = messageBubbleConfig.controls.variant;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["incoming", "outgoing"]);
  });

  it("variant default is 'incoming'", () => {
    expect(messageBubbleConfig.controls.variant.default).toBe("incoming");
  });

  it("every variant option is a valid MessageBubbleVariant", () => {
    const ctrl = messageBubbleConfig.controls.variant;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_VARIANTS).toContain(opt as MessageBubbleVariant);
    }
  });
});

describe("messageBubbleConfig.controls: state", () => {
  it("state is a select control", () => {
    expect(messageBubbleConfig.controls.state.type).toBe("select");
  });

  it("state options are ['hidden', 'visible']", () => {
    const ctrl = messageBubbleConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    expect(ctrl.options).toEqual(["hidden", "visible"]);
  });

  it("state default is 'visible'", () => {
    expect(messageBubbleConfig.controls.state.default).toBe("visible");
  });

  it("every state option is a valid MessageBubbleState", () => {
    const ctrl = messageBubbleConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const opt of ctrl.options) {
      expect(VALID_STATES).toContain(opt as MessageBubbleState);
    }
  });
});

describe("messageBubbleConfig.controls: text and reaction", () => {
  it("text is a text control", () => {
    expect(messageBubbleConfig.controls.text.type).toBe("text");
  });

  it("reaction is a text control", () => {
    expect(messageBubbleConfig.controls.reaction.type).toBe("text");
  });
});

describe("messageBubbleConfig.snippet: import line", () => {
  it("includes 'import { MessageBubble }' from the correct path", () => {
    const out = snippet({ state: "visible", variant: "incoming" });
    expect(out).toContain("import { MessageBubble }");
    expect(out).toContain('from "@/components/remocn/message-bubble"');
  });
});

describe("messageBubbleConfig.snippet: structural invariants", () => {
  it("contains a <MessageBubble JSX element", () => {
    expect(snippet({ state: "visible", variant: "incoming" })).toContain("<MessageBubble");
  });

  it("state prop is always emitted", () => {
    expect(snippet({ state: "visible", variant: "incoming" })).toContain('state="visible"');
    expect(snippet({ state: "hidden", variant: "outgoing" })).toContain('state="hidden"');
  });

  it("variant prop is always emitted", () => {
    expect(snippet({ state: "visible", variant: "incoming" })).toContain('variant="incoming"');
    expect(snippet({ state: "visible", variant: "outgoing" })).toContain('variant="outgoing"');
  });
});

describe("messageBubbleConfig.snippet: reaction omitted when empty string", () => {
  it("does not emit reaction prop when reaction is empty string", () => {
    const out = snippet({ state: "visible", variant: "incoming", reaction: "" });
    expect(out).not.toContain("reaction=");
  });
});

describe("messageBubbleConfig.snippet: reaction emitted when provided", () => {
  it("emits reaction prop when reaction is a non-empty string", () => {
    const out = snippet({ state: "visible", variant: "incoming", reaction: "🔥" });
    expect(out).toContain('reaction="🔥"');
  });

  it("emits reaction prop for any non-empty value", () => {
    const out = snippet({ state: "visible", variant: "outgoing", reaction: "👍" });
    expect(out).toContain('reaction="👍"');
  });
});

describe("messageBubbleConfig.snippet: state options round-trip", () => {
  it("emits the correct state for every control option", () => {
    const ctrl = messageBubbleConfig.controls.state;
    if (ctrl.type !== "select") throw new Error("expected select");
    for (const state of ctrl.options) {
      expect(snippet({ state })).toContain(`state="${state}"`);
    }
  });
});
