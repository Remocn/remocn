"use client";

import { useMemo } from "react";
import { Easing, useCurrentFrame, useVideoConfig } from "remotion";

export type CodeMorphTheme = "dark" | "light";

export type CodeMorphKind =
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "function"
  | "type"
  | "text"
  | "punct";

export type CodeMorphRole = "rest" | "stay" | "move" | "exit" | "enter";

export interface CodeMorphStep {
  at: number;
  code: string;
}

export interface CodeMorphProps {
  steps?: CodeMorphStep[];
  morphDuration?: number;
  highlight?: boolean;
  fontSize?: number;
  lineNumbers?: boolean;
  filename?: string;
  windowDots?: boolean;
  theme?: CodeMorphTheme;
  accentColor?: string;
  speed?: number;
  className?: string;
}

type Paint = "theme" | "accentColor" | "className";

export interface CodeMorphOptions extends Omit<CodeMorphProps, Paint> {
  width?: number;
  height?: number;
  fps?: number;
}

export interface CodeMorphToken {
  text: string;
  kind: CodeMorphKind;
  line: number;
  col: number;
  word: boolean;
}

export interface CodeMorphDiff {
  fromTo: number[];
  toFrom: number[];
}

export interface CodeMorphRenderToken {
  key: string;
  text: string;
  kind: CodeMorphKind;
  role: CodeMorphRole;
  line: number;
  col: number;
  opacity: number;
  scale: number;
  blur: number;
}

export interface CodeMorphRow {
  key: string;
  row: number;
  opacity: number;
}

export interface CodeMorphState {
  time: number;
  version: number;
  morphing: boolean;
  progress: number;
  lines: number;
  tokens: CodeMorphRenderToken[];
  lineNumbers: CodeMorphRow[];
  highlights: CodeMorphRow[];
}

const BEFORE = `import { useEffect, useState } from "react";

export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  return <InvoiceTable rows={invoices} />;
}`;

const AFTER = `import useSWR from "swr";

export function Invoices() {
  const { data, isLoading } = useSWR("/api/invoices", fetcher);

  if (isLoading) return <Spinner />;
  return <InvoiceTable rows={data} />;
}`;

export const codeMorphDefaults: Required<Omit<CodeMorphProps, "className">> = {
  steps: [
    { at: 0, code: BEFORE },
    { at: 48, code: AFTER },
  ],
  morphDuration: 36,
  highlight: true,
  fontSize: 20,
  lineNumbers: true,
  filename: "invoices.tsx",
  windowDots: true,
  theme: "dark",
  accentColor: "#0ea5e9",
  speed: 1,
};

const FONT_MONO =
  "var(--font-geist-mono, ui-monospace), ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const REFERENCE_WIDTH = 1280;
const REFERENCE_HEIGHT = 720;
const MAX_WIDTH = 1152;
const MAX_HEIGHT = 640;
const ADVANCE = 0.6;
const LEADING = 1.55;
const HEADER = 42;
const PAD_TOP = 20;
const PAD_BOTTOM = 22;
const PAD_LEFT = 22;
const PAD_RIGHT = 28;
const GUTTER_GAP = 2;
const RADIUS = 14;
const DOT = 11;
const DOT_GAP = 7;
const DOT_LEFT = 16;
const DOTS = [0, 1, 2];
const TAB_OFFSET = 14;
const TAB_AFTER_DOTS = DOT_LEFT + 3 * DOT + 2 * DOT_GAP + TAB_OFFSET;
const TAB_LEFT = 10;
const TAB_TOP = 8;
const TAB_PAD = 14;
const TAB_RADIUS = 8;
const TAB_FONT = 13;
const BAR = 2;
const BLUR = 3.5;
const SHRINK = 0.08;
const GROW_FROM = 0.96;
const BASE = 36;
const EXIT_SPREAD = 4;
const EXIT_DURATION = 12;
const MOVE_START = 6;
const MOVE_DURATION = 22;
const CASCADE = 4;
const ENTER_START = 20;
const ENTER_SPREAD = 4;
const ENTER_DURATION = 12;
const ARC = 0.08;
const RISE = 8;
const SHOW = 24;
const FALL = 14;
const HOLD = 24;
const MIN_MORPH = 12;
const MAX_MORPH = 120;
const MIN_FONT = 10;
const MAX_FONT = 40;
const LINE_COST = 10;
const COLUMN_COST = 0.5;
const MAX_COST = 1000;
const PUNCT_VALUE = 12;
const TAB = "  ";

const KEYWORDS = new Set([
  "abstract",
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "debugger",
  "declare",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "keyof",
  "let",
  "namespace",
  "new",
  "null",
  "of",
  "private",
  "protected",
  "public",
  "readonly",
  "return",
  "satisfies",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "yield",
]);

const OPERATORS = [
  "===",
  "!==",
  "**=",
  "...",
  "&&=",
  "||=",
  "??=",
  "=>",
  "==",
  "!=",
  "<=",
  ">=",
  "&&",
  "||",
  "??",
  "?.",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "**",
  "</",
  "/>",
];

const NUMBER =
  /0[xXbBoO][\dA-Fa-f_]+n?|\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?n?/y;
