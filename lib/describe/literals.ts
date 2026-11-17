import type { ControlConfig, ControlType } from "@/lib/customizer-config";
import { sanitizePatch } from "./patch";
import type { Patch } from "./types";

/**
 * The free first tier of the describe field: words and values a parser can
 * read without a model, in English and Russian.
 *
 * - relative words: "slower", "much faster", "bigger", "чуть медленнее"
 * - numbers with a unit: "2x faster", "delay 1s", "scale 120%"
 * - colours by hex or name, aimed at a prop by a nearby noun: "blue
 *   background", "текст белый"; without one, at the accent
 * - fonts by name or kind: "Fraunces", "serif", "моноширинный"
 * - the options of the component's own selects ("light", "spring") and its
 *   switches by label ("no grain", "без зерна")
 * - quoted copy for a text prop: title "Launch day"
 *
 * Every rule marks the characters it read. Words left unread (minus filler)
 * come back as `leftover`; none left means the parser explained the request.
 */

export interface LiteralResult {
  patch: Patch;
  leftover: string[];
  /** What the parser recognized, for analytics and tests. */
  hits: string[];
  /**
   * Props the request gave an exact value for: a number, a hex colour, quoted
   * copy, a font or option by name. Elsewhere ("green", "slower") a model's
   * reading of the whole sentence is the better one.
   */
  exact: string[];
}

const L = "\\p{L}\\p{N}";
const ADJ =
  "(?:ый|ий|ой|ая|яя|ое|ее|ые|ие|ого|его|ому|ему|ым|им|ом|ем|ую|юю|ых|их)";

/** A pattern that matches whole words only, Cyrillic included. */
function words(source: string): RegExp {
  return new RegExp(`(?<![${L}])(?:${source})(?![${L}])`, "gu");
}

const NUMBER = "(\\d+(?:[.,]\\d+)?)";
const toNumber = (text: string) => Number(text.replace(",", "."));

const COLORS: [string, string][] = [
  [`light blue|sky blue|голуб${ADJ}`, "#38bdf8"],
  [`red|crimson|красн${ADJ}`, "#ef4444"],
  [`orange|оранжев${ADJ}`, "#f97316"],
  [`yellow|желт${ADJ}`, "#eab308"],
  [`green|зелен${ADJ}`, "#22c55e"],
  [`teal|cyan|бирюзов${ADJ}`, "#14b8a6"],
  [`blue|navy|син${ADJ}`, "#3b82f6"],
  [`purple|violet|фиолетов${ADJ}|сиренев${ADJ}`, "#8b5cf6"],
  [`pink|magenta|розов${ADJ}`, "#ec4899"],
  [`gold|golden|золот${ADJ}`, "#d4a017"],
  [`brown|коричнев${ADJ}`, "#92400e"],
  [`gr[ae]y|сер${ADJ}`, "#737373"],
  [`black|черн${ADJ}`, "#0a0a0a"],
  [`white|бел${ADJ}`, "#fafafa"],
  [`dark|темн${ADJ}`, "#0a0a0a"],
  [`light|светл${ADJ}`, "#fafafa"],
];
const COLOR_WORD = new RegExp(
  `(?<![${L}])(?:${COLORS.map(([source]) => source).join("|")})(?![${L}])|#[0-9a-f]{3,8}(?![${L}])`,
  "gu",
);

function colorOf(word: string): string | null {
  if (word.startsWith("#")) return word;
  for (const [source, hex] of COLORS) {
    if (new RegExp(`^(?:${source})$`, "u").test(word)) return hex;
  }
  return null;
}

/** Nouns that aim a colour at a prop, by the prop's role. */
const TARGETS: { role: "background" | "ink" | "accent"; source: string }[] = [
  {
    role: "background",
    source: "background|backdrop|bg|фон\\p{L}*|подложк\\p{L}*",
  },
  {
    role: "ink",
    source:
      "text|ink|type|copy|letters|font colou?r|текст\\p{L}*|надпис\\p{L}*|букв\\p{L}*|шрифт\\p{L}*",
  },
  {
    role: "accent",
    source: "accent|highlight|акцент\\p{L}*|выделени\\p{L}*",
  },
];

