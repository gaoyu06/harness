---
name: prototype
description: '原型：要先回答一个设计问题时，写正式代码前调用，做一次性原型。逻辑或状态模型对不对，做成单个可双击打开的 HTML；界面该长什么样，在同一页面放几种结构不同的方案切换对比。用于：先做个原型看看、比较几种界面方案、验证状态流转或数据模型。正式界面转 frontend-design。'
---

# Prototype

## 上下游

- 前接：`grill`、`dev-plan` 或 `frontend-design` 里没法在纸面上定下来的设计问题。
- 读取：界面原型的可用性硬约束和风格沿用按 `frontend-design`。
- 后接：选定的方案并入正式代码（界面走 `frontend-design`，实现走 `ponytail`）。
- 写入：问题与结论 → 决策记录；原型代码留在一次性分支（见规则 6）。

A prototype is **throwaway code that answers a question**. The question decides the shape.

## Pick a branch

Identify which question is being answered, using the user's prompt, the surrounding code, or by asking if the user is around:

- **"Does this logic / state model feel right?"** → [LOGIC.md](LOGIC.md). Build a single shareable HTML file (free-play buttons plus tabbed guided walkthroughs) that pushes the state machine through cases that are hard to reason about on paper, and that a non-developer can drive.
- **"What should this look like?"** → [UI.md](UI.md). Generate several radically different UI variations on a single route, switchable via a URL search param and a floating bottom bar.

The two branches produce very different artifacts, so getting this wrong wastes the whole prototype. If the question is genuinely ambiguous and the user isn't reachable, default to whichever branch better matches the surrounding code (a backend module → logic; a page or component → UI) and state the assumption at the top of the prototype.

## Rules that apply to both

1. **Throwaway from day one, and clearly marked as such.** Locate the prototype code close to where it will actually be used (next to the module or page it's prototyping for) so context is obvious, but name it so a casual reader can see it's a prototype, not production. For throwaway UI routes, obey whatever routing convention the project already uses; don't invent a new top-level structure.
2. **Trivial to run.** A UI prototype starts from one command in the project's task runner: `pnpm <name>`, `python <path>`, `bun <path>`, etc. A logic demo is a single HTML file the user double-clicks. Either way, no thinking required to start it.
3. **No persistence by default.** State lives in memory. Persistence is the thing the prototype is _checking_, not something it should depend on. If the question explicitly involves a database, hit a scratch DB or a local file with a clear "PROTOTYPE, wipe me" name.
4. **Skip the polish.** No tests, no error handling beyond what makes the prototype _runnable_, no abstractions. The point is to learn something fast.
5. **Surface the state.** After every action (logic) or on every variant switch (UI), print or render the full relevant state so the user can see what changed.
6. **Capture it when done.** Fold any validated decision into the real code, then capture the prototype itself as a **primary source**: commit it to a throwaway branch, out of main, and leave a context pointer to that branch in the decision record (`.harness/notes/` in `.harness/` projects, else `docs/adr/`) or the commit message. Capture the answer too (the verdict and the question it settled) in the same place. The main branch keeps only the validated decision.
