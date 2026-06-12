
import { describe, expect, it } from "bun:test";
import { skeletonBlockConfig } from "../config";

type SnippetValues = {
  width?: number;
  height?: number;
  radius?: number;
};
const snippet = (values: SnippetValues): string =>
  skeletonBlockConfig.snippet(values as Record<string, unknown>);

describe("skeletonBlockConfig.controls: width", () => {
  it("width is a number control", () => {
    expect(skeletonBlockConfig.controls.width.type).toBe("number");
  });

  it("width default is 240", () => {
    expect(skeletonBlockConfig.controls.width.default).toBe(240);
  });

  it("width min is 40, max is 600", () => {
    const ctrl = skeletonBlockConfig.controls.width;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(40);
    expect(ctrl.max).toBe(600);
  });
});

describe("skeletonBlockConfig.controls: height", () => {
  it("height is a number control", () => {
    expect(skeletonBlockConfig.controls.height.type).toBe("number");
  });

  it("height default is 20", () => {
    expect(skeletonBlockConfig.controls.height.default).toBe(20);
  });

  it("height min is 8, max is 120", () => {
    const ctrl = skeletonBlockConfig.controls.height;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(8);
    expect(ctrl.max).toBe(120);
  });
});

describe("skeletonBlockConfig.controls: radius", () => {
  it("radius is a number control", () => {
    expect(skeletonBlockConfig.controls.radius.type).toBe("number");
  });

  it("radius default is 6", () => {
    expect(skeletonBlockConfig.controls.radius.default).toBe(6);
  });

  it("radius min is 0, max is 60", () => {
    const ctrl = skeletonBlockConfig.controls.radius;
    if (ctrl.type !== "number") throw new Error("expected number");
    expect(ctrl.min).toBe(0);
    expect(ctrl.max).toBe(60);
  });
});

describe("skeletonBlockConfig.snippet: import line", () => {
  it("includes 'import { SkeletonBlock }' from the correct path", () => {
    const out = snippet({});
    expect(out).toContain("import { SkeletonBlock }");
    expect(out).toContain('from "@/components/remocn/skeleton-block"');
  });
});

describe("skeletonBlockConfig.snippet: structural invariants", () => {
  it("contains a <SkeletonBlock element", () => {
    expect(snippet({})).toContain("<SkeletonBlock");
  });

  it("ends with a self-closing />", () => {
    expect(snippet({}).trimEnd().endsWith("/>")).toBe(true);
  });
});

describe("skeletonBlockConfig.snippet: default props are omitted", () => {

  it("omits width when it equals the default 240", () => {
    const out = snippet({ width: 240 });
    expect(out).not.toContain("width=");
  });

  it("omits height when it equals the default 20", () => {
    const out = snippet({ height: 20 });
    expect(out).not.toContain("height=");
  });

  it("omits radius when it equals the default 6", () => {
    const out = snippet({ radius: 6 });
    expect(out).not.toContain("radius=");
  });

  it("all defaults omitted → compact self-closing element on one line", () => {
    const out = snippet({ width: 240, height: 20, radius: 6 });
    expect(out).toContain("<SkeletonBlock/>");
  });
});

describe("skeletonBlockConfig.snippet: non-default props are emitted", () => {
  it("emits width={120} when non-default", () => {
    expect(snippet({ width: 120 })).toContain("width={120}");
  });

  it("emits width={400} when non-default", () => {
    expect(snippet({ width: 400 })).toContain("width={400}");
  });

  it("emits height={14} when non-default", () => {
    expect(snippet({ height: 14 })).toContain("height={14}");
  });

  it("emits height={48} when non-default (circle use case)", () => {
    expect(snippet({ height: 48 })).toContain("height={48}");
  });

  it("emits radius={0} when non-default (sharp corners)", () => {
    expect(snippet({ radius: 0 })).toContain("radius={0}");
  });

  it("emits radius={24} when non-default (circle use case)", () => {
    expect(snippet({ radius: 24 })).toContain("radius={24}");
  });
});

describe("skeletonBlockConfig.snippet: multiple non-default props", () => {
  it("emits all three props when all are non-default", () => {
    const out = snippet({ width: 180, height: 48, radius: 24 });
    expect(out).toContain("width={180}");
    expect(out).toContain("height={48}");
    expect(out).toContain("radius={24}");
  });

  it("emits only changed props when some are default", () => {
    const out = snippet({ width: 180, height: 20, radius: 6 });
    expect(out).toContain("width={180}");
    expect(out).not.toContain("height=");
    expect(out).not.toContain("radius=");
  });
});

describe("skeletonBlockConfig.snippet: numeric round-trips", () => {
  it("emits correct width for various non-default values", () => {
    for (const w of [40, 120, 320, 600]) {
      if (w !== 240) {
        expect(snippet({ width: w })).toContain(`width={${w}}`);
      }
    }
  });
});
