import { describe, expect, it } from "bun:test";
import { getDefaults, resolveControls } from "@/lib/customizer-config";
import {
  type CodeMorphRenderToken,
  type CodeMorphStep,
  type CodeMorphToken,
  codeMorphDefaults,
  codeMorphLength,
  diffCodeMorphTokens,
  getCodeMorphDuration,
  getCodeMorphLayout,
  getCodeMorphState,
  getCodeMorphTime,
  getCodeMorphTimeline,
  normalizeCodeMorphCode,
  tokenizeCodeMorph,
} from "..";
import { codeMorphConfig } from "../config";

const VITE: CodeMorphStep[] = [
  {
    at: 0,
    code: [
      "export default defineConfig({",
      "  plugins: [react()],",
      "});",
    ].join("\n"),
  },
  {
    at: 45,
    code: [
      'import tailwindcss from "@tailwindcss/vite";',
      "",
      "export default defineConfig({",
      "  plugins: [react(), tailwindcss()],",
      "});",
    ].join("\n"),
  },
  {
    at: 110,
    code: [
      'import tailwindcss from "@tailwindcss/vite";',
      "",
      "export default defineConfig({",
      "  plugins: [react(), tailwindcss()],",
      "  server: { port: 3000 },",
      "});",
    ].join("\n"),
  },
];

const SWAP: CodeMorphStep[] = [
  {
    at: 0,
    code: [
      'const owner = load("owner");',
      'const team = load("team");',
      "render(owner, team);",
    ].join("\n"),
  },
  {
    at: 30,
    code: [
      'const team = load("team");',
      'const owner = load("owner");',
      "render(owner, team);",
    ].join("\n"),
  },
];

const frames = (first: number, last: number, step = 1) =>
  Array.from(
    { length: Math.floor((last - first) / step) + 1 },
    (_, i) => first + i * step,
  );

const placed = (tokens: CodeMorphRenderToken[]) =>
  tokens.map((token) => `${token.text}@${token.line}:${token.col}`).sort();

const keysOf = (tokens: CodeMorphRenderToken[]) =>
  tokens.map((token) => token.key).sort();

const indexOf = (token: CodeMorphRenderToken) =>
  Number(token.key.slice(token.key.indexOf(":") + 1));

const spot = (token: CodeMorphToken) => [token.line, token.col];

describe("code morph timeline", () => {
  it("settles the default morph at the documented length", () => {
    const timeline = getCodeMorphTimeline();
    expect(codeMorphLength).toBe(114);
    expect(timeline.morph).toBe(36);
    expect(timeline.steps).toEqual([0, 48]);
    expect(timeline.morphs).toEqual([
      {
        from: 0,
        to: 1,
        start: 48,
        end: 84,
        highlightStart: 68,
        fallStart: 100,
        highlightEnd: 114,
      },
    ]);
    expect(timeline.settled).toBe(codeMorphLength);
    expect(timeline.duration).toBe(138);
    expect(getCodeMorphDuration()).toBe(codeMorphConfig.durationInFrames);
  });

  it("scales the preview duration with speed, morph and highlight", () => {
    expect(getCodeMorphDuration({ highlight: false })).toBe(108);
    expect(getCodeMorphDuration({ speed: 2 })).toBe(69);
    expect(getCodeMorphDuration({ speed: 0.5 })).toBe(276);
    expect(getCodeMorphDuration({ speed: 0 })).toBe(1);
    expect(getCodeMorphDuration({ morphDuration: 60 })).toBe(152);
    expect(getCodeMorphDuration({ morphDuration: 1 })).toBe(125);
    expect(getCodeMorphDuration({ morphDuration: 999 })).toBe(192);
    expect(getCodeMorphDuration({ morphDuration: Number.NaN })).toBe(138);
    const resolve = codeMorphConfig.getDurationInFrames;
    const values = { morphDuration: 60, highlight: false, speed: 2 };
    expect(resolve?.(values)).toBe(66);
    expect(resolve?.({ morphDuration: "slow", speed: "fast" })).toBe(138);
  });

  it("chains steps in order and never overlaps two morphs", () => {
    const overlap: CodeMorphStep[] = [
      { at: 0, code: "a" },
      { at: 48, code: "b" },
      { at: 60, code: "c" },
    ];
    const chained = getCodeMorphTimeline({ steps: overlap });
    const windows = chained.morphs.map((morph) => [morph.start, morph.end]);
    expect(windows).toEqual([
      [48, 84],
      [84, 120],
    ]);
    expect(chained.morphs[0].fallStart).toBe(84);
    expect(chained.morphs[0].highlightEnd).toBe(98);
    expect(chained.settled).toBe(150);
    const unsorted: CodeMorphStep[] = [
      { at: 90, code: "c" },
      { at: 0, code: "a" },
      { at: 30, code: "b" },
    ];
    const sorted = getCodeMorphTimeline({ steps: unsorted });
    expect(sorted.steps).toEqual([0, 30, 90]);
    expect(sorted.morphs.map((morph) => morph.start)).toEqual([30, 90]);
    const lone: CodeMorphStep[] = [{ at: 10, code: "a" }];
    const single = getCodeMorphTimeline({ steps: lone });
    expect(single.morphs).toEqual([]);
    expect(single.settled).toBe(0);
    expect(getCodeMorphDuration({ steps: lone })).toBe(24);
  });

  it("maps frames through speed and frame rate", () => {
    expect(getCodeMorphTime(10)).toBe(10);
    expect(getCodeMorphTime(10, { fps: 60 })).toBe(5);
    expect(getCodeMorphTime(10, { speed: 2 })).toBe(20);
    expect(getCodeMorphTime(10, { speed: 0 })).toBe(0);
    expect(getCodeMorphTime(-4)).toBe(0);
    expect(getCodeMorphTime(Number.NaN)).toBe(0);
  });
});

