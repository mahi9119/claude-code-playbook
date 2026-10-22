# Incident stories

Twelve real incidents from building a production financial platform with Claude Code, and what
each one changed. They were picked from 80 logged lessons because they generalize: none of them is
specific to one product or industry.

Each story follows the same shape: what happened, why, the rule now, and the guard. A guard is a
test, script or hook that fails when the mistake is repeated. Where no guard is possible, the story
says so.

## SUMMARY

| # | Story | Class | Guard |
|---|-------|-------|-------|
| S-01 | [The checklist that could not be checked](#s-01-the-checklist-that-could-not-be-checked) | Planning | Plan-drift guard blocks the ship |
| S-02 | [Merged is not migrated](#s-02-merged-is-not-migrated) | Release | Test pins the release script's migration trigger |
| S-03 | [A fifth of the suite never ran](#s-03-a-fifth-of-the-suite-never-ran) | Testing | `judgment`; a database-required CI job is the planned guard |
| S-04 | [The test that could not fail](#s-04-the-test-that-could-not-fail) | Testing | Wrong implementations kept in the test file |
| S-05 | [A coverage check that could not see join tables](#s-05-a-coverage-check-that-could-not-see-join-tables) | Security | Guard defines its population by foreign key |
| S-06 | [The exemption nobody tested](#s-06-the-exemption-nobody-tested) | Guards | Exemption narrowed, proven red on the real bug |
| S-07 | [Convergence without a guard decays](#s-07-convergence-without-a-guard-decays) | Consistency | Guard per converged pattern, same commit |
| S-08 | [The rename that compiled clean](#s-08-the-rename-that-compiled-clean) | State machines | Compare-and-swap literal guard |
| S-09 | [Archiving deleted data it never mentioned](#s-09-archiving-deleted-data-it-never-mentioned) | Data safety | Dependents declared in the archive registry |
| S-10 | [Two approved decisions that contradicted each other](#s-10-two-approved-decisions-that-contradicted-each-other) | Planning | `judgment` |
| S-11 | ["A subagent did it"](#s-11-a-subagent-did-it) | Agent operations | List live sessions before attributing a change |
| S-12 | [Measure reach, never infer it](#s-12-measure-reach-never-infer-it) | Communication | `judgment` |

Guard coverage: 8 of 12 have a mechanical guard, 1 has a mechanical first step, 3 are `judgment`.

---

# DETAIL

## S-01 The checklist that could not be checked

**What happened.** A plan specified a UI change to a progress stepper. An approved mockup was
drawn. The phase shipped and was marked complete, and the stepper was never touched. The plan's own
verification list named the exact deliverable as item 10. Nobody noticed for weeks, until a
screenshot showed the old stepper.

**Why.** The verification section was a numbered prose list. It had no state, so no person and no
script could tell which items were done. The mockup also lived in a different plan file from the
build, with nothing linking them. At the time, 0 of 58 plan files used checkboxes.

**The rule now.** Verification items are checkboxes. A phase cannot be marked complete with an
unticked box: tick it with evidence, or mark it `[~]` with a written reason. Every plan that ships
code has a critical-files table and links the mockup it implements.

**Guard.** [`guards/check-plan-drift.mjs`](../guards/check-plan-drift.mjs), blocking inside
preflight and the release script. It also fails on any mockup no plan references.

## S-02 Merged is not migrated

**What happened.** Row-level security policies for six tables were written as a migration, merged,
and marked fixed. CI was green. Dev was correct. Production was never migrated, and for two days
those tables ran without their security policies. The platform was pre-launch at the time.

**Why.** The release script decided whether to run the production migration by checking if the
schema definition file had changed. Security policies cannot be expressed in the schema builder, so
they live in hand-written migration files. Those matched none of the trigger paths, and the script
printed "no schema change" and moved on. Every signal a human would look at said "shipped".

**The rule now.** A migration reaching `main` and reaching production are separate events. Verify
production by querying its schema, never by trusting the ledger or the tracker.

**Guard.** A test that pins the release script's trigger: any staged migration file sets the
production-migrate flag. It was proven by restoring the old script and watching three of four
cases go red. Two read-only auditors now compare dev and production security state directly.

## S-03 A fifth of the suite never ran

**What happened.** 51 of 226 test files were gated on a database connection string and skipped on
every run. About 336 tests had never executed once. When the database was finally loaded, two real
defects appeared that had been invisible for weeks.

**Why.** Loading the env file with `source` fails without any error in Git Bash on Windows. The
suite ran, skipped silently, and reported green. One file was worse: its skip condition checked
two of the seven credentials it needed, so partial credentials made it crash in setup, which read
like a product bug.

**The rule now.** A skipped test is not a passing test. Always report pass, skip and fail counts
separately, and treat a skip on the item you are verifying as unverified.

**Guard.** `judgment` for now. A per-file static scan was built and then deleted: the credential
requirement is inherited through imported modules, so the test file's own text never shows it. The
guard that would work is a CI job that runs with the database and asserts zero skips.

## S-04 The test that could not fail

**What happened.** A plan's invariant table had a row meant to prove a rounding-residue rule fired.
At the chosen contract value, the residue rule and the plain proportional formula both produced
exactly the same number, so the assertion could never fail. Two more rows had the same defect the
same night. All three read as rigorous.

**Why.** Round numbers and symmetric splits (50/50, equal thirds) make different formulas
coincide. Reading a row cannot tell you whether it discriminates. Only running a wrong
implementation against it can.

**The rule now.** For every invariant row, name the wrong implementation it is supposed to kill,
and prove it does. When claiming "X discriminates", name the exact input set and why it is enough.

**Guard.** The wrong implementations live permanently in the test file, in a block that asserts
they produce the wrong answer on the rows meant to catch them. The falsifiability claim re-runs on
every test run instead of being checked once.

## S-05 A coverage check that could not see join tables

**What happened.** A monthly security audit checked "every table with a tenant id column has
row-level security". It came back clean. Three join tables had no tenant id of their own (they were
scoped through a parent foreign key) and had no security policy at all.

**Why.** A guard whose population is defined by a column name can only ever see tables that carry
that column. It will keep reporting green for as long as it exists.

**The rule now.** Define a coverage guard's population by relationship, not by naming convention.

**Guard.** A second test case: every table with a foreign key into a tenant-scoped table must have
row-level security enabled and forced. Proven against the pre-fix state: it named exactly the
three tables, plus two more.

## S-06 The exemption nobody tested

**What happened.** A production deploy broke every server action on one page with a
`ReferenceError` at module load. A guard for exactly this class of bug already existed and scanned
every relevant file.

**Why.** The guard carried a blanket skip for `export type` lines, written from the reasonable
premise that type exports compile away. True for most forms, false for the one that leaves a
dangling runtime reference. The guard's main rule had been proven red. Its exemption had never been
tested against anything. A page-load smoke test also passed, because it only issued GET requests,
and the actions live in a separate chunk that a page render never evaluates.

**The rule now.** An exemption inside a guard is untested code, and it is where the next bug lives.
Prove every new guard red on the pre-fix code, including its skip branches.

**Guard.** The exemption was narrowed to the forms that are actually safe, and the guard was
verified red on the real broken file and green after the fix.

## S-07 Convergence without a guard decays

**What happened.** One phase moved every async button onto a shared loading component. No guard
was added. A later audit found 71 files had drifted back to the old pattern. The same audit found
103 success toasts firing before their data refresh had finished.

**Why.** Convergence work buys one clean snapshot. After that, it decays at the rate new code is
written, because every new call site is written by someone, or something, copying the nearest
example.

**The rule now.** A shared component is not a contract until something fails when it is bypassed.
Convergence ships with its guard in the same commit, or it is not done.

**Guard.** One guard test per converged pattern (button loading state, toast after refresh, page
loading skeleton, breadcrumb, help coverage).

## S-08 The rename that compiled clean

**What happened.** A status rename shipped eight bugs at once. Buttons disappeared, transitions
failed, and some updates silently changed nothing.

**Why.** Update statements compared against hardcoded status strings:
`WHERE status = 'preparing'`. After the rename, `'preparing'` was still a valid value of the enum,
so the type checker was happy. The update just matched zero rows, and nothing checked the row count.

**The rule now.** A compare-and-swap compares against the value you read: `WHERE status =
before.status`. Check the affected row count and return a conflict when it is zero. Every status
change runs a written checklist across transition maps, UI action maps, labels and badges.

**Guard.** A test that parses every update chain in the money module and fails on a hardcoded
status literal. It also proves its own parse is complete: the number of chains found must equal
the number of `.update(` calls.

## S-09 Archiving deleted data it never mentioned

**What happened.** A housekeeping feature promised it never destroys data: it copies rows to cold
storage before removing them. It did exactly that for the four tables it knew about. But one of
those tables had a cascading foreign key from a feedback table, so archiving a chat message
silently deleted its feedback rows with no copy anywhere.

**Why.** The archive code was correct about every row it could see. The loss happened in a table
it had never heard of.

**The rule now.** Any feature that deletes rows (archiving, purging, erasure, offboarding) must
enumerate inbound foreign keys to its targets, not just its own columns.

**Guard.** The archive registry has a `dependents` field, so a cascade is a declared property of
each entry. A test asserts the dependent rows are copied before the parent delete.

## S-10 Two approved decisions that contradicted each other

**What happened.** A plan carried "production never hard-deletes, any table" and "the answer cache
hard-deletes in production". Both were marked decided, in the same sitting. The code implemented
the first as a blanket environment check, which made the second unreachable and turned one
misconfigured row into a run-wide abort.

**Why.** Each decision reads fine alone. The conflict only exists in the pair. The deeper error was
an absolute rule where the domain already has a standard shape: classify data first (compliance,
operational, regenerable), then apply a treatment per class.

**The rule now.** When a plan has more than about five decisions, check them against each other.
Treat "never X" or "always X" as a smell when a later decision names an exception.

**Guard.** `judgment`. No script reads a plan for self-contradiction. The data-class matrix is now
pinned by a test, and one shared helper is the only place the rule is evaluated.

## S-11 "A subagent did it"

**What happened.** After a read-only audit subagent returned, Claude found modified files in the
tree. It reasoned: the tree was clean at the start, the main session edited nothing, so the
subagent did it. It reported to us that the subagent had read a production env file without
permission and written to the production database. All of it was wrong. A second Claude session
was working in the same folder, and we had run the production migration ourselves.

**Why.** Absence of evidence was treated as evidence of absence. The one command that would have
refuted the claim was never run.

**The rule now.** Before attributing any unexplained change, name the actors you have ruled out and
how. When the claim is misconduct by a person or an agent, state it as a hypothesis with its
disconfirming test, not as a finding.

**Guard.** Mechanical first step: list live agent sessions, and compare `git log -1` against the
session-start commit. A moved head proves another actor is live. The reasoning discipline itself
is `judgment`.

## S-12 Measure reach, never infer it

**What happened.** A change edited two files but changed a design token, silently restyling 176
usages across 81 files. It was described to the owner as a small fix. Another change edited a
shared component and was described as fixing something "everywhere". It reached 14 files, while
about 50 hand-rolled copies kept the old behavior.

**Why.** Both claims came from reasoning about the mechanism ("it's the shared token", "it's the
shared component") without running a single search. Editing a token maximizes reach. Editing a
component only reaches its callers.

**The rule now.** Never say "everywhere", "platform-wide" or "automatically" without stating the
count and the command that produced it.

**Guard.** `judgment`. It is a reporting discipline, enforced by habit and by review.
