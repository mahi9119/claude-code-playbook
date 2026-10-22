// PreToolUse hook: stop the agent from running git add / commit / push directly.
//
// Every commit goes through the project's release script, which formats, runs preflight,
// bumps the version, migrates, commits and pushes in that order. This hook only fires on the
// agent's own Bash/PowerShell tool calls; the release script run from a human terminal is
// unaffected.
//
// Exit 2 = block (stderr is shown to the agent). Exit 0 = allow.

const SHIP_COMMAND = 'bash scripts/ship.sh <type> "<description>"';

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
	raw += chunk;
});
process.stdin.on("end", () => {
	let command = "";
	try {
		command = JSON.parse(raw)?.tool_input?.command ?? "";
	} catch {
		process.exit(0); // unparseable input: never block on a hook bug
	}

	// git [global opts like -C <path> / -c k=v] add|commit|push
	const gitWrite = /\bgit(\s+(-C\s+\S+|-c\s+\S+|--\S+))*\s+(add|commit|push)\b/;
	if (gitWrite.test(command)) {
		process.stderr.write(
			"BLOCKED: do not run git add/commit/push directly. " +
				`Hand the user the one-line release command instead: ${SHIP_COMMAND}\n`,
		);
		process.exit(2);
	}
	process.exit(0);
});
