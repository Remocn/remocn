import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * Helpers for blocks that restyle plain MDX markdown passed as children (a
 * list, a table, bold-led paragraphs). The markdown stays in the `.mdx` file,
 * so `/docs/**.md` keeps it verbatim for agents, while the block reads its
 * structure here and lays it out as cards.
 */

type Props = { children?: ReactNode; href?: string };
export type MdxElement = ReactElement<Props>;

export function isTag(node: ReactNode, tag: string): node is MdxElement {
  return isValidElement(node) && node.type === tag;
}

export function childrenOf(node: ReactNode): ReactNode[] {
  if (!isValidElement<Props>(node)) return [];
  return Children.toArray(node.props.children);
}

/** Every descendant element of the given tag, depth first, in order. */
export function findAll(node: ReactNode, tag: string): MdxElement[] {
  const found: MdxElement[] = [];
  const visit = (current: ReactNode) => {
    for (const child of Children.toArray(current)) {
      if (isTag(child, tag)) {
        found.push(child);
        continue;
      }
      if (isValidElement<Props>(child)) visit(child.props.children);
    }
  };
  visit(node);
  return found;
}

export function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return `${node}`;
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<Props>(node)) return textOf(node.props.children);
  return "";
}

/**
 * Splits a bold-led item (`**Title.** body`) into its title text and the rest
 * of its nodes, with the separating whitespace or leading ": " trimmed.
 */
export function splitLead(nodes: ReactNode[]): {
  title: string;
  body: ReactNode[];
} {
  const [first, ...rest] = nodes;
  if (!isTag(first, "strong")) return { title: "", body: nodes };
  const body = [...rest];
  if (typeof body[0] === "string") {
    const trimmed = body[0].replace(/^[\s:]+/, "");
    if (trimmed) body[0] = trimmed;
    else body.shift();
  }
  return { title: textOf(first).replace(/[.:]\s*$/, ""), body };
}

/** Inline content of a list item or paragraph, unwrapping a lone `<p>`. */
export function inlineOf(node: ReactNode): ReactNode[] {
  const nodes = childrenOf(node).filter(
    (child) => !(typeof child === "string" && !child.trim()),
  );
  if (nodes.length === 1 && isTag(nodes[0], "p")) return inlineOf(nodes[0]);
  return nodes;
}