/** Russian words for common control labels, so "без зерна" finds Grain. */
const LABEL_ALIASES: Record<string, string> = {
  grain: "зерн\\p{L}*|шум\\p{L}*|пленк\\p{L}*",
  glow: "свечени\\p{L}*|сияни\\p{L}*",
  shadow: "тен\\p{L}*",
  blur: "размыти\\p{L}*|блюр\\p{L}*",
  cursor: "курсор\\p{L}*",
  border: "рамк\\p{L}*|границ\\p{L}*|обводк\\p{L}*",
  logo: "логотип\\p{L}*|лого",
  loop: "цикл\\p{L}*|повтор\\p{L}*",
  title: "заголов\\p{L}*",
  subtitle: "подзаголов\\p{L}*",
  label: "подпис\\p{L}*",
  name: "имя|имени|назван\\p{L}*",
  button: "кнопк\\p{L}*",
  text: "текст\\p{L}*",
};

const OFF =
  "no|without|hide|remove|disable|turn off|без|убери|убрать|выключи\\p{L}*|отключи\\p{L}*|скрой|скрыть";
const ON =
  "with|show|add|enable|turn on|включи\\p{L}*|добавь|добавить|покажи|показать|с";

const STRONGER = "very|much|way|a lot|far|очень|намного|гораздо|сильно|куда";
const WEAKER =
  "slightly|a bit|a little|little|bit|somewhat|чуть|чуть-чуть|немного|слегка|немножко";

/** Words that carry no request of their own. */
const FILLER = new Set(
  (
    "a an the it its this that these is are be make made set change give use " +
    "please just more less so and or but to of in on at for as like look looks " +
    "feel feels bit little slightly very much way lot animation animated " +
    "scene component video version style styled color colour colors also too " +
    "then now can could would should i want need me my we our you " +
    "сделай сделать сделайте пусть будет было был была были хочу нужно надо " +
    "пожалуйста чуть немного слегка очень более менее побольше поменьше и а но " +
    "или с со в во на по для чтобы это этот эта эти его ее её их же ну так " +
    "как еще ещё тоже также анимация анимацию анимации сцена сцену цвет цвета " +
    "цветом стиль стиле вид мне нам"
  ).split(" "),
);

type Role = "background" | "ink" | "accent";

/** The prop a colour role points at, among the component's colour controls. */
function colorProp(controls: ControlConfig, role: Role): string | null {
  const colors = Object.entries(controls).filter(
    ([, control]) => control.type === "color",
  );
  const by = (test: (key: string, label: string) => boolean) =>
    colors.find(([key, control]) =>
      test(key.toLowerCase(), control.label.toLowerCase()),
    )?.[0] ?? null;
  if (role === "background") {
    return by(
      (key, label) => key === "background" || label.includes("background"),
    );
  }
  if (role === "ink") {
    return by((key, label) => key === "ink" || label.includes("text"));
  }
  return (
    by((key, label) => key.includes("accent") || label.includes("accent")) ??
    by((key) => key !== "background" && key !== "ink") ??
    by((key) => key === "ink")
  );
}

const SERIF = ["Instrument Serif", "Fraunces"];
const MONO = ["JetBrains Mono"];
const SANS = [
  "Inter",
  "Geist",
  "Manrope",
  "Space Grotesk",
  "Bricolage Grotesque",
];

function fontProp(
  controls: ControlConfig,
): [string, ControlType & { type: "font" }] | null {
  for (const [key, control] of Object.entries(controls)) {
    if (control.type === "font") return [key, control];
  }
  return null;
}

class Reader {
  readonly text: string;
  private readonly read: boolean[];
  readonly patch: Patch = {};
  readonly hits: string[] = [];