const WORD =
  /[A-Za-z_$\u00c0-\u024f\u0370-\u03ff][\w$\u00c0-\u024f\u0370-\u03ff]*/y;
const SPACE = /\s/;
const CAPITAL = /^[A-Z]/;
const OPENERS = new Set(["(", "[", "{"]);
const CLOSERS = new Map([
  [")", "("],
  ["]", "["],
  ["}", "{"],
]);

const glide = Easing.bezier(0.6, 0, 0.2, 1);

interface CodeMorphPalette {
  panel: string;
  chrome: string;
  border: string;
  dot: string;
  label: string;
  gutter: string;
  keyword: string;
  function: string;
  type: string;
  text: string;
  punct: string;
  comment: string;
  mix: string;
  share: number;
  band: number;
}

const PALETTES: Record<CodeMorphTheme, CodeMorphPalette> = {
  dark: {
    panel: "#111113",
    chrome: "#0c0c0e",
    border: "#27272a",
    dot: "#3f3f46",
    label: "#e4e4e7",
    gutter: "#52525b",
    keyword: "#a1a1aa",
    function: "#fafafa",
    type: "#fafafa",
    text: "#d4d4d8",
    punct: "#71717a",
    comment: "#5b5b63",
    mix: "#ffffff",
    share: 80,
    band: 0.16,
  },
  light: {
    panel: "#ffffff",
    chrome: "#f7f7f8",
    border: "#e4e4e7",
    dot: "#d4d4d8",
    label: "#27272a",
    gutter: "#b4b4bb",
    keyword: "#71717a",
    function: "#09090b",
    type: "#09090b",
    text: "#3f3f46",
    punct: "#909098",
    comment: "#a1a1aa",
    mix: "#000000",
    share: 70,
    band: 0.12,
  },
};

type Open = "comment" | "string" | null;
type Lexeme = "comment" | "string" | "number" | "word" | "punct";
type Pair = [number, number];

interface Piece {
  start: number;
  end: number;
  lexeme: Lexeme;
}

interface Lexed {
  text: string;
  lexeme: Lexeme;
  line: number;
  col: number;
}

const finite = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const unit01 = (value: number) => clamp(value, 0, 1);
const easeOut = (value: number) => 1 - (1 - unit01(value)) ** 3;
const easeOutQuad = (value: number) => 1 - (1 - unit01(value)) ** 2;
const phase = (value: number, morph: number) => (value * morph) / BASE;
const range = (start: number, end: number) =>
  Array.from({ length: Math.max(0, end - start) }, (_, k) => start + k);

function smoothstep(value: number) {
  const t = unit01(value);
  return t * t * (3 - 2 * t);
}

export function normalizeCodeMorphCode(code: string) {
  const lines = code
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, TAB)
    .split("\n")
    .map((line) => line.trimEnd());
  let start = 0;
  while (start < lines.length && lines[start] === "") start += 1;
  let end = lines.length;
  while (end > start && lines[end - 1] === "") end -= 1;
  const body = lines.slice(start, end);
  const indents = body
    .filter((line) => line !== "")
    .map((line) => line.length - line.trimStart().length);
  const cut = indents.length > 0 ? Math.min(...indents) : 0;
  return body.map((line) => line.slice(cut)).join("\n");
}

function closing(line: string, from: number, quote: string) {
  let index = from;
  while (index < line.length) {
    const char = line[index];
    if (char === quote) return index;
    index += char === "\\" ? 2 : 1;
  }
  return -1;
}

function matchAt(pattern: RegExp, line: string, index: number) {
  pattern.lastIndex = index;
  const match = pattern.exec(line);
  return match ? match[0] : "";
}

function scanLine(line: string, open: Open): { pieces: Piece[]; open: Open } {
  const pieces: Piece[] = [];
  const emit = (start: number, end: number, lexeme: Lexeme) => {
    pieces.push({ start, end, lexeme });
    return end;
  };
  let index = 0;
  if (open !== null) {
    const comment = open === "comment";
    const end = comment ? line.indexOf("*/") : closing(line, 0, "`");
    if (end === -1) {
      emit(0, line.length, open);
      return { pieces, open };
    }
    index = emit(0, end + (comment ? 2 : 1), open);
  }
  while (index < line.length) {
    const char = line[index];
    if (SPACE.test(char)) {
      index += 1;
      continue;
    }
    if (line.startsWith("//", index)) {
      emit(index, line.length, "comment");
      break;
    }
    if (line.startsWith("/*", index)) {
      const end = line.indexOf("*/", index + 2);
      if (end === -1) {
        emit(index, line.length, "comment");
        return { pieces, open: "comment" };
      }
      index = emit(index, end + 2, "comment");
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      const end = closing(line, index + 1, char);
      if (end === -1 && char === "`") {
        emit(index, line.length, "string");
        return { pieces, open: "string" };
      }
      index = emit(index, end === -1 ? line.length : end + 1, "string");
      continue;
    }
    const number = matchAt(NUMBER, line, index);
    if (number !== "") {
      index = emit(index, index + number.length, "number");
      continue;
    }
    const word = matchAt(WORD, line, index);
    if (word !== "") {
      index = emit(index, index + word.length, "word");
      continue;
    }
    const operator = OPERATORS.find((item) => line.startsWith(item, index));
    const glyph = String.fromCodePoint(line.codePointAt(index) ?? 0);
    index = emit(index, index + (operator ?? glyph).length, "punct");
  }
  return { pieces, open: null };
}

