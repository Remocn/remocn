/**
 * Requests that are plainly not about an animation's look: asks for code,
 * prose or a chatbot, and attempts to rewrite the model's instructions. Each
 * is a strike before any model is called (lib/describe/store.ts).
 *
 * The patterns are narrow on purpose: a false match counts against an honest
 * visitor. Anything less clear-cut goes to the model, whose schema has no
 * place for a free-text answer and which flags off-topic requests itself.
 */

const L = "\\p{L}\\p{N}";
const word = (source: string) => `(?<![${L}-])(?:${source})(?![${L}-])`;

const GENERATE = word("write|generate|code up|program|draft|compose");
const WORKS =
  "program|programs|script|scripts|code|function|class|app|application|website|essay|poem|story|article|letter|email|resume|cv|business plan|homework|sql query|regex|bot|chatbot|api";
const GENERATE_RU = word(
  "напиши|написать|напишите|сгенерируй|сгенерировать|придумай|запрограммируй|разработай",
);
const WORKS_RU =
  "программ\\p{L}*|скрипт\\p{L}*|код|кода|функци\\p{L}*|приложени\\p{L}*|сайт\\p{L}*|сочинени\\p{L}*|эссе|стих\\p{L}*|рассказ\\p{L}*|стать\\p{L}*|письм\\p{L}*|резюме|бизнес-план\\p{L}*|домашк\\p{L}*|бот\\p{L}*|запрос\\p{L}*";
const LANGUAGES =
  "python|javascript|typescript|java|c\\+\\+|c#|golang|rust|php|ruby|kotlin|swift|bash|sql|html|css";

const PATTERNS: [string, RegExp][] = [
  [
    "injection",
    new RegExp(
      [
        "ignore (?:all |the |any )?(?:previous|prior|above|earlier) (?:instructions|prompts?|rules)",
        "system prompt",
        "you are now",
        "act as (?:a|an) ",
        "pretend (?:to be|you are)",
        "jailbreak",
        "developer mode",
        "(?:забудь|игнорируй|проигнорируй)\\s+(?:все\\s+)?(?:предыдущие\\s+|прошлые\\s+)?(?:инструкц|правил|указани)",
        "системн\\p{L}* (?:промпт|подсказ|инструкц)",
        "ты теперь",
        "представь,? что ты",
      ].join("|"),
      "iu",
    ),
  ],
  [
    "generate",
    new RegExp(
      `${GENERATE}\\s+(?:me\\s+|us\\s+)?(?:a\\s+|an\\s+|the\\s+|some\\s+)?(?:[${L}+#]+\\s+){0,2}${word(WORKS)}`,
      "iu",
    ),
  ],
  [
    "generate",
    new RegExp(
      `${GENERATE_RU}\\s+(?:мне\\s+|нам\\s+)?(?:[${L}+#-]+\\s+){0,2}${word(WORKS_RU)}`,
      "iu",
    ),
  ],
  [
    "code",
    new RegExp(
      `${word(LANGUAGES)}[^.]{0,40}${word(`code|script|program|function|class|${WORKS_RU}`)}|${word(`code|script|program|function|${WORKS_RU}`)}[^.]{0,40}${word(LANGUAGES)}`,
      "iu",
    ),
  ],
  [
    "code",
    /```|<\/?script|console\.log|#include|\bdef \w+\(|\bfunction\s*\w*\s*\(|=>\s*\{|\bselect\s.+\sfrom\s/iu,
  ],
];

/**
 * Why the request looks off-topic, or null when nothing here says so.
 *
 * `injection` is certain: no description of a look tells the model to drop
 * its instructions. `code` and `generate` are only suspect: "write the code
 * slower" is an honest request on a code component, so the caller strikes
 * them only when nothing else in the request reads as a look.
 */
export function offTopicReason(
  text: string,
): "injection" | "code" | "generate" | null {
  const normalized = text.replace(/ё/g, "е").replace(/Ё/g, "Е");
  for (const [reason, pattern] of PATTERNS) {
    if (pattern.test(normalized))
      return reason as "injection" | "code" | "generate";
  }
  return null;
}
