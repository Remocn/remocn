import { expect, test } from "bun:test";
import { OPENAPI_SPEC } from "@/lib/openapi";
import { GET } from "../route";

test("serves the spec as JSON, readable cross-origin", async () => {
  const res = GET();
  expect(res.status).toBe(200);
  expect(res.headers.get("content-type")).toBe(
    "application/json; charset=utf-8",
  );
  expect(res.headers.get("access-control-allow-origin")).toBe("*");
  expect(await res.json()).toEqual(JSON.parse(JSON.stringify(OPENAPI_SPEC)));
});
