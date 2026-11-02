import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * Reads plain markdown passed as children to a guide block. The guides keep
 * their content as markdown (so `/docs/guides/*.md` and "Copy page" stay
 * readable) and the blocks only re-lay it out. MDX renders lists, `strong`,
 * `em` and paragraphs as intrinsic elements; fenced code arrives as a
 * rehype-pretty-code tree whose `code` element carries the source in
 * `__raw__` (see `source.config.ts`).
 */

type Props = { children?: ReactNode; [key: string]: unknown };
type El = ReactElement<Props>;

function isEl(node: ReactNode): node is El {
  return isValidElement(node);
}

function isType(node: ReactNode, type: string): node is El {
  return isEl(node) && node.type === type;
}

/** Depth-first search for the first element of an intrinsic `type`. */
export function findElement(node: ReactNode, type: string): El | undefined {
  for (const child of Children.toArray(node)) {
    if (isType(child, type)) return child;
    if (isEl(child)) {
      const found = findElement(child.props.children, type);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * First link inside `node`. Fumadocs maps `a` to its own Link component, so
 * links are matched by their `href` prop rather than by type.
 */
export function findLink(node: ReactNode): El | undefined {
  for (const child of Children.toArray(node)) {
    if (!isEl(child)) continue;
    if (typeof child.props.href === "string") return child;
    const found = findLink(child.props.children);
    if (found) return found;
  }
  return undefined;
}

/** Source of the first fenced code block inside `node`. */
export function findRaw(node: ReactNode): string | undefined {
  for (const child of Children.toArray(node)) {
    if (!isEl(child)) continue;
    if (typeof child.props.__raw__ === "string") return child.props.__raw__;
    const found = findRaw(child.props.children);
    if (found) return found;
  }
  return undefined;
}

/** Plain text of a node tree. */
export function textOf(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }
      return isEl(child) ? textOf(child.props.children) : "";
    })
    .join("");
}

/** Children of each `li` of the first list (`ul` or `ol`) inside `node`. */
export function listItems(node: ReactNode): ReactNode[][] {
  const list = findElement(node, "ol") ?? findElement(node, "ul");
  if (!list) return [];
  return Children.toArray(list.props.children)
    .filter((child) => isType(child, "li"))
    .map((li) => {
      const content = Children.toArray((li as El).props.children);
      // Loose lists wrap the item in a paragraph; unwrap it.
      if (content.length === 1 && isType(content[0], "p")) {
        return Children.toArray((content[0] as El).props.children);
      }
      return content;
    });
}

/** Paragraphs (`p` children) directly inside `node`. */
export function paragraphs(node: ReactNode): ReactNode[][] {
  return Children.toArray(node)
    .filter((child) => isType(child, "p"))
    .map((p) => Children.toArray((p as El).props.children));
}

const LEAD_SEPARATOR = /^\s*(?:—|-|:)\s*/;

/**
 * Splits `**Lead** — rest` into its parts. An `em` right after the lead
 * becomes a `tag` (e.g. `**Accent color** _optional_ — …`).
 */
export function splitLead(item: ReactNode[]): {
  lead: ReactNode;
  tag?: ReactNode;
  rest: ReactNode[];
} {
  const nodes = item.filter(
    (node, index) => !(index === 0 && typeof node === "string" && !node.trim()),
  );
  const first = nodes[0];
  if (!isType(first, "strong")) return { lead: null, rest: nodes };

  let rest = nodes.slice(1);
  let tag: ReactNode;
  const next = rest.find((node) => !(typeof node === "string" && !node.trim()));
  if (isType(next, "em")) {
    tag = next.props.children;
    rest = rest.slice(rest.indexOf(next) + 1);
  }
  const [head, ...tail] = rest;
  if (typeof head === "string") {
    const trimmed = head.replace(LEAD_SEPARATOR, "");
    rest = trimmed ? [trimmed, ...tail] : tail;
  }
  return { lead: first.props.children, tag, rest };
}

/** Strips one pair of wrapping straight or curly quotes from a text line. */
export function unquote(nodes: ReactNode[]): ReactNode[] {
  const out = [...nodes];
  const first = out[0];
  if (typeof first === "string") out[0] = first.replace(/^\s*["“]/, "");
  const last = out[out.length - 1];
  if (typeof last === "string") {
    out[out.length - 1] = last.replace(/["”]\s*$/, "");
  }
  return out;
}
