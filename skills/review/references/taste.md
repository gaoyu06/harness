# Taste and convergence

The gate's most common failure mode is not missed defects, it is **self-feeding**: review says "not enough defense here", the fix adds a guard, next round finds a hole in the guard, another layer goes on. Every round produces "real findings", but the findings migrate into meta-code while product risk stops falling. New code has a roughly constant defect rate, so as long as each round produces non-trivial new code the loop does not converge. It is not approaching zero; it is spinning in place.

The rules here bind **reviewers and the main session** equally, and rank equal with safety.

## 1. What does not count as a finding

Reviewers report only defects reachable under **production behavior**. The following are not reported, or are capped:

| Type | Disposition |
| --- | --- |
| "add validation / assertion / defense" with no concrete currently-reachable input | not reported |
| "if someone later writes X, Y happens" (the trigger needs someone to write new code) | not reported; that is a threat model, not a defect |
| "no test covers X" as a standalone item | not reported, unless X is a P0/P1 path introduced by this change |
| a guard / lint rule / script has a bypass | P3 max, one line |
| comments, naming, doc wording | not reported |
| anything tooling already enforces (lint, formatter, typecheck) | not reported |
| baseline smells (the Fowler list in `assets/review-prompt.md`) | not findings; go to the `## Code quality (judgement calls)` section, max 5, listed only, never blocking |
| defects in meta-code itself (tests, guards, lint, scaffolding, CI scripts) | **capped at P2**, one line, never blocks delivery |

When meta-code breaks, the consequence is "guard capability regresses", not "the product breaks". Treating it as P0/P1 is fuel for the loop above.

## 2. The shape of a fix

Fix priority, top to bottom: **delete > narrow the predicate > swap the implementation > add code**. Adding is the last resort, not the reflex.

Hard brakes:

- A finding whose fix needs **>30 new lines**, or a new abstraction or file: **stop and ask** whether the criterion is wrong, or the finding should not be fixed at all.
- **A predicate or guard patched a second time is a design error.** Delete it, or switch to a principle that actually holds (text heuristic to a real import graph / type system / runtime assertion). If no affordable principle exists, drop the whole thing. **No third patch.**
- Fixes target confirmed problems only. No "while I am here" expansion along the report.

## 3. Budgets you can count

Judge bloat by lines, not vibes:

- **Meta-code <= the production code it protects.** 400 lines of tests guarding a 107-line module is a liability, not an asset; cut below the line.
- **Comments <= 1/4 of a file's lines.** Comments are not evidence, and they lie: a wrong comment costs more than none, it steers the next reader (including the next reviewer) wrong. No multi-paragraph argumentative comments in tests or guards.
- **New lines per fix round <= confirmed P0/P1 count x 30.** Over that, the round is expanding scope under cover of fixing.

Over-budget is not an automatic block, but the numbers go in the report with the reason it was worth it.

## 4. Saturation: when you must stop

Any one of these ends review **for this task**:

1. >50% of this round's findings point at **code added last round**.
2. >50% of this round's findings point at **meta-code** (guards / tests / scripts).
3. Two consecutive rounds with no new **production-code** P0/P1.

Stopping means: leftovers become a one-line-each list for the user to schedule as separate work; the main session makes no further edits against them. This is not "giving up on quality"; it is admitting this round's marginal gain fell below the new risk it creates.

## 5. Reporting honesty

- A fix that swaps defect class A for defect class B (regex for AST: loses trailing comments, gains `//` inside strings) is reported as a **lateral trade**, listing what was lost and what was gained. **Never "net upgrade / hardened / more robust".** Misreporting a trade as an upgrade is itself a source of next round's work.
- Banned words for fix effects: "more robust", "safer", "hardened", "more complete". Write **which input's behavior changed from what to what**.
- When a review round finds nothing worth fixing, say "no production-code defects this round" and give each reviewer's top flagged risk. Do not dress meta-code problems as findings to prove the process earns its keep.
