# Adjudication and convergence

Review reports are input, not verdicts. The main session turns N reports into one executable conclusion.

## 1. Merge

Group duplicate reports by `file:line`, recording which reviewers raised each. Several models independently pointing at the same spot is a strong signal; a single-model finding is not downgraded for that, but needs harder verification.

Requirement-conformance items dedupe by requirement line, not by `file:line`; judgement-call smells dedupe by smell name plus location. Both stay out of the finding merge: they are separate axes, and merging them into the severity ranking is exactly the masking the axes exist to prevent.

## 2. Judge each finding

Verify every finding against the code and assign one of three states:

- `confirmed`: you can point at a trigger path in code. Write the trigger condition.
- `false-positive`: code or context does not support the claim. Write what the report got wrong (what it failed to read, what call it assumed that does not exist).
- `unproven`: cannot confirm or refute. Default to treating it as real unless you can give code-level grounds it cannot hold.

Bans: accepting a finding because it sounds like a problem, and dismissing one because you do not want to fix it. The basis is code, not the model's rhetoric.

In Heavy, second-round adjudication is done first by an isolated subagent that did not produce the finding (`assets/adjudication-prompt.md`); the main session re-checks on top, and contested items go to a subagent that sat out the round.

## 2.1 Admission filter (before judging)

Strip non-findings per `references/taste.md` section 1 first, then judge the rest. Meta-code problems (tests, guards, lint, scripts) cap at P2. Never read severity from a reviewer's tone.

## 3. Severity

- `P0`: data corruption, money or permission errors, production outage, security hole.
- `P1`: core-path functional error, a definite regression, a crash reachable by normal operation.
- `P2`: boundary errors, missing error handling, clear performance regression, test-coverage gaps.
- `P3`: maintainability, naming, duplicated code, non-blocking style.

## 4. Disposition

Only P0/P1 block delivery. P2/P3 do not: forcing them into the round stretches every task, and they batch fine.

- P0/P1: fix this round. If genuinely not fixed, the user must agree in this round, with the reason in the report.
- P2: fix this round only when directly tied to acceptance; the rest go to a backlog (listed in the report, not written into the repo) for the user to schedule.
- P3: listed, not fixed.

Fixes address confirmed problems only; no drive-by refactors along the report.

**Fix shape** per `references/taste.md` section 2: delete > narrow the predicate > swap implementation > add code. A single fix needing >30 new lines or a new abstraction: stop and ask whether the criterion itself is wrong. A guard or predicate patched a second time is a design error: delete it or change the principle. No third patch.

## 4.1 Saturation check (mandatory before each closeout)

Check the three stop signals per `references/taste.md` section 4: >50% of this round's findings point at code added last round, >50% point at meta-code, or two consecutive rounds with no new production-code P0/P1. Any hit: **review for this task ends here**. Remaining items compress to a one-line-each list for the user; no new rounds, no further edits against them.

Saturation is not process failure; it is the signal the process should end. More rounds trade the defect rate of fresh code against an already-low marginal gain.

## 5. Re-review

Re-review is expensive; spawn it only when needed:

- **Mandatory subagent re-review**: any P0, or any cross-module P1. Scope covers the fix diff and the paths the fix directly touches; do not re-review what this round already cleared.
- **No subagent**: a single-module P1 gets a main-session code-level re-check plus a regression test covering the path; green test closes it.
- Same strength as this round; Heavy may drop to High but must use a model that did not review this round, so no model endorses its own judgement.
- Re-reviews count against the round budget in `references/strengths.md`. Budget spent with open P0/P1: stop; give the user the open items, the evidence, and your judgement. The user chooses more rounds or accepts the risk. Never auto-extend.

## 5.1 Push forward

At closeout, for each confirmed P0/P1 do one or both:

- add a regression test so this class is caught by tests next time, not by review;
- or distill it into a one-line rule appended to the project's standing rules: `.harness/spec/standards.md` when the project carries `.harness/`, else the `CLAUDE.md` / `AGENTS.md` "recurring defects" list — read before development.

This is the only mechanism that makes the gate cheaper over time. If the same defect class surfaces every round, what needs fixing is the development-phase input, not more review. Three consecutive clean rounds: remove the entry.

## 6. Report format

Report to the user in this order; do not paste raw reports:

1. One-line verdict: strength, models involved, ship or not.
2. Requirement conformance: missing or partial requirements, unrequested behavior, suspect implementations, each quoted against the requirement. Ungraded, unmerged with findings; a delta here goes to the user for a decision, not to a severity.
3. Fixed: `[P?] one line - file:line`, plus a phrase on the fix.
4. Unfixed items and why (including anything the user must decide).
5. False positives: significant findings that did not hold, one line each on why; include items stripped by the admission filter, e.g. "add a guard" suggestions.
6. Judgement calls: the baseline smells, one line each, listed only.
7. Residual risk and uncovered ground: untested scenarios, anything needing an external environment to verify.
8. Path to raw reports.

Keep it short: one line per item, no quoted material, no echoing subagent phrasing. P2 backlog and P3 each compress to a single-line list.

**Honesty** (`references/taste.md` section 5): a lateral trade is reported as a trade, never "net upgrade / hardened". Banned descriptions of fix effect: "more robust", "safer", "hardened", "more complete". Write which input's behavior changed from what to what. When the round's meta-code growth exceeds budget, state the line counts.

When every report comes back empty and there is genuinely nothing: say "no findings from N models" and list each reviewer's top flagged risk. Do not invent findings to justify the process.