function columnsOf(line: string) {
  const columns: number[] = [];
  let index = 0;
  let column = 0;
  for (const char of line) {
    for (let unit = 0; unit < char.length; unit += 1) {
      columns[index + unit] = column;
    }
    index += char.length;
    column += 1;
  }
  columns[index] = column;
  return columns;
}

function kindOf(lexed: Lexed[], index: number): CodeMorphKind {
  const { lexeme, text } = lexed[index];
  if (lexeme !== "word") return lexeme;
  const previous = index > 0 ? lexed[index - 1].text : "";
  const next = index + 1 < lexed.length ? lexed[index + 1].text : "";
  const member = previous === "." || previous === "?.";
  if (!member && KEYWORDS.has(text)) return "keyword";
  if (next === "(") return "function";
  if (CAPITAL.test(text)) return "type";
  return "text";
}

function versionOf(source: string) {
  const code = normalizeCodeMorphCode(source);
  const lines = code.split("\n");
  const lexed: Lexed[] = [];
  let open: Open = null;
  let columns = 0;
  for (const [line, text] of lines.entries()) {
    const map = columnsOf(text);
    columns = Math.max(columns, map[text.length]);
    const scanned = scanLine(text, open);
    open = scanned.open;
    for (const piece of scanned.pieces) {
      let start = piece.start;
      let end = piece.end;
      while (start < end && SPACE.test(text[start])) start += 1;
      while (end > start && SPACE.test(text[end - 1])) end -= 1;
      if (end === start) continue;
      const slice = text.slice(start, end);
      const col = map[start];
      lexed.push({ text: slice, lexeme: piece.lexeme, line, col });
    }
  }
  const tokens: CodeMorphToken[] = lexed.map((item, index) => {
    const kind = kindOf(lexed, index);
    const { text, line, col } = item;
    return { text, kind, line, col, word: kind !== "punct" };
  });
  return { code, tokens, lines: lines.length, columns };
}

type CodeMorphVersion = ReturnType<typeof versionOf>;

export function tokenizeCodeMorph(code: string) {
  return versionOf(code).tokens;
}

interface Sides {
  from: CodeMorphToken[];
  to: CodeMorphToken[];
  fromWidths: Map<number, number>;
  toWidths: Map<number, number>;
}

function widthsOf(tokens: CodeMorphToken[]) {
  const widths = new Map<number, number>();
  for (const token of tokens) {
    const end = token.col + Array.from(token.text).length;
    widths.set(token.line, Math.max(widths.get(token.line) ?? 0, end));
  }
  return widths;
}

interface Shift {
  line: number;
  lines: number;
  cols: number;
}

function shiftOf(sides: Sides, pair: Pair): Shift {
  const anchor = sides.from[pair[0]];
  const landed = sides.to[pair[1]];
  return {
    line: anchor.line,
    lines: landed.line - anchor.line,
    cols: landed.col - anchor.col,
  };
}

const STILL: Shift = { line: -1, lines: 0, cols: 0 };

function expectedCost(sides: Sides, i: number, j: number, shift: Shift) {
  const source = sides.from[i];
  const target = sides.to[j];
  const lineOff = Math.abs(target.line - (source.line + shift.lines));
  if (source.line !== shift.line) {
    const colOff = Math.abs(target.col - source.col);
    return lineOff * LINE_COST + colOff * COLUMN_COST;
  }
  const left = source.col + shift.cols;
  const tail = (sides.fromWidths.get(source.line) ?? 0) - source.col;
  const right = (sides.toWidths.get(target.line) ?? 0) - tail;
  const colOff = Math.min(
    Math.abs(target.col - left),
    Math.abs(target.col - right),
  );
  return lineOff * LINE_COST + colOff * COLUMN_COST;
}

function costOf(
  sides: Sides,
  i: number,
  j: number,
  before: Shift | null,
  after: Shift | null,
) {
  if (before === null && after === null) {
    return Math.min(MAX_COST, expectedCost(sides, i, j, STILL));
  }
  const via = (shift: Shift | null) =>
    shift === null ? MAX_COST : expectedCost(sides, i, j, shift);
  return Math.min(MAX_COST, via(before), via(after));
}

function align(
  sources: number[],
  targets: number[],
  value: (i: number, j: number) => number,
): Pair[] {
  const rows = sources.length;
  const cols = targets.length;
  if (rows === 0 || cols === 0) return [];
  const width = cols + 1;
  const worth = new Float64Array(rows * cols);
  for (let a = 0; a < rows; a += 1) {
    for (let b = 0; b < cols; b += 1) {
      worth[a * cols + b] = value(sources[a], targets[b]);
    }
  }
  const table = new Float64Array((rows + 1) * width);
  const at = (a: number, b: number) => table[a * width + b];
  for (let a = rows - 1; a >= 0; a -= 1) {
    for (let b = cols - 1; b >= 0; b -= 1) {
      const gain = worth[a * cols + b];
      const skip = Math.max(at(a + 1, b), at(a, b + 1));
      const take = gain > 0 ? at(a + 1, b + 1) + gain : 0;
      table[a * width + b] = Math.max(skip, take);
    }
  }
  const pairs: Pair[] = [];
  let p = 0;
  let q = 0;
  while (p < rows && q < cols) {
    const gain = worth[p * cols + q];
    if (gain > 0 && at(p, q) === at(p + 1, q + 1) + gain) {
      pairs.push([sources[p], targets[q]]);
      p += 1;
      q += 1;
    } else if (at(p, q) === at(p + 1, q)) {
      p += 1;
    } else {
      q += 1;
    }
  }
  return pairs;
}

