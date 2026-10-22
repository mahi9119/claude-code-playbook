#!/usr/bin/env node
// SessionStart hook: print the lessons index so Claude reads it at the start of every session.
// Whatever this prints becomes context for the session. It always exits 0: a hook that fails
// is a hook that gets switched off.

import { readFileSync } from "node:fs";

let text;
try {
	text = readFileSync("docs/lessons.md", "utf8");
} catch {
	process.exit(0); // no lessons file yet: nothing to show
}

const start = text.indexOf("<!-- LESSONS-INDEX-START -->");
const end = text.indexOf("<!-- LESSONS-INDEX-END -->");
if (start === -1 || end === -1) process.exit(0);

console.log("LESSONS FROM PAST MISTAKES (docs/lessons.md). If a row matches today's task, read the full entry first:");
console.log(text.slice(start, end).replace("<!-- LESSONS-INDEX-START -->", "").trim());
