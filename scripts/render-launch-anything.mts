import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const reference = process.argv
  .find((arg) => arg.startsWith("--reference-audio="))
  ?.slice("--reference-audio=".length);
const propsFile = process.argv.find((arg) => arg.startsWith("--props="));
const temp = mkdtempSync(path.join(tmpdir(), "remocn-launch-anything-"));
const output = path.resolve("out/launch-anything.mp4");
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
    "src/remotion/launch-anything-root.tsx",
    "LaunchAnything",
    picture,
    "--codec=h264",
    "--crf=17",
    "--concurrency=4",
    "--gl=swangle",
    ...(propsFile ? [propsFile] : []),
  ]);
  if (reference) {
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
      String(1600 / 60),
      "-movflags",
      "+faststart",
      output,
    ]);
  }
  console.log(`Rendered ${output}`);
} finally {
  // Only remove the private directory created by this invocation.
  rmSync(temp, { recursive: true, force: true });
}