function increasing(candidates: Pair[]): Pair[] {
  const length: number[] = [];
  const previous: number[] = [];
  let best = -1;
  for (const [k, [, j]] of candidates.entries()) {
    length[k] = 1;
    previous[k] = -1;
    for (let p = 0; p < k; p += 1) {
      if (candidates[p][1] < j && length[p] + 1 > length[k]) {
        length[k] = length[p] + 1;
        previous[k] = p;
      }
    }
    if (best === -1 || length[k] > length[best]) best = k;
  }
  const chain: Pair[] = [];
  for (let k = best; k !== -1; k = previous[k]) chain.push(candidates[k]);
  return chain.reverse();
}

function anchorsOf(from: CodeMorphToken[], to: CodeMorphToken[]) {
  const fromCount = new Map<string, number>();
  const toCount = new Map<string, number>();
  const toIndex = new Map<string, number>();
  for (const token of from) {
    if (token.word) {
      fromCount.set(token.text, (fromCount.get(token.text) ?? 0) + 1);
    }
  }
  for (const [j, token] of to.entries()) {
    if (!token.word) continue;
    toCount.set(token.text, (toCount.get(token.text) ?? 0) + 1);
    toIndex.set(token.text, j);
  }
  const candidates: Pair[] = [];
  for (const [i, token] of from.entries()) {
    const j = toIndex.get(token.text);
    const unique =
      fromCount.get(token.text) === 1 && toCount.get(token.text) === 1;
    if (token.word && unique && j !== undefined) candidates.push([i, j]);
  }
  return increasing(candidates);
}

function guidesOf(sides: Sides, pairs: Pair[]) {
  const size = sides.from.length;
  const before: (Shift | null)[] = [];
  const after: (Shift | null)[] = [];
  let last: Shift | null = null;
  let cursor = 0;
  for (let i = 0; i < size; i += 1) {
    while (cursor < pairs.length && pairs[cursor][0] <= i) {
      last = shiftOf(sides, pairs[cursor]);
      cursor += 1;
    }
    before.push(last);
  }
  let next: Shift | null = null;
  cursor = pairs.length - 1;
  for (let i = size - 1; i >= 0; i -= 1) {
    while (cursor >= 0 && pairs[cursor][0] >= i) {
      next = shiftOf(sides, pairs[cursor]);
      cursor -= 1;
    }
    after[i] = next;
  }
  return { before, after };
}

function partnersOf(tokens: CodeMorphToken[]) {
  const partner = tokens.map(() => -1);
  const stack: number[] = [];
  for (const [index, token] of tokens.entries()) {
    if (token.kind !== "punct") continue;
    if (OPENERS.has(token.text)) {
      stack.push(index);
      continue;
    }
    const opener = CLOSERS.get(token.text);
    if (opener === undefined) continue;
    let depth = stack.length - 1;
    while (depth >= 0 && tokens[stack[depth]].text !== opener) depth -= 1;
    if (depth < 0) continue;
    partner[stack[depth]] = index;
    partner[index] = stack[depth];
    stack.length = depth;
  }
  return partner;
}

function linesOf(tokens: CodeMorphToken[]) {
  const lines = new Map<number, number[]>();
  for (const [index, token] of tokens.entries()) {
    const list = lines.get(token.line);
    if (list) list.push(index);
    else lines.set(token.line, [index]);
  }
  return lines;
}

function signatureOf(tokens: CodeMorphToken[], indices: number[]) {
  const base = tokens[indices[0]].col;
  const shape = indices.map((i) => [tokens[i].col - base, tokens[i].text]);
  return JSON.stringify(shape);
}