  constructor(text: string) {
    this.text = text;
    this.read = Array.from(text, () => false);
  }

  /** Each unread match of `pattern`; reading it marks its characters. */
  *matches(pattern: RegExp, from = 0, to = this.text.length) {
    pattern.lastIndex = from;
    for (
      let match = pattern.exec(this.text);
      match;
      match = pattern.exec(this.text)
    ) {
      if (match.index >= to) return;
      const end = match.index + match[0].length;
      if (!this.read.slice(match.index, end).some(Boolean)) yield match;
      if (match[0].length === 0) pattern.lastIndex++;
    }
  }

  mark(start: number, end: number) {
    for (let i = start; i < end; i++) this.read[i] = true;
  }

  readonly exact = new Set<string>();

  set(key: string, value: unknown, hit: string) {
    if (!(key in this.patch)) {
      this.patch[key] = value;
      if (
        /:number$|^quote$|^option:|^font:name$|^switch:|^color-hex:/.test(hit)
      ) {
        this.exact.add(key);
      }
    }
    this.hits.push(hit);
  }

  leftover(): string[] {
    const out: string[] = [];
    const word = new RegExp(`[${L}#%-]+`, "gu");
    for (const match of this.text.matchAll(word)) {
      const start = match.index ?? 0;
      const unread = this.read
        .slice(start, start + match[0].length)
        .some((done) => !done);
      if (unread && !FILLER.has(match[0]) && !/^\d+$/.test(match[0])) {
        out.push(match[0]);
      }
    }
    return out;
  }
}

/** Clause boundaries, so "blue text, white background" pairs correctly. */
function clauses(text: string): [number, number][] {
  const out: [number, number][] = [];
  const split = new RegExp(
    `[,;.!?\\n]|(?<![${L}])(?:and|but|и|а|но|плюс)(?![${L}])`,
    "gu",
  );
  let start = 0;
  for (const match of text.matchAll(split)) {
    out.push([start, match.index ?? 0]);
    start = (match.index ?? 0) + match[0].length;
  }
  out.push([start, text.length]);
  return out;
}

/** How strongly a clause asks: "much slower" squares the step, "a bit" halves it. */
function intensity(reader: Reader, from: number, to: number): number {
  const clause = reader.text.slice(from, to);
  if (words(STRONGER).test(clause)) return 2;
  if (words(WEAKER).test(clause)) return 0.5;
  return 1;
}

function current(
  controls: ControlConfig,
  values: Record<string, unknown>,
  key: string,
): number | null {
  const control = controls[key];
  if (
    !control ||
    (control.type !== "number" && control.type !== "number-input")
  )
    return null;
  const value = values[key];
  return typeof value === "number" ? value : control.default;
}

function readQuotes(reader: Reader, original: string, controls: ControlConfig) {
  const quote = /"([^"]+)"|«([^»]+)»|“([^”]+)”|(?<![\p{L}])'([^']+)'/gu;
  const texts = Object.entries(controls).filter(
    ([, control]) => control.type === "text",
  );
  for (const match of original.matchAll(quote)) {
    const start = match.index ?? 0;
    const copy = (match[1] ?? match[2] ?? match[3] ?? match[4]).trim();
    reader.mark(start, start + match[0].length);
    if (!copy || texts.length === 0) continue;
    const before = reader.text.slice(Math.max(0, start - 40), start);
    const named = texts.find(([key, control]) => {
      const names = [
        key.toLowerCase(),
        ...control.label.toLowerCase().split(/\s+/),
      ].filter((name) => name.length >= 3);
      const aliases = names.map((name) => LABEL_ALIASES[name]).filter(Boolean);
      return [...names, ...aliases].some((name) => words(name).test(before));
    });
    const target = named ?? (texts.length === 1 ? texts[0] : null);
    if (!target) continue;
    // The noun that named the prop is part of the request too.
    const [key, control] = target;
    for (const name of [
      key.toLowerCase(),
      control.label.toLowerCase(),
      LABEL_ALIASES[key.toLowerCase()],
    ].filter(Boolean)) {
      const from = Math.max(0, start - 40);
      for (const noun of reader.matches(words(name), from, start)) {
        reader.mark(noun.index, noun.index + noun[0].length);
      }
    }
    reader.set(key, copy, "quote");
  }
}

