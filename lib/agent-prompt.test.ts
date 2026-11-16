import { describe, expect, it } from "bun:test";
import { agentPrompt } from "./agent-prompt";

describe("agentPrompt", () => {
  it("names the install command, the code and the Markdown docs", () => {
    const prompt = agentPrompt({
      name: "fade-in",
      code: '<FadeIn text="Hi" />',
      pathname: "/docs/text/fade-in",
    });
    expect(prompt).toContain("`npx shadcn@latest add @remocn/fade-in`");
    expect(prompt).toContain('```tsx\n<FadeIn text="Hi" />\n```');
    expect(prompt).toContain("Docs: https://remocn.dev/docs/text/fade-in.md");
  });
});