describe("code morph tokenizer", () => {
  it("splits a line into colored tokens on the column grid", () => {
    const tokens = tokenizeCodeMorph(
      '  const total = sum(items, "usd") + 42; // cents',
    );
    const summary = tokens.map((token) => [token.text, token.kind, token.col]);
    expect(summary).toEqual([
      ["const", "keyword", 0],
      ["total", "text", 6],
      ["=", "punct", 12],
      ["sum", "function", 14],
      ["(", "punct", 17],
      ["items", "text", 18],
      [",", "punct", 23],
      ['"usd"', "string", 25],
      [")", "punct", 30],
      ["+", "punct", 32],
      ["42", "number", 34],
      [";", "punct", 36],
      ["// cents", "comment", 38],
    ]);
    expect(tokens.every((token) => token.line === 0)).toBe(true);
    expect(tokens.filter((token) => token.word)).toHaveLength(7);
  });

  it("keeps JSX, members and operators apart", () => {
    const jsx = tokenizeCodeMorph("return <InvoiceTable rows={data} />;");
    expect(jsx.map((token) => token.text)).toEqual([
      "return",
      "<",
      "InvoiceTable",
      "rows",
      "=",
      "{",
      "data",
      "}",
      "/>",
      ";",
    ]);
    expect(jsx[2].kind).toBe("type");
    const chain = tokenizeCodeMorph("res?.json().finally(done) ?? 0x1f;");
    expect(chain.map((token) => token.text)).toEqual([
      "res",
      "?.",
      "json",
      "(",
      ")",
      ".",
      "finally",
      "(",
      "done",
      ")",
      "??",
      "0x1f",
      ";",
    ]);
    expect(chain[6].kind).toBe("function");
    expect(chain[11].kind).toBe("number");
  });

  it("normalizes indentation, tabs and blank edges", () => {
    const code = "\n\n    const a = 1;\r\n\t  return a;   \n\n";
    expect(normalizeCodeMorphCode(code)).toBe("const a = 1;\nreturn a;");
    const tokens = tokenizeCodeMorph("\tif (ready) {\n\t\tstart();\n\t}");
    const grid = tokens.map((token) => [token.text, token.line, token.col]);
    expect(grid).toEqual([
      ["if", 0, 0],
      ["(", 0, 3],
      ["ready", 0, 4],
      [")", 0, 9],
      ["{", 0, 11],
      ["start", 1, 2],
      ["(", 1, 7],
      [")", 1, 8],
      [";", 1, 9],
      ["}", 2, 0],
    ]);
  });

  it("carries comments and template strings across lines", () => {
    const tokens = tokenizeCodeMorph(
      "const note = `line one\nline two`; /* keep\nthis */ done();",
    );
    const kinds = tokens.map((token) => [token.text, token.kind, token.line]);
    expect(kinds).toEqual([
      ["const", "keyword", 0],
      ["note", "text", 0],
      ["=", "punct", 0],
      ["`line one", "string", 0],
      ["line two`", "string", 1],
      [";", "punct", 1],
      ["/* keep", "comment", 1],
      ["this */", "comment", 2],
      ["done", "function", 2],
      ["(", "punct", 2],
      [")", "punct", 2],
      [";", "punct", 2],
    ]);
  });

  it("counts columns in code points", () => {
    const tokens = tokenizeCodeMorph('const label = "\u{1f680} ship"; go();');
    const columns = tokens.map((token) => token.col);
    expect(columns).toEqual([0, 6, 12, 14, 22, 24, 26, 27, 28]);
  });
});

