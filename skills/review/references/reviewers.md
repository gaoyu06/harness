# Reviewer dispatch

Single entry point: the current host's native subagents. Banned: `omp -p`, any review script, and calling `claude` / `codex` / `grok` / `cursor-agent` / `omp` CLIs to reach a vendor.

Isolation removes anchoring (your development reasoning). Model and vendor swaps remove model blind spots. The first is mandatory; the second is done when possible, declared when not.

## Per host

Pick the row for the host **you are in right now**; do not cross products:

| Host | How |
| --- | --- |
| OMP / Pi | `task`, `agent: "reviewer"`. High/Heavy: one parallel `tasks[]`. Swap models only if a model param exists. |
| Claude Code | native Task / Agent, isolated context, read-only. Use `model` if available. No `ultrareview` cloud. |
| Cursor | native Task / subagent, read-only. |
| Codex | native isolated subagent or fresh thread, read-only. |
| Grok | fork a `reviewer` role/persona (`default_fork_context`). `capability_mode` set to read-only; do not substitute an all-tools-off plan mode for review. |

Every subagent must:

- Start blank: none of your development reasoning, plans, or todos.
- Not load the `review` skill (no recursion).
- Read project rules (`AGENTS.md` / `CLAUDE.md`) so it can judge style by repo convention.
- Receive only: the frozen diff, the file list, the requirement, acceptance criteria, your known weak points, and the must-checks for the chosen strength.

No isolated subagents on this host: stop. Tell the user the gate cannot run here; ask for a waiver or a different host. Do not self-review, do not call omp.

## Model swaps

The review model's tier must not sit below the development model's. When the dev model is already top tier, same tier + isolation + an adversarial prompt is enough.

Model selectable: prefer a different vendor. Not selectable: same-source isolation, and write `same-source isolation, no cross-vendor` in the conclusion.

## Mechanical steps for the main session

Do not script these. Do them live each round:

1. **Freeze the diff** (one copy shared by all reviewers)
   - `uncommitted` (default): `git diff HEAD`, then add untracked files: `git ls-files --others --exclude-standard`, and per file `git diff --no-index -- /dev/null <file>`. `git diff HEAD` misses new files, and new modules are what most need review.
   - `staged`: `git diff --cached`
   - `branch`: `git diff <base>...HEAD` (three-dot, diffs against the merge-base)
   - or use the diff range the user gave you
   - Fail fast before dispatch: `git rev-parse` any user-supplied ref, and confirm the frozen diff is non-empty. A bad ref or empty diff fails here, not inside the subagents.
   - For branch diffs, attach `git log <base>..HEAD --oneline` to the packet; reviewers get the commit list as intent context.
2. **Fill** `assets/review-prompt.md`: `{{REPO}}` `{{DIFF_PATH}}` `{{FILES_PATH}}` `{{STRENGTH}}` `{{FOCUS}}` `{{REQUIREMENT}}` `{{MAX_FINDINGS}}` `{{P3_RULE}}` (Low/Medium fill "No P3s."; High/Heavy fill "P3s as a single line, unexpanded."). Inline a small diff into the prompt; write a large one to `$TMPDIR/review/`, never into the repo.
3. **Spawn** N read-only subagents in parallel, blind to each other. **Do not idle after spawning**: if the host supports background subagents, review runs in the background while the main session runs tests/build/lint or builds the next shard (SKILL.md section 3). Serial waiting is this process's biggest time sink and buys no safety.
4. **Validate** each report contains `## Requirement conformance` and `## Could not verify`. Missing either = incomplete = does not count. Checking only "did the subagent return" mistakes a truncated preamble for a pass.
5. **Workspace**: take `git status --porcelain` before and after review; a difference is an alert.
6. Zero valid reports: the review did not happen; never claim it did.
7. **Never re-spawn reviewers.** The same diff does not get another round because you "want to double-check"; round budgets live in `references/strengths.md`.
