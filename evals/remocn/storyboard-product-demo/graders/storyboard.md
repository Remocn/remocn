---
type: llm
weight: 2
---
PASS if the final reply presents a storyboard for a `product-demo` video and stops to ask the user to confirm or change it before any code is written, and all of these hold:
- each beat names its component in backticks (a remocn component, or a piece listed under Build new), and there is an `npx shadcn add @remocn/...` install line covering the remocn components;
- the content comes from the brief (real names, numbers or lines), not lorem or "Scene A";
- the planned total is between 810 and 990 frames at 30fps (the brief asks for about 30 seconds).
FAIL if there is no storyboard, if the archetype is clearly a different one, if the planned total is outside that range, or if the reply claims files were written.