describe("code morph diff", () => {
  const layout = getCodeMorphLayout();
  const [from, to] = layout.versions;
  const { diff, changed } = layout.morphs[0];

  it("pairs identical code one to one in place", () => {
    const tokens = tokenizeCodeMorph(codeMorphDefaults.steps[0].code);
    const same = diffCodeMorphTokens(tokens, tokens);
    expect(same.fromTo).toEqual(tokens.map((_, index) => index));
    expect(same.toFrom).toEqual(tokens.map((_, index) => index));
    const empty = diffCodeMorphTokens([], tokens);
    expect(empty.toFrom.every((index) => index === -1)).toBe(true);
  });

  it("returns inverse maps between identical tokens", () => {
    let pairs = 0;
    for (const [i, j] of diff.fromTo.entries()) {
      if (j < 0) continue;
      pairs += 1;
      expect(diff.toFrom[j]).toBe(i);
      expect(to.tokens[j].text).toBe(from.tokens[i].text);
    }
    for (const [j, i] of diff.toFrom.entries()) {
      if (i >= 0) expect(diff.fromTo[i]).toBe(j);
    }
    expect(from.tokens).toHaveLength(106);
    expect(to.tokens).toHaveLength(45);
    expect(pairs).toBe(33);
    const paired = diff.toFrom.filter((i) => i >= 0);
    expect(paired).toEqual([...paired].sort((a, b) => a - b));
  });

  it("lifts the endpoint out of fetch and into the hook", () => {
    const j = to.tokens.findIndex((token) => token.text === '"/api/invoices"');
    expect(spot(from.tokens[diff.toFrom[j]])).toEqual([7, 10]);
    expect(spot(to.tokens[j])).toEqual([3, 37]);
    const brace = from.tokens[diff.toFrom[to.tokens.length - 1]];
    expect(brace.text).toBe("}");
    expect(spot(brace)).toEqual([15, 0]);
    const signature = to.tokens.filter((token) => token.line === 2);
    expect(signature).toHaveLength(6);
    for (const token of signature) {
      const i = diff.toFrom[to.tokens.indexOf(token)];
      expect(i).toBeGreaterThanOrEqual(0);
      expect(spot(from.tokens[i])).toEqual([2, token.col]);
    }
  });

  it("adds and removes only what the refactor changed", () => {
    const added = to.tokens
      .filter((_, j) => diff.toFrom[j] < 0)
      .map((token) => token.text);
    expect(added).toEqual([
      "useSWR",
      '"swr"',
      "{",
      "data",
      "isLoading",
      "}",
      "useSWR",
      ",",
      "fetcher",
      ";",
      "isLoading",
      "data",
    ]);
    expect(changed).toEqual([0, 3, 5, 6]);
  });

  it("never lets punctuation fly away from its line's words", () => {
    const shifts = (word: boolean) => {
      const out = new Set<number>();
      for (const [j, i] of diff.toFrom.entries()) {
        if (i >= 0 && to.tokens[j].word === word) {
          out.add(to.tokens[j].line - from.tokens[i].line);
        }
      }
      return out;
    };
    const words = shifts(true);
    for (const shift of shifts(false)) expect(words.has(shift)).toBe(true);
  });

  it("keeps trailing brackets on the line end and closers with openers", () => {
    const grown = getCodeMorphLayout({ steps: VITE });
    const [first, second, third] = grown.versions;
    const [growth, server] = grown.morphs;
    const bracket = second.tokens.findIndex((token) => token.text === "]");
    expect(spot(first.tokens[growth.diff.toFrom[bracket]])).toEqual([1, 19]);
    expect(spot(second.tokens[bracket])).toEqual([3, 34]);
    const brace = third.tokens.length - 3;
    expect(third.tokens[brace].text).toBe("}");
    expect(spot(second.tokens[server.diff.toFrom[brace]])).toEqual([4, 0]);
    expect(spot(third.tokens[brace])).toEqual([5, 0]);
    expect(growth.changed).toEqual([0, 3]);
    expect(server.changed).toEqual([4]);
  });

  it("lets swapped lines travel past each other", () => {
    const swap = getCodeMorphLayout({ steps: SWAP });
    const [a, b] = swap.versions;
    const { toFrom } = swap.morphs[0].diff;
    expect(toFrom.every((i) => i >= 0)).toBe(true);
    const moves = b.tokens.map((token, j) => {
      const source = a.tokens[toFrom[j]];
      return `${source.line}>${token.line}`;
    });
    expect(moves.filter((move) => move === "1>0")).toHaveLength(8);
    expect(moves.filter((move) => move === "0>1")).toHaveLength(8);
    expect(swap.morphs[0].changed).toEqual([]);
  });
});