export function diffCodeMorphTokens(
  from: CodeMorphToken[],
  to: CodeMorphToken[],
): CodeMorphDiff {
  const sides: Sides = {
    from,
    to,
    fromWidths: widthsOf(from),
    toWidths: widthsOf(to),
  };
  const guides = guidesOf(sides, anchorsOf(from, to));
  const fromWords = range(0, from.length).filter((i) => from[i].word);
  const toWords = range(0, to.length).filter((j) => to[j].word);
  const weight = (Math.min(fromWords.length, toWords.length) + 1) * MAX_COST;
  const words = align(fromWords, toWords, (i, j) => {
    if (from[i].text !== to[j].text) return 0;
    return weight - costOf(sides, i, j, guides.before[i], guides.after[i]);
  });
  const fromTo = from.map(() => -1);
  const toFrom = to.map(() => -1);
  const link = ([i, j]: Pair) => {
    fromTo[i] = j;
    toFrom[j] = i;
  };
  const bounds: Pair[] = [[-1, -1], ...words, [from.length, to.length]];
  for (let k = 0; k + 1 < bounds.length; k += 1) {
    const [a0, b0] = bounds[k];
    const [a1, b1] = bounds[k + 1];
    const inner = k + 2 < bounds.length;
    const before = k > 0 ? shiftOf(sides, bounds[k]) : null;
    const after = inner ? shiftOf(sides, bounds[k + 1]) : null;
    const sources = range(a0 + 1, a1).filter((i) => !from[i].word);
    const targets = range(b0 + 1, b1).filter((j) => !to[j].word);
    const found = align(sources, targets, (i, j) => {
      if (from[i].text !== to[j].text) return 0;
      return PUNCT_VALUE - costOf(sides, i, j, before, after);
    });
    for (const pair of found) link(pair);
    if (inner) link(bounds[k + 1]);
  }
  const fromPartner = partnersOf(from);
  const toPartner = partnersOf(to);
  for (const [i, token] of from.entries()) {
    const j = fromTo[i];
    if (j < 0 || !OPENERS.has(token.text)) continue;
    const close = fromPartner[i];
    const target = toPartner[j];
    if (close < 0 || target < 0 || fromTo[close] === target) continue;
    if (fromTo[close] >= 0) toFrom[fromTo[close]] = -1;
    if (toFrom[target] >= 0) fromTo[toFrom[target]] = -1;
    link([close, target]);
  }
  const fromLines = linesOf(from);
  const pool = new Map<string, number[]>();
  for (const [line, indices] of fromLines) {
    const removed = indices.every((i) => fromTo[i] < 0);
    if (!removed || !indices.some((i) => from[i].word)) continue;
    const key = signatureOf(from, indices);
    const list = pool.get(key);
    if (list) list.push(line);
    else pool.set(key, [line]);
  }
  for (const [line, indices] of linesOf(to)) {
    if (!indices.every((j) => toFrom[j] < 0)) continue;
    const list = pool.get(signatureOf(to, indices));
    if (list === undefined || list.length === 0) continue;
    let best = 0;
    for (const [k, candidate] of list.entries()) {
      if (Math.abs(candidate - line) < Math.abs(list[best] - line)) best = k;
    }
    const [source] = list.splice(best, 1);
    const origin = fromLines.get(source) ?? [];
    for (const [k, j] of indices.entries()) link([origin[k], j]);
  }
  return { fromTo, toFrom };
}

function ranks(lines: number[]) {
  const distinct = Array.from(new Set(lines)).sort((a, b) => a - b);
  const map = new Map<number, number>();
  const last = distinct.length - 1;
  for (const [index, line] of distinct.entries()) {
    map.set(line, last > 0 ? index / last : 0);
  }
  return map;
}

function changedLines(
  from: CodeMorphVersion,
  to: CodeMorphVersion,
  diff: CodeMorphDiff,
) {
  const sizes = new Map<number, number>();
  for (const token of from.tokens) {
    sizes.set(token.line, (sizes.get(token.line) ?? 0) + 1);
  }
  const members = new Map<number, number[]>();
  for (const [j, token] of to.tokens.entries()) {
    const list = members.get(token.line);
    if (list) list.push(j);
    else members.set(token.line, [j]);
  }
  const changed: number[] = [];
  for (const [line, indices] of members) {
    const sources = indices.map((j) => diff.toFrom[j]);
    const origin = sources[0] >= 0 ? from.tokens[sources[0]].line : -1;
    const inLine = (i: number) => i >= 0 && from.tokens[i].line === origin;
    const copied = sources.every(inLine);
    if (!(copied && sizes.get(origin) === indices.length)) changed.push(line);
  }
  return changed.sort((a, b) => a - b);
}

function morphOf(from: CodeMorphVersion, to: CodeMorphVersion) {
  const diff = diffCodeMorphTokens(from.tokens, to.tokens);
  const leaving: number[] = [];
  const moving: number[] = [];
  const entering: number[] = [];
  for (const [i, token] of from.tokens.entries()) {
    if (diff.fromTo[i] < 0) leaving.push(token.line);
  }
  for (const [j, token] of to.tokens.entries()) {
    const i = diff.toFrom[j];
    if (i < 0) {
      entering.push(token.line);
      continue;
    }
    const source = from.tokens[i];
    if (source.line !== token.line || source.col !== token.col) {
      moving.push(token.line);
    }
  }
  return {
    diff,
    exitRank: ranks(leaving),
    moveRank: ranks(moving),
    enterRank: ranks(entering),
    changed: changedLines(from, to, diff),
  };
}

function stepsOf(steps: CodeMorphStep[] | undefined) {
  const source = Array.isArray(steps) ? steps : codeMorphDefaults.steps;
  const ordered = source
    .map((step, index) => ({
      index,
      at: Math.max(0, finite(step.at, 0)),
      code: typeof step.code === "string" ? step.code : "",
    }))
    .sort((a, b) => a.at - b.at || a.index - b.index);
  return ordered.length > 0 ? ordered : [{ index: 0, at: 0, code: "" }];
}

