import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const outRoot = path.join(root, "out", "21st");
const publishRoot = path.join(outRoot, "publish");
const resultsPath = path.join(outRoot, "results.json");

interface PublishResult {
  slug: string;
  status: "draft" | "failed";
  editor_url?: string;
  error?: string;
}

const CONCURRENCY = 3;

function loadResults(): Record<string, PublishResult> {
  if (!existsSync(resultsPath)) return {};
  return JSON.parse(readFileSync(resultsPath, "utf8"));
}

function saveResults(results: Record<string, PublishResult>) {
  writeFileSync(resultsPath, `${JSON.stringify(results, null, 2)}\n`);
}

function writeChecklist(results: Record<string, PublishResult>) {
  const drafts = Object.values(results).filter((r) => r.status === "draft");
  const failedList = Object.values(results).filter((r) => r.status === "failed");
  const lines = [
    "# 21st.dev CLI Review checklist",
    "",
    `Drafts: ${drafts.length} | Failed: ${failedList.length}`,
    "",
    ...drafts.map((r) => `- [ ] ${r.slug} — ${r.editor_url}`),
  ];
  if (failedList.length) {
    lines.push("", "## Failed", "", ...failedList.map((r) => `- ${r.slug}: ${r.error}`));
  }
  writeFileSync(path.join(outRoot, "checklist.md"), `${lines.join("\n")}\n`);
}

async function publishOne(slug: string): Promise<PublishResult> {
  const dir = path.join(publishRoot, slug);
  const meta = JSON.parse(readFileSync(path.join(dir, "meta.json"), "utf8"));
  const args = [
    "publish",
    `${slug}.tsx`,
    "--description",
    meta.description,
    "--demo",
    "demo.tsx",
    "--name",
    meta.name,
    "--slug",
    slug,
    "--tags",
    meta.tags.join(","),
    "--registry",
    "ui",
    "--no-open",
  ];
  if (existsSync(path.join(dir, "cover.png"))) {
    args.splice(2, 0, "--preview", "cover.png");
  }
  const proc = Bun.spawn(["21st", ...args], {
    cwd: dir,
    env: { ...process.env, CI: "1" },
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);
  const jsonLine = stdout
    .split("\n")
    .reverse()
    .find((l) => l.trim().startsWith("{"));
  if (jsonLine) {
    try {
      const parsed = JSON.parse(jsonLine);
      if (parsed.state === "draft" && parsed.editor_url) {
        return { slug, status: "draft", editor_url: parsed.editor_url };
      }
    } catch {}
  }
  const tail = `${stdout}\n${stderr}`.trim().split("\n").slice(-3).join(" | ").slice(0, 300);
  return { slug, status: "failed", error: `exit ${exitCode}: ${tail}` };
}

async function main() {
  const only = process.argv.includes("--only")
    ? process.argv[process.argv.indexOf("--only") + 1]?.split(",")
    : null;
  const results = loadResults();
  const all = readdirSync(publishRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  const queue = (only ?? all).filter((slug) => results[slug]?.status !== "draft");
  console.log(`publishing ${queue.length} components (of ${all.length})`);

  let index = 0;
  let done = 0;
  async function worker() {
    while (index < queue.length) {
      const slug = queue[index];
      index += 1;
      const result = await publishOne(slug);
      results[slug] = result;
      done += 1;
      saveResults(results);
      writeChecklist(results);
      console.log(
        `[${done}/${queue.length}] ${slug}: ${result.status}${result.status === "failed" ? ` (${result.error})` : ""}`,
      );
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const failedCount = Object.values(results).filter((r) => r.status === "failed").length;
  console.log(`done. drafts: ${Object.values(results).filter((r) => r.status === "draft").length}, failed: ${failedCount}`);
  console.log(`checklist: ${path.join(outRoot, "checklist.md")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