describe("code morph signature motion", () => {
  const layout = getCodeMorphLayout();
  const [from, to] = layout.versions;
  const { diff } = layout.morphs[0];
  const morphFrames = frames(48, 83.75, 0.25);

  it("starts from the old version at rest", () => {
    const rest = getCodeMorphState(47);
    const start = getCodeMorphState(48);
    expect(rest.morphing).toBe(false);
    expect(start.morphing).toBe(true);
    expect(placed(start.tokens)).toEqual(placed(rest.tokens));
    for (const token of start.tokens) {
      expect([token.opacity, token.scale, token.blur]).toEqual([1, 1, 0]);
    }
  });

  it("lands exactly on the new version at rest", () => {
    const end = getCodeMorphState(83.9);
    const rest = getCodeMorphState(84);
    expect(end.morphing).toBe(true);
    expect(rest.morphing).toBe(false);
    expect(rest.version).toBe(1);
    expect(placed(end.tokens)).toEqual(placed(rest.tokens));
    expect(keysOf(end.tokens)).toEqual(keysOf(rest.tokens));
    for (const token of end.tokens) {
      expect(token.opacity).toBeGreaterThan(0.9999);
    }
  });

  it("renders every surviving token as exactly one element", () => {
    for (const frame of morphFrames) {
      const { tokens } = getCodeMorphState(frame);
      const keys = tokens.map((token) => token.key);
      expect(new Set(keys).size).toBe(keys.length);
      const moving = tokens.filter((token) => token.role === "move");
      const staying = tokens.filter((token) => token.role === "stay");
      expect(moving).toHaveLength(25);
      expect(staying).toHaveLength(8);
    }
  });

  it("holds unchanged code perfectly still", () => {
    for (const frame of morphFrames) {
      for (const token of getCodeMorphState(frame, {}, layout).tokens) {
        if (token.role !== "stay") continue;
        const target = to.tokens[indexOf(token)];
        expect([token.line, token.col]).toEqual(spot(target));
      }
    }
  });

  it("carries the endpoint on an arc that rises before it slides", () => {
    const path = frames(48, 84).map((frame) => {
      const { tokens } = getCodeMorphState(frame);
      const token = tokens.find((item) => item.text === '"/api/invoices"');
      return token ? [token.line, token.col] : [Number.NaN, Number.NaN];
    });
    expect(path[0]).toEqual([7, 10]);
    expect(path[path.length - 1]).toEqual([3, 37]);
    for (let i = 1; i < path.length; i++) {
      expect(path[i][0]).toBeLessThanOrEqual(path[i - 1][0]);
      expect(path[i][1]).toBeGreaterThanOrEqual(path[i - 1][1]);
      expect(path[i][0]).toBeGreaterThanOrEqual(3);
      expect(path[i][1]).toBeLessThanOrEqual(37);
    }
    const [line, col] = path[16];
    expect((7 - line) / 4).toBeGreaterThan((col - 10) / 27 + 0.2);
  });

  it("moves tokens that share a line and an offset as one block", () => {
    let blocks = 0;
    for (const frame of morphFrames) {
      const offsets = new Map<string, string>();
      for (const token of getCodeMorphState(frame, {}, layout).tokens) {
        if (token.role !== "move") continue;
        const j = indexOf(token);
        const source = from.tokens[diff.toFrom[j]];
        const target = to.tokens[j];
        const dLine = target.line - source.line;
        const dCol = target.col - source.col;
        const block = `${source.line}|${dLine}|${dCol}`;
        const line = (token.line - source.line).toFixed(9);
        const col = (token.col - source.col).toFixed(9);
        const seen = offsets.get(block);
        if (seen === undefined) offsets.set(block, `${line}|${col}`);
        else expect(`${line}|${col}`).toBe(seen);
      }
      blocks = Math.max(blocks, offsets.size);
    }
    expect(blocks).toBe(11);
  });

  it("clears removed code first and fades new code in last", () => {
    const at = (frame: number) => getCodeMorphState(frame).tokens;
    const has = (frame: number, role: string) =>
      at(frame).some((token) => token.role === role);
    for (const token of at(54)) {
      expect(Number.isInteger(token.line)).toBe(true);
      expect(Number.isInteger(token.col)).toBe(true);
    }
    expect(has(63.75, "exit")).toBe(true);
    expect(has(64, "exit")).toBe(false);
    expect(has(68, "enter")).toBe(false);
    expect(has(68.25, "enter")).toBe(true);
    const exits = new Map<string, CodeMorphRenderToken>();
    const enters = new Map<string, CodeMorphRenderToken>();
    for (const frame of morphFrames) {
      for (const token of at(frame)) {
        if (token.role === "exit") {
          const last = exits.get(token.key);
          expect(token.scale).toBeGreaterThanOrEqual(0.92);
          expect(token.scale).toBeLessThanOrEqual(1);
          expect(token.blur).toBeLessThanOrEqual(3.5);
          if (last) {
            expect(token.opacity).toBeLessThanOrEqual(last.opacity);
            expect(token.blur).toBeGreaterThanOrEqual(last.blur);
          }
          exits.set(token.key, token);
        }
        if (token.role === "enter") {
          const last = enters.get(token.key);
          expect(token.scale).toBeGreaterThanOrEqual(0.96);
          expect(token.scale).toBeLessThanOrEqual(1);
          if (last) {
            expect(token.opacity).toBeGreaterThanOrEqual(last.opacity);
            expect(token.blur).toBeLessThanOrEqual(last.blur);
          }
          enters.set(token.key, token);
        }
      }
    }
    expect(exits.size).toBe(73);
    expect(enters.size).toBe(12);
  });

  it("fades surplus line numbers behind the slowest line", () => {
    expect(getCodeMorphState(58).lines).toBe(16);
    expect(getCodeMorphState(84).lines).toBe(8);
    let previous = 16;
    for (const frame of morphFrames) {
      const state = getCodeMorphState(frame);
      expect(state.lines).toBeLessThanOrEqual(previous);
      previous = state.lines;
      for (const token of state.tokens) {
        if (token.role === "exit") continue;
        expect(token.line + 1).toBeLessThanOrEqual(state.lines + 1e-9);
      }
    }
    const middle = getCodeMorphState(70);
    const rows = middle.lineNumbers.map((row) => row.opacity);
    expect(rows).toHaveLength(16);
    expect(rows.slice(0, 8).every((opacity) => opacity === 1)).toBe(true);
    const faded = 1 - (16 - middle.lines) / 8;
    for (const opacity of rows.slice(8)) expect(opacity).toBeCloseTo(faded, 9);
  });

  it("numbers new lines ahead of code that moves down", () => {
    const grown = getCodeMorphLayout({ steps: VITE });
    expect(grown.versions.map((version) => version.lines)).toEqual([3, 5, 6]);
    expect(grown.rows).toBe(6);
    for (const frame of frames(0, 200, 0.5)) {
      const state = getCodeMorphState(frame, { steps: VITE }, grown);
      for (const token of state.tokens) {
        if (token.role === "exit") continue;
        expect(token.line + 1).toBeLessThanOrEqual(state.lines + 1e-9);
      }
    }
    expect(getCodeMorphState(200, { steps: VITE }, grown).version).toBe(2);
  });

  it("holds a brief accent band on the changed lines", () => {
    const rows = (frame: number, highlight = true) =>
      getCodeMorphState(frame, { highlight }).highlights;
    expect(rows(68)).toEqual([]);
    expect(rows(80).map((band) => band.row)).toEqual([0, 3, 5, 6]);
    for (const frame of [76, 84, 100]) {
      expect(rows(frame).every((band) => band.opacity === 1)).toBe(true);
    }
    expect(rows(72)[0].opacity).toBeGreaterThan(rows(70)[0].opacity);
    expect(rows(108)[0].opacity).toBeLessThan(rows(104)[0].opacity);
    expect(rows(114)).toEqual([]);
    expect(rows(80, false)).toEqual([]);
  });
});

