---
name: review
description: "Code review gate, off by default. Ask once before changes that are complex or high-risk: multi-file cross-module work, new modules, public interfaces, data structures, or anything touching auth, payments, permissions, concurrency, migrations, or deploys. Offer a recommended strength (Self/Low/Medium/High/Heavy). Only after explicit approval, run adversarial review with the current host's isolated native subagents, inside a round budget. No answer, a vague answer, or refusal all mean ship without review. Also runs when the user asks for a review outright."
metadata:
  short-description: Ask once whether to review important changes; on approval, adversarial review by isolated native subagents with a round budget
---

# Review

**Default: no review.** It runs in exactly two cases: the user asks for it, or the change is complex enough that you asked once per section 1 and the user approved.

After asking: no answer, a vague answer, or "no" all mean **ship without review**. Do not ask again, do not run a quiet "light" version, do not hint in the delivery that a review is still owed.

Once approved, run the loop below with the current host's **native isolated subagents**. No `omp -p`, no review scripts, no calling another product's CLI to reach a different vendor.

**Review is a costed process, not a free good.** Four hard constraints, ranked equal with safety:

1. **Budgeted.** Each strength has a round cap (`references/strengths.md`). Hit the cap with open P0/P1 and stop: hand the decision to the user, never add rounds yourself.
2. **Parallel.** Review subagents run alongside the main session's remaining development, tests, and builds. "Wait for review, then work" is forbidden.
3. **Push detection forward.** Every confirmed P0/P1 becomes a regression test or a rule (section 5). If the same defect class keeps surfacing in review, the fix belongs in development, not in more review.
4. **No self-feeding.** The gate's output is fewer production defects, not more guards. Reviewers report only defects reachable under production behavior; problems in meta-code (tests, guards, lint, scripts) cap at P2; fixes default to subtraction. The judgement rules and the saturation check live in `references/taste.md`; run the saturation check before every closeout.

## 1. When to ask once

Ask "want a review?" only in the cases below. Everything else: finish and ship.

### Worth asking regardless of size

Any high-risk surface, even a one-line change: auth, payments and billing, permissions and visibility scopes, concurrency and transactions, cache coherence, data migration/backfill/deletion, scheduled jobs, deploy/release, compatibility of external interfaces.

### Worth asking by size

- >= 3 files **and** cross-module (multi-file inside one module does not count), or >= 150 effective lines in one file.
- New module, public interface, database table/field, migration, dependency.
- Changing the behavior of an existing core path.

### Do not ask

Copy, style, and display-layer tweaks; logs and comments; typos; read-only questions; tests and scaffolding; config that touches no permissions or secrets; purely additive branches that leave existing paths alone; small intra-module changes with test cover.

**Ambiguous means do not ask.** Rather skip than run process for its own sake; never raise the tier because you are unsure.

## 2. How to ask, how to set the tier

When section 1 hits, ask once before starting. Once. Options: no review / Self / Low / Medium / High / Heavy, with your recommendation marked.

| Change | Recommend |
| --- | --- |
| Ambiguous trigger, single module, test cover | Self (main session walks the checklist, no subagents) |
| Local feature, clear blast radius | Low |
| Cross-module, some regression surface | Medium |
| Core path, data-structure change, concurrency or transactions, external interface | High |
| Production data migration, money or permissions, irreversible ops, large refactor | Heavy |

**The default is no review.** Silence, vagueness, or refusal all mean skip, and the delivery does not get a "consider a follow-up review" note.

If the user names a tier, run it as named: no re-asking, no quiet downgrade. If scope clearly grows mid-work (a table change appears, say), say so on the spot and ask once about raising the tier. Again: ask, do not decide.

## 3. During development: shard and parallelize, do not bank it for the end

Applies only to approved reviews. When a change splits into independently freezable units (backend API vs frontend wiring, or per module), **spawn a background subagent on each unit the moment it lands and keep building the next one**. Review latency gets absorbed by development time instead of stacking in front of delivery.

