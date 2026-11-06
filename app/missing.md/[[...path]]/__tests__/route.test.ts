import { expect, test } from "bun:test";
import { GET } from "../route";

const call = (path?: string[]) =>
  GET(new Request("https://remocn.dev/missing.md"), {
    params: Promise.resolve({ path }),
  });

test("answers 404 with a Markdown body naming the path", async () => {
  const res = await call(["__probe-123", "deep"]);
  expect(res.status).toBe(404);
  expect(res.headers.get("content-type")).toBe("text/markdown; charset=utf-8");
  const body = await res.text();
  expect(body).toContain("`/__probe-123/deep`");
  expect(body).toContain("https://remocn.dev/llms.txt");
});

test("still answers 404 Markdown with no path", async () => {
  const res = await call();
  expect(res.status).toBe(404);
  expect(await res.text()).toContain("# 404");
});
