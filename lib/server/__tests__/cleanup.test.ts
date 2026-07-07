import { describe, expect, it, mock } from "bun:test";
import type { RenderInput } from "@/lib/server/validate-input";

const mockRender = mock();

mock.module("@/lib/server/render", () => ({
  renderStarsVideo: mockRender,
}));

mock.module("node:fs/promises", () => ({
  mkdir: mock(() => Promise.resolve(undefined)),
}));

mock.module("server-only", () => ({}));

function makeInput(repo = "owner/repo"): RenderInput {
  return {
    repo,
    totalStars: 100,
    stargazers: [
      {
        login: "alice",
        avatarUrl: "https://avatars.githubusercontent.com/u/1",
        starredAt: "2021-01-01",
      },
    ],
    orientation: "horizontal",
    accentColor: "#ffbb00",
    speed: 1,
    theme: "light",
  };
}

const tick = () => new Promise<void>((r) => setTimeout(r, 0));

const { enqueueRender, getJob, listJobs } = await import(
  "@/lib/server/render-queue"
);
const { sweepOnce } = await import("@/lib/server/cleanup");

async function makeErrorJob(): Promise<string> {
  mockRender.mockRejectedValueOnce(new Error("Chromium crashed"));
  const jobId = enqueueRender(makeInput());
  await tick();
  await tick();
  return jobId;
}

describe("cleanup — sweepOnce registry eviction", () => {
  it("removes an error-status job older than the TTL", async () => {
    const jobId = await makeErrorJob();
    const job = listJobs().get(jobId)!;
    expect(job.status).toBe("error");

    job.createdAt = Date.now() - 700_000;

    await sweepOnce();

    expect(getJob(jobId)).toBeUndefined();
  });

  it("keeps an error-status job younger than the TTL", async () => {
    const jobId = await makeErrorJob();
    expect(listJobs().get(jobId)!.status).toBe("error");

    await sweepOnce();

    expect(getJob(jobId)).toBeDefined();
  });

  it("never evicts a rendering-status entry regardless of age", async () => {
    let releaseRender!: (v: string) => void;
    mockRender.mockImplementationOnce(
      () => new Promise<string>((resolve) => (releaseRender = resolve)),
    );

    const jobId = enqueueRender(makeInput());
    await tick();

    const job = listJobs().get(jobId)!;
    expect(job.status).toBe("rendering");
    job.createdAt = Date.now() - 10_000_000;

    await sweepOnce();

    expect(getJob(jobId)).toBeDefined();

    releaseRender("/tmp/out.mp4");
    await tick();
  });
});