describe("code morph determinism", () => {
  it("renders any frame identically in any sampling order", () => {
    const sample = (frame: number) => getCodeMorphState(frame, { steps: VITE });
    const list = [0, 47, 52.5, 66, 81, 118, 150, 199];
    const forward = list.map(sample);
    const backward = [...list].reverse().map(sample).reverse();
    expect(backward).toEqual(forward);
    expect(sample(66)).toEqual(forward[3]);
    const again = getCodeMorphLayout({ steps: VITE });
    expect(again).toEqual(getCodeMorphLayout({ steps: VITE }));
  });

  it("maps other frame rates and speeds onto the 30 fps timeline", () => {
    const base = getCodeMorphState(60).tokens;
    expect(getCodeMorphState(120, { fps: 60 }).tokens).toEqual(base);
    expect(getCodeMorphState(120, { speed: 0.5 }).tokens).toEqual(base);
    const frozen = getCodeMorphState(500, { speed: 0 });
    expect(frozen.version).toBe(0);
    expect(frozen.tokens).toEqual(getCodeMorphState(0).tokens);
  });
});

describe("code morph layout", () => {
  it("sizes the default panel in reference pixels at 720p", () => {
    const layout = getCodeMorphLayout();
    expect(layout.unit).toBe(1);
    expect(layout.fit).toBe(1);
    expect(layout.fontSize).toBe(20);
    expect(layout.lineHeight).toBe(31);
    expect(layout.header).toBe(42);
    expect([layout.rows, layout.columns]).toEqual([16, 63]);
    expect([layout.digits, layout.gutter]).toEqual([2, 4]);
    expect(layout.versions.map((version) => version.lines)).toEqual([16, 8]);
    expect(layout.filename).toBe("invoices.tsx");
  });

  it("scales with the composition and fits narrow frames", () => {
    const full = getCodeMorphLayout({ width: 1920, height: 1080 });
    const tall = getCodeMorphLayout({ width: 1080, height: 1920 });
    const square = getCodeMorphLayout({ width: 1080, height: 1080 });
    expect(full.unit).toBe(1.5);
    expect(tall.unit).toBe(0.84375);
    expect(square.unit).toBe(0.84375);
    const code = `const url = "${"x".repeat(136)}";`;
    const long = getCodeMorphLayout({ steps: [{ at: 0, code }] });
    expect(long.fit).toBeLessThan(1);
    const estimate = 50 + (long.gutter + long.columns) * 0.6 * 20;
    expect(estimate * long.fit).toBeCloseTo(1152, 6);
  });

  it("drops the chrome and the gutter on request", () => {
    const bare = getCodeMorphLayout({
      lineNumbers: false,
      windowDots: false,
      filename: "  ",
    });
    expect([bare.header, bare.gutter, bare.digits]).toEqual([0, 0, 0]);
    expect(bare.filename).toBe("");
    const tab = getCodeMorphLayout({ windowDots: false });
    expect(tab.header).toBe(42);
  });
});

describe("code morph config", () => {
  it("matches the component defaults", () => {
    const controls = resolveControls("code-morph", codeMorphConfig.controls);
    expect(getDefaults(controls)).toEqual({
      filename: codeMorphDefaults.filename,
      theme: codeMorphDefaults.theme,
      accentColor: codeMorphDefaults.accentColor,
      morphDuration: codeMorphDefaults.morphDuration,
      fontSize: codeMorphDefaults.fontSize,
      highlight: codeMorphDefaults.highlight,
      lineNumbers: codeMorphDefaults.lineNumbers,
      windowDots: codeMorphDefaults.windowDots,
      speed: codeMorphDefaults.speed,
    });
    const theme = controls.theme;
    const options = theme.type === "select" ? theme.options : [];
    expect(options).toEqual(["dark", "light"]);
    const range = (key: string) => {
      const control = controls[key];
      return control.type === "number" ? [control.min, control.max] : [];
    };
    expect(range("morphDuration")).toEqual([12, 90]);
    expect(range("fontSize")).toEqual([12, 32]);
    expect(codeMorphConfig.previewBackdrop).toEqual({
      type: "color",
      value: "#f1eee7",
    });
  });
});
