#!/usr/bin/env node
/**
 * build-site.mjs - build the GitHub Pages site from site/index.html.
 *
 * site/index.html is a page fragment: everything before the <!--/head--> marker belongs
 * in <head>, everything after it in <body>. Each <!--svg:name--> marker is replaced
 * with assets/<name>.svg, inlined so the diagrams use the page's own color tokens and
 * follow its light/dark theme. Each SVG's <style> block is dropped (the page defines the
 * same tokens) and its ids are prefixed so several diagrams can share one page.
 *
 * Output:
 *   _site/index.html     full document, for GitHub Pages
 *   _site/fragment.html  the same page without the document wrapper
 *
 * Usage: node scripts/build-site.mjs
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "_site");

function inlineSvg(name) {
	let svg = readFileSync(join(ROOT, "assets", `${name}.svg`), "utf8");
	svg = svg.replace(/<\?xml[^>]*\?>\s*/, "").replace(/<style>[\s\S]*?<\/style>\s*/, "");
	svg = svg
		.replace(/\bid="([^"]+)"/g, `id="${name}-$1"`)
		.replace(/url\(#([^)]+)\)/g, `url(#${name}-$1)`)
		.replace(/aria-labelledby="([^"]+)"/, (_, ids) =>
			`aria-labelledby="${ids.split(/\s+/).map((id) => `${name}-${id}`).join(" ")}"`,
		);
	return svg.trim();
}

const source = readFileSync(join(ROOT, "site", "index.html"), "utf8");
const fragment = source.replace(/<!--svg:([a-z0-9-]+)-->/g, (_, name) => inlineSvg(name));

const marker = "<!--/head-->";
const at = fragment.indexOf(marker);
if (at === -1) {
	console.error("FAIL site/index.html has no <!--/head--> marker");
	process.exit(1);
}
const head = fragment.slice(0, at);
const body = fragment.slice(at + marker.length);

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head.trim()}
</head>
<body>
${body.trim()}
</body>
</html>
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "index.html"), page);
writeFileSync(join(OUT, "fragment.html"), fragment);
console.log(`OK   built _site/index.html (${page.length.toLocaleString()} bytes)`);
