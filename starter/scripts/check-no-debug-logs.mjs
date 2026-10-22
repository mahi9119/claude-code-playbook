#!/usr/bin/env node
// Guard: fail if a debug console.log is left in the source folder.
//
// This is an example of a "first guard": one mistake, one check, and it fails loudly.
// Change the three settings below to fit your project, or copy the shape for a different
// mistake. Run it from the project root: node scripts/check-no-debug-logs.mjs

import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const SOURCE_DIR = "src";
const EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
const PATTERN = /\bconsole\.log\(/;
const ALLOW = "allow-console"; // put this in a comment on a line you mean to keep

function walk(dir) {
	const files = [];
	for (const name of readdirSync(dir)) {
		if (name === "node_modules" || name.startsWith(".")) continue;
		const path = join(dir, name);
		if (statSync(path).isDirectory()) files.push(...walk(path));
		else if (EXTENSIONS.has(extname(name))) files.push(path);
	}
	return files;
}

let files;
try {
	files = walk(SOURCE_DIR);
} catch {
	console.log(`note  no ${SOURCE_DIR}/ folder found, nothing to check`);
	process.exit(0);
}

const hits = [];
for (const file of files) {
	readFileSync(file, "utf8")
		.split(/\r?\n/)
		.forEach((line, i) => {
			const code = line.trim();
			if (code.startsWith("//") || code.includes(ALLOW)) return;
			if (PATTERN.test(code)) hits.push(`${file}:${i + 1}  ${code}`);
		});
}

if (hits.length === 0) {
	console.log(`OK    no debug logs in ${files.length} file${files.length === 1 ? "" : "s"}`);
	process.exit(0);
}
for (const hit of hits) console.log(`FAIL  ${hit}`);
console.log(`\n${hits.length} debug log${hits.length === 1 ? "" : "s"} found. Remove, or mark with // ${ALLOW}.`);
process.exit(1);
