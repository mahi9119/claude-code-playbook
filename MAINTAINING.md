# Maintaining this repo

Notes for whoever updates this playbook later: the decisions behind it, the content rules every
change must pass, and how to refresh the numbers and the site.

## SUMMARY

| ID | Decision | Date |
|----|----------|------|
| D-01 | The playbook shares the method, never the product: no product or company name, the product is "a multi-tenant B2B SaaS" | 2026-10-22 |
| D-02 | Voice is "we" / "the team", never "solo engineer" | 2026-10-22 |
| D-03 | MIT license: anyone may reuse it, credit stays with the authors, no warranty | 2026-10-22 |
| D-04 | Created private, made public the same day after review | 2026-10-22 |
| D-05 | Commits use the GitHub no-reply email, set in repo-local git config | 2026-10-22 |
| D-06 | No AI co-author trailers in commit messages | 2026-10-22 |
| D-07 | Site is built and deployed by GitHub Actions; the job skips itself while the repo is private | 2026-10-22 |
| D-08 | Every number is a dated snapshot, re-measured from the source repo, never copied from another doc | 2026-10-22 |
| D-09 | @PavanKranthi is a collaborator with write access, not credited in the README for now | 2026-10-22 |

---

# DETAIL

## D-01 Method, not product

The value of this repo is how the work was governed, not what was built. Naming the product adds
nothing for a reader and gives away who the company is. Describe it only as a multi-tenant B2B SaaS
for billing, contracts and compliance.

## D-02 Team voice

Write "we" and "the team". Do not describe the work as solo.

## D-03 MIT license

Anyone can use, copy, change and share the contents, including commercially, as long as they keep
the copyright and license notice. We give no warranty. This fits the goal: the playbook spreads,
and the credit stays with us.

## D-04 Private first, then public

The repo was reviewed privately (wording, product name removed, sanitisation scan) before it was
made public.

## D-05 No-reply commit email

```bash
git config user.name "Mahendar Mali"
git config user.email "17956727+mahi9119@users.noreply.github.com"
```

Commits still link to the GitHub profile and count on the contribution graph. A personal email in
public commit history gets scraped for spam and adds nothing. Contributors should use their own
no-reply address, from GitHub Settings, under Emails.

## D-06 No AI trailers

Commit messages carry a subject and body only. No "Co-Authored-By" lines and no "generated with"
footers.

## D-07 Site deployment

- Source: every `site/*.html` is a page fragment (`index.html` is the playbook, `start.html` the
  beginner guide). Shared styles live once in `site/base.css`; the diagrams live in `assets/*.svg`.
- Build: `node scripts/build-site.mjs` writes `_site/<page>.html`. It inlines `base.css` and the
  diagrams, so the diagrams follow the page's light and dark theme. `_site/` is gitignored.
- The beginner guide walks through `starter/`. If a starter file changes, check the guide's copy
  commands and code snippets still match it.
- Deploy: `.github/workflows/pages.yml` runs on pushes to `main` that touch `site/`, `assets/`, the
  build script or the workflow, and on manual dispatch:

```bash
gh workflow run "Publish site" -R mahi9119/claude-code-playbook
```

- Repo setting: Settings, then Pages, then Source: GitHub Actions.
- The job has `if: !github.event.repository.private`. Pages needs a public repo on the free plan,
  so the job skips instead of failing if the repo is ever made private again.
- Live at https://mahi9119.github.io/claude-code-playbook/

## D-08 Refreshing the numbers

The numbers appear in four places. Update all four together, and update the "measured on" date:

| Where | What |
|-------|------|
| `README.md` | "The numbers" table and its date line |
| `site/index.html` | The stats row and the note under it |
| `assets/cover.svg` | Four stats under the title |
| `assets/the-loop.svg` | "46 of 80 lessons" in the footer line |

Run these in the source product repo:

```bash
git rev-list --count HEAD
```

```bash
git ls-files src | grep -E '\.tsx?$' | xargs wc -l | grep -E 'total$' | awk '{s+=$1} END {print s}'
```

```bash
git ls-files tests | grep -E '\.tsx?$' | xargs wc -l | grep -E 'total$' | awk '{s+=$1} END {print s}'
```

**Trap:** do not end the line-count commands with `| tail -1`. `xargs` splits the file list into
batches and `wc` prints one total per batch, so `tail -1` keeps only the last batch and undercounts
by about four times. Always sum the batch totals with `awk`, as above.

Migrations, phases, bugs, lessons, decision records and guard tests come from counting files or
tracker rows in the source repo. Never copy a number from an older document.

## D-09 Contributors

@PavanKranthi has write access. He appears under Contributors on GitHub once he pushes a commit.
The README's About line credits Mahendar Mali only, for now.

---

# Content rules for every change

Run this scan before every commit. It should print nothing:

```bash
grep -rniE "<product name>|<company domain>|<client names>|<private email domains>|<db host pattern>|sk-ant" --exclude-dir=.git --exclude-dir=_site .
```

Keep the real search terms in the maintainer's private notes, not here. Writing them here would
publish the very names the scan is meant to keep out.

Never add:

- Product, company, client or team member names (except credit lines the person agreed to).
- Emails, database hosts, API keys, internal file paths or table names.
- Details of security gaps or known defects that are still open in the source product.
- Raw copies of the source repo's lessons log, decision records or bug tracker. Rewrite each
  incident generically, as in `stories/README.md`.
- Em-dashes. Use a plain hyphen or rewrite the sentence.

Also check:

- Markdown tables stay aligned: `node guards/check-doc-tables.mjs README.md stories/README.md MAINTAINING.md`
  (ignore "no summary heading" on non-tracking docs; alignment must pass).
- The site builds: `node scripts/build-site.mjs`.

---

# Getting it seen

Traction does not come on its own. It comes from a launch moment:

- [ ] LinkedIn post on launch day, linking the live site
- [ ] "Show HN" post on Hacker News
- [ ] Post in r/ClaudeAI and Claude Code community spaces
- [ ] Pull requests adding the repo to "awesome Claude Code" lists
- [ ] Repo topics set on GitHub: claude-code, ai-agents, developer-tools, engineering-practices
