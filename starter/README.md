# Starter kit

The smallest working version of the playbook, for a project that has never used it. The step by
step guide is at **[mahi9119.github.io/claude-code-playbook/start.html](https://mahi9119.github.io/claude-code-playbook/start.html)**.

Copy these into your project root, keeping the folders:

| File | What it does |
|------|--------------|
| `CLAUDE.md` | Rules Claude reads at the start of every session. Fill in the `<angle brackets>`. |
| `docs/lessons.md` | Your log of mistakes, with an index Claude sees every session. |
| `.claude/settings.json` | A session-start hook that runs `show-lessons.mjs`. |
| `scripts/show-lessons.mjs` | Prints the lessons index for the hook. |
| `scripts/check-no-debug-logs.mjs` | An example first guard. Fails if a `console.log` is left in `src/`. |

Then add one line to your `package.json` scripts, so every check runs with one command:

```json
"check": "node scripts/check-no-debug-logs.mjs"
```

Needs Node 18 or newer. When this feels too small, graduate to the full templates in
[`../templates`](../templates).