function readNumbers(
  reader: Reader,
  controls: ControlConfig,
  values: Record<string, unknown>,
) {
  const speed = current(controls, values, "speed");
  if (speed !== null) {
    const times = words(
      `${NUMBER}\\s*(?:x|х|×|times|раза?)\\s*(faster|quicker|slower|быстрее|медленнее)?`,
    );
    for (const match of reader.matches(times)) {
      const n = toNumber(match[1]);
      if (!(n > 0)) continue;
      const slower = /slower|медленнее/u.test(match[2] ?? "");
      reader.mark(match.index, match.index + match[0].length);
      reader.set(
        "speed",
        match[2] ? (slower ? speed / n : speed * n) : n,
        "speed:number",
      );
    }
    for (const match of reader.matches(
      words(
        `(?:speed|скорост\\p{L}*)\\s*(?:to|=|:|на|до)?\\s*${NUMBER}\\s*(?:x|х|×)?`,
      ),
    )) {
      reader.mark(match.index, match.index + match[0].length);
      reader.set("speed", toNumber(match[1]), "speed:number");
    }
  }

  if (controls.delay) {
    const delay = words(
      `(?:delay|wait|pause|start after|задержк\\p{L}*|пауз\\p{L}*|ожидани\\p{L}*)\\s*(?:of|by|в|на|=|:)?\\s*${NUMBER}\\s*(ms|мс|s|sec|secs|seconds?|с|сек\\p{L}*|frames?|кадр\\p{L}*|f)?`,
    );
    for (const match of reader.matches(delay)) {
      const n = toNumber(match[1]);
      const unit = match[2] ?? "";
      const frames = /^(?:frame|кадр|f$)/u.test(unit)
        ? n
        : /^(?:ms|мс)$/u.test(unit)
          ? (n / 1000) * 30
          : unit || n <= 5
            ? n * 30
            : n;
      reader.mark(match.index, match.index + match[0].length);
      reader.set("delay", Math.round(frames), "delay:number");
    }
  }

  if (controls.scale) {
    const scale = words(
      `(?:scale|size|zoom|масштаб\\p{L}*|размер\\p{L}*)\\s*(?:to|=|:|на|до)?\\s*${NUMBER}\\s*(%)?`,
    );
    for (const match of reader.matches(scale)) {
      const n = toNumber(match[1]);
      reader.mark(match.index, match.index + match[0].length);
      reader.set("scale", match[2] || n > 4 ? n / 100 : n, "scale:number");
    }
  }
}

function readOptions(reader: Reader, controls: ControlConfig) {
  for (const [key, control] of Object.entries(controls)) {
    if (control.type !== "select") continue;
    for (const option of control.options) {
      if (option === "auto" || option.length < 3) continue;
      const spelled = option.toLowerCase().replace(/[-_]/g, "[\\s_-]?");
      for (const match of reader.matches(words(spelled))) {
        reader.mark(match.index, match.index + match[0].length);
        reader.set(key, option, `option:${key}`);
      }
    }
  }
}

function readSwitches(reader: Reader, controls: ControlConfig) {
  for (const [key, control] of Object.entries(controls)) {
    if (control.type !== "boolean") continue;
    const label = control.label.toLowerCase();
    const names = [
      label,
      key.toLowerCase(),
      LABEL_ALIASES[label] ?? LABEL_ALIASES[key.toLowerCase()],
    ]
      .filter(Boolean)
      .join("|");
    const off = words(
      `(?:${OFF})\\s+(?:the\\s+)?(?:${names})|(?:${names})\\s+(?:off|выкл\\p{L}*)`,
    );
    for (const match of reader.matches(off)) {
      reader.mark(match.index, match.index + match[0].length);
      reader.set(key, false, `switch:${key}`);
    }
    const on = words(
      `(?:${ON})\\s+(?:the\\s+)?(?:${names})|(?:${names})\\s+(?:on|вкл\\p{L}*)|${names}`,
    );
    for (const match of reader.matches(on)) {
      reader.mark(match.index, match.index + match[0].length);
      reader.set(key, true, `switch:${key}`);
    }
  }
}

