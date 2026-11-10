import { corpusResponse } from "@/lib/llms-corpus";
import { source } from "@/source";

export const revalidate = false;

// llms-full.txt — every doc page concatenated as Markdown, for LLMs that want
// the entire corpus in one request. It runs to megabytes; llms.txt points
// agents at the per-section files in app/llms-full/[file] instead.
export function GET() {
  return corpusResponse(source.getPages());
}
