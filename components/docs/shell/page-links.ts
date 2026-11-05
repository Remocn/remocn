const SITE_URL = "https://remocn.dev";

export type PageLinks = {
  markdown: string;
  claude: string;
  chatgpt: string;
};

/**
 * Agent hand-offs for a docs page: the `.md` twin served by
 * the `/llms.md` route (rewritten in next.config), and Claude / ChatGPT chats primed to read it.
 */
export function getPageLinks(url: string): PageLinks {
  const markdown = `${url}.md`;
  const prompt = encodeURIComponent(
    `Read ${SITE_URL}${markdown}, I want to ask questions about it.`,
  );
  return {
    markdown,
    claude: `https://claude.ai/new?q=${prompt}`,
    chatgpt: `https://chatgpt.com/?hints=search&q=${prompt}`,
  };
}