function readFonts(reader: Reader, controls: ControlConfig) {
  const font = fontProp(controls);
  if (!font) return;
  const [key, control] = font;
  for (const option of control.options) {
    for (const match of reader.matches(words(option.toLowerCase()))) {
      reader.mark(match.index, match.index + match[0].length);
      reader.set(key, option, "font:name");
    }
  }
  const kinds: [string, string[]][] = [
    [
      "serif|editorial|elegant|classic|засечк\\p{L}*|антикв\\p{L}*|элегантн\\p{L}*|классическ\\p{L}*",
      SERIF,
    ],
    [
      "mono|monospace|monospaced|code font|terminal|моноширинн\\p{L}*|моно",
      MONO,
    ],
    ["sans|sans-serif|grotesk|без засечек|гротеск\\p{L}*", SANS],
  ];
  for (const [source, family] of kinds) {
    const pick = family.find((name) => control.options.includes(name));
    for (const match of reader.matches(
      words(`(?:${source})(?:\\s+(?:font|type|typeface|шрифт\\p{L}*))?`),
    )) {
      if (!pick) continue;
      reader.mark(match.index, match.index + match[0].length);
      reader.set(key, pick, "font:kind");
    }
  }
  for (const match of reader.matches(words("font|typeface|шрифт\\p{L}*"))) {
    if (key in reader.patch)
      reader.mark(match.index, match.index + match[0].length);
  }
}

function readColors(reader: Reader, controls: ControlConfig) {
  for (const [from, to] of clauses(reader.text)) {
    const found = [...reader.matches(COLOR_WORD, from, to)];
    if (found.length === 0) continue;
    // Nouns that say which prop a colour is for, by role or by label.
    const nouns: { prop: string; start: number; end: number }[] = [];
    for (const target of TARGETS) {
      const prop = colorProp(controls, target.role);
      if (!prop) continue;
      for (const noun of reader.matches(words(target.source), from, to)) {
        nouns.push({
          prop,
          start: noun.index,
          end: noun.index + noun[0].length,
        });
      }
    }
    for (const [key, control] of Object.entries(controls)) {
      if (control.type !== "color") continue;
      const label = control.label
        .toLowerCase()
        .replace(/\s*colou?r\s*/g, " ")
        .trim();
      if (label.length < 3 || nouns.some((noun) => noun.prop === key)) continue;
      for (const noun of reader.matches(words(label), from, to)) {
        nouns.push({
          prop: key,
          start: noun.index,
          end: noun.index + noun[0].length,
        });
      }
    }
    const free = [...nouns];
    for (const color of found) {
      const at = color.index;
      // The nearest noun takes the colour: "white text on a dark background".
      free.sort((a, b) => Math.abs(a.start - at) - Math.abs(b.start - at));
      const noun = free.shift();
      // "dark" or "light" alone is a theme, which the moods read.
      if (!noun && /^(?:dark|light|темн|светл)/u.test(color[0])) continue;
      const prop = noun?.prop ?? colorProp(controls, "accent");
      if (!prop) continue;
      reader.mark(at, at + color[0].length);
      if (noun) reader.mark(noun.start, noun.end);
      const hex = color[0].startsWith("#");
      reader.set(
        prop,
        colorOf(color[0]),
        `${hex ? "color-hex" : "color"}:${prop}`,
      );
    }
  }
}