export function getCodeMorphLayout(options: CodeMorphOptions = {}) {
  const width = Math.max(1, finite(options.width, REFERENCE_WIDTH));
  const height = Math.max(1, finite(options.height, REFERENCE_HEIGHT));
  const requested = finite(options.fontSize, codeMorphDefaults.fontSize);
  const size = clamp(requested, MIN_FONT, MAX_FONT);
  const lineNumbers = options.lineNumbers !== false;
  const windowDots = options.windowDots !== false;
  const filename = (options.filename ?? codeMorphDefaults.filename).trim();
  const versions = stepsOf(options.steps).map((step) => versionOf(step.code));
  const morphs: ReturnType<typeof morphOf>[] = [];
  for (let index = 1; index < versions.length; index += 1) {
    morphs.push(morphOf(versions[index - 1], versions[index]));
  }
  const rows = Math.max(...versions.map((version) => version.lines));
  const columns = Math.max(...versions.map((version) => version.columns));
  const digits = lineNumbers ? Math.max(2, String(rows).length) : 0;
  const gutter = lineNumbers ? digits + GUTTER_GAP : 0;
  const header = windowDots || filename !== "" ? HEADER : 0;
  const leading = size * LEADING;
  const panelWidth = PAD_LEFT + PAD_RIGHT + (gutter + columns) * ADVANCE * size;
  const panelHeight = header + PAD_TOP + PAD_BOTTOM + rows * leading;
  const fit = Math.min(1, MAX_WIDTH / panelWidth, MAX_HEIGHT / panelHeight);
  const scale = Math.min(width / REFERENCE_WIDTH, height / REFERENCE_HEIGHT);
  const unit = scale * fit;
  return {
    width,
    height,
    unit,
    fit,
    fontSize: size * unit,
    lineHeight: leading * unit,
    header: header * unit,
    padTop: PAD_TOP * unit,
    padBottom: PAD_BOTTOM * unit,
    padLeft: PAD_LEFT * unit,
    padRight: PAD_RIGHT * unit,
    rows,
    columns,
    digits,
    gutter,
    lineNumbers,
    windowDots,
    filename,
    versions,
    morphs,
  };
}

export type CodeMorphLayout = ReturnType<typeof getCodeMorphLayout>;

export function getCodeMorphTimeline(options: CodeMorphOptions = {}) {
  const requested = finite(
    options.morphDuration,
    codeMorphDefaults.morphDuration,
  );
  const morph = clamp(requested, MIN_MORPH, MAX_MORPH);
  const highlight = options.highlight !== false;
  const steps = stepsOf(options.steps).map((step) => step.at);
  const starts: number[] = [];
  let ready = 0;
  for (const at of steps.slice(1)) {
    const start = Math.max(at, ready);
    starts.push(start);
    ready = start + morph;
  }
  const morphs = starts.map((start, index) => {
    const highlightStart = start + phase(ENTER_START, morph);
    const natural = highlightStart + RISE + SHOW;
    const next = index + 1 < starts.length ? starts[index + 1] : natural;
    const fallStart = Math.min(natural, next);
    return {
      from: index,
      to: index + 1,
      start,
      end: start + morph,
      highlightStart,
      fallStart,
      highlightEnd: fallStart + FALL,
    };
  });
  let settled = 0;
  if (morphs.length > 0) {
    const last = morphs[morphs.length - 1];
    settled = highlight ? Math.max(last.end, last.highlightEnd) : last.end;
  }
  return { morph, highlight, steps, morphs, settled, duration: settled + HOLD };
}

export type CodeMorphTimeline = ReturnType<typeof getCodeMorphTimeline>;

export const codeMorphLength = getCodeMorphTimeline().settled;

export function getCodeMorphDuration(options: CodeMorphOptions = {}) {
  const speed = Math.max(0, finite(options.speed, codeMorphDefaults.speed));
  if (speed === 0) return 1;
  const { duration } = getCodeMorphTimeline(options);
  return Math.max(1, Math.ceil(duration / speed));
}

export function getCodeMorphTime(
  frame: number,
  options: CodeMorphOptions = {},
) {
  const fps = Math.max(1, finite(options.fps, 30));
  const speed = Math.max(0, finite(options.speed, codeMorphDefaults.speed));
  return Math.max(0, finite(frame, 0)) * (30 / fps) * speed;
}

function rowsOf(count: number, opacity: (row: number) => number) {
  return Array.from({ length: count }, (_, row) => ({
    key: `${row}`,
    row,
    opacity: opacity(row),
  }));
}

function restingTokens(layout: CodeMorphLayout, version: number) {
  const { tokens } = layout.versions[version];
  return tokens.map((token, j): CodeMorphRenderToken => ({
    key: `${version}:${j}`,
    text: token.text,
    kind: token.kind,
    role: "rest",
    line: token.line,
    col: token.col,
    opacity: 1,
    scale: 1,
    blur: 0,
  }));
}

