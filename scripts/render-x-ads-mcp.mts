import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const reference = process.argv
  .find((a) => a.startsWith("--reference-audio="))
  ?.slice(18);
const propsFile = process.argv.find((a) => a.startsWith("--props="));
const temp = mkdtempSync(path.join(tmpdir(), "remocn-x-ads-mcp-"));
const output = path.resolve("out/x-ads-mcp.mp4");
mkdirSync("out", { recursive: true });
const run = (command: string, args: string[]) => {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} exited with status ${result.status}`);
};
try {
  const picture = reference ? path.join(temp, "picture.mp4") : output;
  run("bunx", [
    "remotion",
    "render",
    "src/remotion/x-ads-mcp-root.tsx",
    "XAdsMcp",
    picture,
    "--codec=h264",
    "--crf=17",
    "--concurrency=4",
    ...(propsFile ? [propsFile] : []),
  ]);
  if (reference)
    run("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      picture,
      "-i",
      path.resolve(reference),
      "-map",
      "0:v:0",
      "-map",
      "1:a:0",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-af",
      "apad",
      "-t",
      String(2810 / 60),
      "-movflags",
      "+faststart",
      output,
    ]);
  console.log(`Rendered ${output}`);
} finally {
  // Remove only this invocation's private, generated temporary render directory.
  rmSync(temp, { recursive: true, force: true });
}