/** Relative words and themes, applied to the props the scenes share. */
function readMoods(
  reader: Reader,
  controls: ControlConfig,
  values: Record<string, unknown>,
) {
  for (const [from, to] of clauses(reader.text)) {
    const power = intensity(reader, from, to);
    const step = (key: string, factor: number, source: string, hit: string) => {
      const base = current(controls, values, key);
      if (base === null) return;
      for (const match of reader.matches(words(source), from, to)) {
        reader.mark(match.index, match.index + match[0].length);
        reader.set(key, base * factor ** power, hit);
      }
    };
    step(
      "speed",
      2 / 3,
      "slow\\p{L}*|calm\\p{L}*|relax\\p{L}*|gentl\\p{L}*|leisur\\p{L}*|lazy|медлен\\p{L}*|помедленнее|плавн\\p{L}*|спокойн\\p{L}*|неторопл\\p{L}*|размеренн\\p{L}*",
      "speed:slower",
    );
    step(
      "speed",
      1.5,
      "fast\\p{L}*|quick\\p{L}*|snappy|snappier|energetic|punchy|punchier|rapid\\p{L}*|speedy|быстр\\p{L}*|побыстрее|энергичн\\p{L}*|резв\\p{L}*|динамичн\\p{L}*",
      "speed:faster",
    );
    step(
      "scale",
      1.2,
      "bigger|larger|huge|big|large|больше|крупн\\p{L}*|огромн\\p{L}*|увелич\\p{L}*",
      "scale:bigger",
    );
    step(
      "scale",
      0.85,
      "smaller|small|tiny|меньше|мельче|мелк\\p{L}*|уменьш\\p{L}*",
      "scale:smaller",
    );

    if (controls.delay) {
      for (const match of reader.matches(
        words(
          "immediately|right away|instantly|no delay|сразу|мгновенно|без задержки",
        ),
        from,
        to,
      )) {
        reader.mark(match.index, match.index + match[0].length);
        reader.set("delay", 0, "delay:none");
      }
      for (const match of reader.matches(
        words("delayed|later|with a delay|с задержкой|позже|попозже"),
        from,
        to,
      )) {
        reader.mark(match.index, match.index + match[0].length);
        reader.set("delay", 15, "delay:later");
      }
    }

    const theme = (source: string, dark: boolean) => {
      for (const match of reader.matches(words(source), from, to)) {
        const background = colorProp(controls, "background");
        const ink = colorProp(controls, "ink");
        if (!background && !ink) continue;
        reader.mark(match.index, match.index + match[0].length);
        if (background)
          reader.set(background, dark ? "#0a0a0a" : "#fafafa", "theme");
        if (ink) reader.set(ink, dark ? "#fafafa" : "#0a0a0a", "theme");
      }
    };
    theme(
      `dark(?:er)?(?:\\s+(?:mode|theme))?|night|темн${ADJ}|темнее|ночн${ADJ}`,
      true,
    );
    theme(`light(?:er)?(?:\\s+(?:mode|theme))?|светл${ADJ}|светлее`, false);
  }
}

/**
 * Reads what it can of a request. The patch is sanitized against the
 * controls; text props are filled only from quoted copy.
 */
export function parseLiterals(
  text: string,
  controls: ControlConfig,
  values: Record<string, unknown>,
): LiteralResult {
  // Same length as the input, so positions carry over to the original text.
  const normalized = text.toLowerCase().replace(/ё/g, "е");
  const reader = new Reader(normalized);
  readQuotes(reader, text.replace(/ё/g, "е").replace(/Ё/g, "Е"), controls);
  readNumbers(reader, controls, values);
  // Before the selects: "dark background" is a colour, "dark" alone a theme.
  readColors(reader, controls);
  readOptions(reader, controls);
  readSwitches(reader, controls);
  readFonts(reader, controls);
  readMoods(reader, controls, values);
  return {
    patch: sanitizePatch(controls, reader.patch, { allowText: true }),
    leftover: reader.leftover(),
    hits: reader.hits,
    exact: [...reader.exact],
  };
}