- Each shard gets the per-shard reviewer quota of the chosen tier, not the full quota N times.
- After all shards, run one closeout review over only the **cross-shard seams**: shared state, call order, transaction boundaries, type contracts. Shard internals are not re-reviewed.
- Only an unsplittable change (one atomic refactor) gets a single end-of-work review.

## 4. After development: review with native subagents

Preconditions: **the user approved review**; self-verification passes; the diff is final. Bringing known failures to review wastes a round.

1. **Prepare the packet**: change scope, original requirement, acceptance criteria, the weak points you already know. The weak points must be handed over.
2. **Freeze the diff**: the main session takes one snapshot (rules in `references/reviewers.md`). Every reviewer reads the same snapshot, untracked new files included.
3. **Fill the prompt**: use `assets/review-prompt.md`, replace the `{{...}}` by hand, no scripts.
4. **Spawn at the chosen strength**: reviewer count, must-checks, and round cap in `references/strengths.md`; dispatch per `references/reviewers.md`. One parallel batch; subagents cannot see each other.
5. **Verify in parallel**: while reviewers run, the main session runs tests/build/lint. Do not finish verification first.
6. **Collect**: every report must contain `## Requirement conformance` and `## Could not verify`; missing either is invalid. Take `git status --porcelain` before and after review; a difference is an alert.

All judgement stays in the main session: whether to trigger, the tier, finding truth, severity, adjudication, the report to the user. Subagents only write reports.

Host has no isolated subagents: stop and tell the user. Do not self-review, do not call omp.

## 5. Converge and push forward

Do not relay reports verbatim. Admission-filter per `references/taste.md` section 1, then per `references/triage.md` judge each finding, grade P0-P3, fix.

Hard closeout rules:

- **Stop at saturation**: >50% of this round's findings point at code added last round, or >50% point at meta-code, or two consecutive rounds with no new production-code P0/P1. Any one ends review for this task: leftovers become a list for the user, no more rounds.
- **Fixes subtract**: delete > narrow the predicate > swap implementation > add code. A single fix needing >30 new lines or a new abstraction means stop and question the finding. A guard patched twice is a design error: delete it or change the principle, no third patch.
- **A lateral trade is not an upgrade**: a fix that swaps defect class A for class B is reported as a trade. Banned words: "more robust", "hardened", "more complete".

- With unfixed P0/P1 the user has not agreed to accept, never claim "done".
- **P2/P3 do not block**: P2 is fixed this round only when directly tied to acceptance, else it goes to a backlog listed for the user; P3 is listed, not fixed.
- When a report contradicts the code, the code wins. Flag the false positive in the report rather than accepting it to make review look effective.
- Mandatory re-review only after a P0 or a cross-module P1, scoped to the fix diff; other P1s get a main-session code-level re-check plus a regression test, no new subagent round.
- **Round cap hit with open P0/P1**: stop. Give the user the open items, the evidence, and your judgement; the user decides more rounds or acceptance.

**Push forward (what makes the gate cheaper over time; not optional)**: for each confirmed P0/P1, do one or both:

- add a regression test so this class is caught by tests next time, not by review;
- or distill it into a one-line rule appended to the project's standing rules: `.harness/spec/standards.md` when the project carries `.harness/`, else the `CLAUDE.md` / `AGENTS.md` "recurring defects" list — read before development.

Three consecutive rounds without the class recurring: remove it from the list.

## 6. Boundaries

- **No review without explicit user approval**, including "spinning up a quick subagent to take a look".
- Reviewer subagents are read-only: no edits, commits, pushes, or dependency installs. Fixes happen in the main session.
- Findings cover only what this change introduced. Pre-existing issues get reported, not fixed in passing.
- A failed subagent: log the reason, continue with the remaining reports.
- Cross-vendor is not a precondition. If the host can pick different models or vendors, do; if not, run multiple isolated same-source subagents and write "same-source isolation, no cross-vendor" in the conclusion. Never call other CLIs to reach a vendor.
- Review output is not written to the repo, does not enter commit messages, and carries no model or tool attribution.
