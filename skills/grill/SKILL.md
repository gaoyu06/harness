---
name: grill
description: Relentlessly interview the user to sharpen a plan, design, or idea — and write down the glossary and decisions as they crystallize. Use when the user wants to stress-test thinking before building, or says "grill me".
---

# Grill

Interview the user relentlessly until you reach a shared understanding. Map this as a **design tree**: every decision branches into the decisions that hang off it.

Work the tree in **rounds**. The **frontier** is every decision whose prerequisites are already settled: the questions you can ask _now_ without guessing at answers you haven't heard yet. Ask the whole frontier in one round: number each question and give your recommended answer. Then wait for the user's answers before the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

Each round the user answers reshapes the tree: settled decisions push the frontier outward and unblock questions that depended on them. Recompute the frontier and ask the next round. A question whose answer depends on another question still open in this round belongs to a _later_ round, not this one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the sub-agent to report; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

The interview is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.

## What gets written down

The interview sharpens the domain model as it goes. Capture terms and decisions the moment they crystallize — don't batch them up.

### Where things live

In a project carrying `.harness/`: the glossary goes to `.harness/spec/glossary.md` (registered in `spec/index.md`), and decision records become notes in `.harness/notes/`. Otherwise:

- `GLOSSARY.md` at the repo root is the glossary. If `CONTEXT-MAP.md` exists, the repo has multiple contexts and the map points to each one's `GLOSSARY.md`.
- `docs/adr/` holds decision records. Create files lazily — only when there is something to write.

`GLOSSARY.md` / `glossary.md` is a glossary and nothing else: no implementation details, no spec, no scratch pad. Format: [GLOSSARY-FORMAT.md](./GLOSSARY-FORMAT.md).

### During the interview

- **Challenge against the glossary.** When the user uses a term that conflicts with the existing language, call it out immediately: "Your glossary defines 'cancellation' as X, but you seem to mean Y. Which is it?"
- **Sharpen fuzzy language.** When the user uses vague or overloaded terms, propose a precise canonical term: "You're saying 'account': do you mean the Customer or the User? Those are different things."
- **Discuss concrete scenarios.** Stress-test domain relationships with specific scenarios that probe edge cases and force precise boundaries between concepts.
- **Cross-reference with code.** When the user states how something works, check whether the code agrees. Surface contradictions: "Your code cancels entire Orders, but you just said partial cancellation is possible. Which is right?"
- **Update the glossary inline.** When a term is resolved, write it down right there.

### Offer decision records sparingly

Only record a decision when all three are true:

1. **Hard to reverse**: the cost of changing your mind later is meaningful
2. **Surprising without context**: a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off**: there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip it. Format: [ADR-FORMAT.md](./ADR-FORMAT.md) — or a `.harness` note when the project carries one.