function morphFrame(
  layout: CodeMorphLayout,
  index: number,
  local: number,
  morph: number,
) {
  const data = layout.morphs[index];
  const from = layout.versions[index];
  const to = layout.versions[index + 1];
  const blur = BLUR * layout.unit;
  const tokens: CodeMorphRenderToken[] = [];
  for (const [i, token] of from.tokens.entries()) {
    if (data.diff.fromTo[i] >= 0) continue;
    const rank = data.exitRank.get(token.line) ?? 0;
    const delay = phase(EXIT_SPREAD, morph) * rank;
    const progress = (local - delay) / phase(EXIT_DURATION, morph);
    if (progress >= 1) continue;
    const eased = easeOut(progress);
    tokens.push({
      key: `${index}>${i}`,
      text: token.text,
      kind: token.kind,
      role: "exit",
      line: token.line,
      col: token.col,
      opacity: 1 - eased,
      scale: 1 - SHRINK * eased,
      blur: blur * eased,
    });
  }
  const travel = (delay: number) =>
    (local - phase(MOVE_START, morph) - delay) / phase(MOVE_DURATION, morph);
  for (const [j, token] of to.tokens.entries()) {
    const i = data.diff.toFrom[j];
    if (i < 0) continue;
    const source = from.tokens[i];
    const still = source.line === token.line && source.col === token.col;
    const rank = data.moveRank.get(token.line) ?? 0;
    const progress = travel(phase(CASCADE, morph) * rank);
    const vertical = glide(unit01(progress / (1 - ARC)));
    const horizontal = glide(unit01((progress - ARC) / (1 - ARC)));
    tokens.push({
      key: `${index + 1}:${j}`,
      text: token.text,
      kind: token.kind,
      role: still ? "stay" : "move",
      line: source.line + (token.line - source.line) * vertical,
      col: source.col + (token.col - source.col) * horizontal,
      opacity: 1,
      scale: 1,
      blur: 0,
    });
  }
  for (const [j, token] of to.tokens.entries()) {
    if (data.diff.toFrom[j] >= 0) continue;
    const rank = data.enterRank.get(token.line) ?? 0;
    const start = phase(ENTER_START + ENTER_SPREAD * rank, morph);
    const progress = (local - start) / phase(ENTER_DURATION, morph);
    if (progress <= 0) continue;
    const eased = easeOut(progress);
    tokens.push({
      key: `${index + 1}:${j}`,
      text: token.text,
      kind: token.kind,
      role: "enter",
      line: token.line,
      col: token.col,
      opacity: eased,
      scale: GROW_FROM + (1 - GROW_FROM) * eased,
      blur: blur * (1 - eased),
    });
  }
  const shrinking = to.lines < from.lines;
  const lag = shrinking ? phase(CASCADE, morph) : 0;
  const grown = glide(unit01(travel(lag) / (1 - ARC)));
  const lines = from.lines + (to.lines - from.lines) * grown;
  const shared = Math.min(from.lines, to.lines);
  const lineNumbers = rowsOf(Math.max(from.lines, to.lines), (row) => {
    if (row < shared) return 1;
    return shrinking ? 1 - grown : grown;
  });
  return { tokens, lines, lineNumbers };
}

function highlightsAt(
  time: number,
  timeline: CodeMorphTimeline,
  layout: CodeMorphLayout,
  active: number,
) {
  const rows: CodeMorphRow[] = [];
  if (!timeline.highlight) return rows;
  for (const index of [active - 1, active]) {
    if (index < 0) continue;
    const morph = timeline.morphs[index];
    const rise = easeOutQuad((time - morph.highlightStart) / RISE);
    const fall = smoothstep((time - morph.fallStart) / FALL);
    const opacity = rise * (1 - fall);
    if (opacity <= 0) continue;
    for (const row of layout.morphs[index].changed) {
      rows.push({ key: `${index}:${row}`, row, opacity });
    }
  }
  return rows;
}

export function getCodeMorphState(
  frame: number,
  options: CodeMorphOptions = {},
  layout: CodeMorphLayout = getCodeMorphLayout(options),
): CodeMorphState {
  const timeline = getCodeMorphTimeline(options);
  const time = getCodeMorphTime(frame, options);
  let active = -1;
  for (const [index, morph] of timeline.morphs.entries()) {
    if (morph.start <= time) active = index;
  }
  const highlights = highlightsAt(time, timeline, layout, active);
  if (active === -1) {
    const lines = layout.versions[0].lines;
    return {
      time,
      version: 0,
      morphing: false,
      progress: 0,
      lines,
      tokens: restingTokens(layout, 0),
      lineNumbers: rowsOf(lines, () => 1),
      highlights,
    };
  }
  const local = time - timeline.morphs[active].start;
  if (local >= timeline.morph) {
    const version = active + 1;
    const lines = layout.versions[version].lines;
    return {
      time,
      version,
      morphing: false,
      progress: 1,
      lines,
      tokens: restingTokens(layout, version),
      lineNumbers: rowsOf(lines, () => 1),
      highlights,
    };
  }
  const motion = morphFrame(layout, active, local, timeline.morph);
  return {
    time,
    version: active + 1,
    morphing: true,
    progress: local / timeline.morph,
    lines: motion.lines,
    tokens: motion.tokens,
    lineNumbers: motion.lineNumbers,
    highlights,
  };
}

