# Strengths

The five tiers differ on: reviewer count, scope, whether the model can be swapped, second-round adjudication, and the **round budget**. All tiers use the current host's read-only native subagents; no external CLIs.

**The budget is a hard constraint.** Each tier caps rounds. Hitting the cap with open P0/P1 means stop and hand the decision to the user, never self-extend. Findings per reviewer are also capped: the point is compressing the main session's adjudication time, not compressing review depth.

## Self

**For**: ambiguous triggers, single module, test cover. No subagents.

The main session walks the diff against this checklist and answers each item in the delivery report:

1. Is the requirement actually met (read it against the acceptance criteria).
2. What do null / empty / out-of-range / double-submit inputs do to the new code.
3. Error paths: is state self-consistent on throw, timeout, external-call failure.
4. Did the change alter an existing path's behavior without you noticing.
5. Leftover debug code, hardcoded values, commented-out old logic.

Any item you cannot answer: escalate to Low, spawn a subagent.

**Budget**: 0 subagent rounds.

## Low

**For**: the default tier. Local change, clear blast radius.

- 1 isolated subagent. Gets the diff and the requirement, none of your development reasoning.
- Scope: **diff hunks plus their immediate context and direct callers**. No full-file read-through.
- Must check: requirement actually met, obvious logic errors, missing error handling, naming that clashes with existing style, leftover debug code.
- Does not re-run tests; trusts development-phase self-verification.
- Same-source acceptable: at Low's blast radius, isolation alone removes anchoring.
- Max 8 findings, **no P3s**.

**Budget**: 1 round. After a P0 fix, one light re-review of the fix diff only; P1s get a main-session code re-check, no extra subagent.

## Medium

**For**: cross-module, some regression surface.

- 1 isolated subagent, blank context. No self-review inside the session.
- Scope: diff plus relevant parts of touched files plus main callers. Full-file reads only when the change dominates the file.
- Must check: all of Low's, plus boundary conditions (null, empty, out-of-range, concurrent re-entry), error paths, backward compatibility, whether new dependencies earn their place.
- Main-session tests and build run **in parallel** with review and feed adjudication; do not finish them first.
- Swap the model if you can; else same-source isolation, declared in the conclusion.
- Max 10 findings, **no P3s**.

**Budget**: 1 round + at most 1 fix-diff re-review.

## High

**For**: core paths, data-structure changes, concurrency or transactions, external interfaces.

- 2 reviewers, parallel, blind to each other. Prefer different models; else two isolated same-source subagents, with `same-source isolation, no cross-vendor` in the conclusion.
- Scope: all of Medium's, plus affected data flow up/downstream, migration and rollback paths, whether existing tests cover the new behavior.
- Additional must-checks:
  - Concurrency and transactions: races, lock granularity, idempotency, state after partial failure.
  - Data: migration reversibility, empty tables and dirty data, index and query-plan shifts.
  - Interfaces: compatibility, error codes, timeout and retry semantics.
  - Security: authz and privilege escalation, input validation, injection, secrets leaking to logs.
  - Performance: new N+1s, full scans, unbounded memory growth.
- The main session runs the full test suite and lint in parallel with review; results feed adjudication.
- Convergence: merge both reports; conflicts settled by the main session reading code; unresolvable items get one targeted follow-up question.
- Max 12 findings, P3s as a single line, unexpanded.

**Budget**: 2 rounds (first pass + fix re-review).

## Heavy

**For**: production data migration, money or permissions, irreversible operations, large-scale refactor.

- **>= 3 reviewers**, parallel, isolated, each forming conclusions independently. Cross vendor/model where possible; if the host cannot, still run 3 isolated subagents and the conclusion must say `same-source isolation, no cross-vendor`. Never claim a cross-vendor Heavy.
- Highest reasoning tier the host offers.
- Each reviewer must name at least one most-likely failure scenario and rank risks even with no confirmed defect. A bare "looks fine" is not an acceptable report.
- Scope: all of High's, plus deploy ordering, rollout and rollback plans, whether monitoring and alerts would catch a failure this change causes, data consistency at failure breakpoints.
- **Second-round cross-adjudication (Heavy only)**: after merging all findings, an isolated subagent that **did not produce the finding** rules each confirmed / false-positive / unproven (`assets/adjudication-prompt.md`). Where two subagents disagree, swap models for the decider if possible; still unresolved, the main session reads code, rules finally, and marks the item disputed.
- Convergence bar: every confirmed P0/P1 must be fixed; every unproven P0/P1 needs a code-level "why it cannot happen" from the main session. "Could not reproduce" does not count.
- Re-review after fixes is mandatory, minimum High, and must use a subagent that sat out this round.

**Budget**: 2 rounds + 1 adjudication. Over budget with open P0/P1: the user decides.

## Tier table

| | Reviewers | Scope | Model swap | Re-verify | 2nd-round adjudication | Round budget |
| --- | --- | --- | --- | --- | --- | --- |
| Self | 0 (main session) | diff | n/a | no | no | 0 |
| Low | 1 (isolated) | diff + direct callers | optional | no | no | 1 |
| Medium | 1 (isolated) | + relevant files, main callers | swap if possible | parallel | no | 1 + 1 re-review |
| High | 2 (mutually blind) | + data flow, rollback paths | swap if possible | parallel (full) | conflicts ruled by main session | 2 |
| Heavy | >=3 (mutually blind) | + deploy, monitoring, consistency | cross-vendor if possible, else declared | parallel (full) | yes (a subagent that sat out) | 2 + adjudication |
