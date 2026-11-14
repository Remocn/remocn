import { describe, expect, it } from "bun:test";
import {
  browserActor,
  classifyAgentClient,
  describeQuery,
  loggedQuery,
} from "./analytics-shape";

describe("describeQuery", () => {
  it("describes a query without quoting it", () => {
    expect(describeQuery("  show revenue growing ")).toEqual({
      query_words: 3,
      query_chars: 20,
      query_script: "latin",
    });
  });

  it("tells writing systems apart", () => {
    expect(describeQuery("показать рост выручки").query_script).toBe(
      "cyrillic",
    );
    expect(describeQuery("ロゴのアニメーション").query_script).toBe("cjk");
    expect(describeQuery("переход для logo").query_script).toBe("mixed");
    expect(describeQuery("123").query_script).toBe("other");
  });
});

describe("loggedQuery", () => {
  it("cuts a pasted paragraph down", () => {
    expect(loggedQuery("a".repeat(500))).toHaveLength(200);
  });
});

describe("classifyAgentClient", () => {
  it("groups callers by product", () => {
    expect(classifyAgentClient("Claude-User/1.0")).toBe("claude");
    expect(classifyAgentClient("codex_cli_rs/0.40 (openai)")).toBe("codex");
    expect(classifyAgentClient("ChatGPT-User/1.0")).toBe("chatgpt");
    expect(classifyAgentClient("Cursor/1.4")).toBe("cursor");
    expect(classifyAgentClient("node")).toBe("script");
    expect(classifyAgentClient("")).toBe("unknown");
    expect(classifyAgentClient("SomethingNew/2")).toBe("other");
  });
});

describe("browserActor", () => {
  it("treats an automated browser as an agent", () => {
    expect(browserActor("Mozilla/5.0 Chrome/140", true)).toBe("agent");
    expect(browserActor("Mozilla/5.0 Claude-Agent/1.0", false)).toBe("agent");
    expect(browserActor("Mozilla/5.0 Chrome/140", false)).toBe("human");
  });
});