function transformOf(token: CodeMorphRenderToken, lineHeight: number) {
  const move = `translate(${token.col}ch, ${token.line * lineHeight}px)`;
  return token.scale === 1 ? move : `${move} scale(${token.scale})`;
}

export function CodeMorph({
  steps = codeMorphDefaults.steps,
  morphDuration = codeMorphDefaults.morphDuration,
  highlight = codeMorphDefaults.highlight,
  fontSize = codeMorphDefaults.fontSize,
  lineNumbers = codeMorphDefaults.lineNumbers,
  filename = codeMorphDefaults.filename,
  windowDots = codeMorphDefaults.windowDots,
  theme = codeMorphDefaults.theme,
  accentColor = codeMorphDefaults.accentColor,
  speed = codeMorphDefaults.speed,
  className,
}: CodeMorphProps) {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const layout = useMemo(() => {
    const shape = { steps, fontSize, lineNumbers, filename, windowDots };
    return getCodeMorphLayout({ ...shape, width, height });
  }, [steps, fontSize, lineNumbers, filename, windowDots, width, height]);
  const motion = { steps, morphDuration, highlight, speed, fps };
  const state = getCodeMorphState(frame, motion, layout);
  const palette = theme === "light" ? PALETTES.light : PALETTES.dark;
  const unit = layout.unit;
  const hairline = Math.max(1, unit);
  const edge = `${hairline}px solid ${palette.border}`;
  const top = layout.header + layout.padTop;
  const blend = `${palette.share}%, ${palette.mix}`;
  const accentText = `color-mix(in oklab, ${accentColor} ${blend})`;
  const colorOf = (kind: CodeMorphKind) =>
    kind === "string" || kind === "number" ? accentText : palette[kind];
  const panelColumns = `${layout.gutter + layout.columns}ch`;
  const panelPadding = layout.padLeft + layout.padRight;
  const codeLeft = `${layout.gutter}ch`;
  const tabLeft = (layout.windowDots ? TAB_AFTER_DOTS : TAB_LEFT) * unit;
  const tabRadius = TAB_RADIUS * unit;

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          flexShrink: 0,
          boxSizing: "content-box",
          width: `calc(${panelColumns} + ${panelPadding}px)`,
          height: top + layout.rows * layout.lineHeight + layout.padBottom,
          background: palette.panel,
          color: palette.text,
          border: edge,
          borderRadius: RADIUS * unit,
          overflow: "hidden",
          fontFamily: FONT_MONO,
          fontSize: layout.fontSize,
          lineHeight: `${layout.lineHeight}px`,
          fontVariantLigatures: "none",
          fontKerning: "none",
        }}
      >
        {layout.header > 0 ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              right: 0,
              height: layout.header,
              background: palette.chrome,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: hairline,
                background: palette.border,
              }}
            />
            {layout.windowDots
              ? DOTS.map((dot) => (
                  <div
                    key={dot}
                    style={{
                      position: "absolute",
                      left: (DOT_LEFT + dot * (DOT + DOT_GAP)) * unit,
                      top: ((HEADER - DOT) / 2) * unit,
                      width: DOT * unit,
                      height: DOT * unit,
                      borderRadius: "50%",
                      background: palette.dot,
                    }}
                  />
                ))
              : null}
            {layout.filename !== "" ? (
              <div
                style={{
                  position: "absolute",
                  left: tabLeft,
                  bottom: 0,
                  height: (HEADER - TAB_TOP) * unit,
                  boxSizing: "border-box",
                  display: "flex",
                  alignItems: "center",
                  padding: `0 ${TAB_PAD * unit}px`,
                  background: palette.panel,
                  borderTop: edge,
                  borderLeft: edge,
                  borderRight: edge,
                  borderRadius: `${tabRadius}px ${tabRadius}px 0 0`,
                  color: palette.label,
                  fontSize: TAB_FONT * unit,
                  lineHeight: 1,
                  whiteSpace: "pre",
                }}
              >
                {layout.filename}
              </div>
            ) : null}
          </div>
        ) : null}
        {state.highlights.map((band) => (
          <div
            key={band.key}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: top + band.row * layout.lineHeight,
              height: layout.lineHeight,
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: accentColor,
                opacity: band.opacity * palette.band,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: BAR * unit,
                background: accentColor,
                opacity: band.opacity,
              }}
            />
          </div>
        ))}
        <div style={{ position: "absolute", left: layout.padLeft, top }}>
          {layout.lineNumbers
            ? state.lineNumbers.map((row) => (
                <div
                  key={row.key}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: row.row * layout.lineHeight,
                    width: `${layout.digits}ch`,
                    textAlign: "right",
                    whiteSpace: "pre",
                    color: palette.gutter,
                    opacity: row.opacity,
                  }}
                >
                  {row.row + 1}
                </div>
              ))
            : null}
          <div style={{ position: "absolute", left: codeLeft, top: 0 }}>
            {state.tokens.map((token) => (
              <span
                key={token.key}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  display: "block",
                  whiteSpace: "pre",
                  color: colorOf(token.kind),
                  opacity: token.opacity,
                  transform: transformOf(token, layout.lineHeight),
                  filter: token.blur > 0 ? `blur(${token.blur}px)` : undefined,
                }}
              >
                {token.text}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
