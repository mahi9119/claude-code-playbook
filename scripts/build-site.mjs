#!/usr/bin/env node
/**
 * build-site.mjs - build the GitHub Pages site from site/*.html.
 *
 * Each site/<page>.html is a page fragment: everything before the <!--/head--> marker belongs
 * in <head>, everything after it in <body>. Two markers are expanded:
 *
 *   <!--css:base-->    site/base.css, inlined as a <style> block, so every page shares one
 *                      stylesheet without a separate request
 *   <!--svg:name-->    assets/<name>.svg, inlined so the diagrams use the page's own color
 *                      tokens and follow its light/dark theme. Each SVG's <style> block is
 *                      dropped (the page defines the same tokens) and its ids are prefixed so
 *                      several diagrams can share one page.
 *
 * Output, per page:
 *   _site/<page>.html             full document, for GitHub Pages
 *   _site/<page>.fragment.html    the same page without the document wrapper
 *                                 (index's fragment keeps its original name, _site/fragment.html)
 *
 * Usage: node scripts/build-site.mjs
 */

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = join(ROOT, "site");
const OUT = join(ROOT, "_site");

const baseCss = readFileSync(join(SITE, "base.css"), "utf8").trim();

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

function build(file) {
	const name = file.replace(/\.html$/, "");
	const fragment = readFileSync(join(SITE, file), "utf8")
		.replace("<!--css:base-->", `<style>\n${baseCss}\n</style>`)
		.replace(/<!--svg:([a-z0-9-]+)-->/g, (_, svg) => inlineSvg(svg));

	const marker = "<!--/head-->";
	const at = fragment.indexOf(marker);
	if (at === -1) {
		console.error(`FAIL site/${file} has no <!--/head--> marker`);
		process.exit(1);
	}

	const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${fragment.slice(0, at).trim()}
</head>
<body>
${fragment.slice(at + marker.length).trim()}
</body>
</html>
`;

	writeFileSync(join(OUT, `${name}.html`), page);
	writeFileSync(join(OUT, name === "index" ? "fragment.html" : `${name}.fragment.html`), fragment);
	console.log(`OK   built _site/${name}.html (${page.length.toLocaleString()} bytes)`);
}

mkdirSync(OUT, { recursive: true });
for (const file of readdirSync(SITE).filter((f) => f.endsWith(".html")).sort()) build(file);
