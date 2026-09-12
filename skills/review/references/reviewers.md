# 审查者调度

唯一入口：当前宿主的原生子代理。禁止 `omp -p`、禁止任何审查脚本、禁止为换厂商去调 `claude` / `codex` / `grok` / `cursor-agent` / `omp` CLI。

隔离消的是锚定（开发过程的推理）。换模型/换厂商消的是模型盲区。前者必须有；后者能做再做，做不到就写明。

## 每家怎么起

按你**此刻所在**的宿主选一行，不要跨产品：

| 宿主 | 做法 |
| --- | --- |
| OMP / Pi | `task`，`agent: "reviewer"`。High/Heavy 一次 `tasks[]` 并行。有 model 参数才换模型。 |
| Claude Code | 原生 Task / Agent，隔离上下文，只读。有 `model` 就换。不要 `ultrareview` 云端。 |
| Cursor | 原生 Task / subagent，只读。 |
| Codex | 原生隔离子代理或新线程，只读。 |
| Grok | fork `reviewer` role/persona（`default_fork_context`）。`capability_mode` 收到只读；不要用把工具全禁掉的 plan 模式顶替审查。 |

子代理必须：

- 空白上下文：不继承你的开发推理、计划、todo。
- 不加载 `review` skill，防止递归。
- 项目规则（`AGENTS.md` / `CLAUDE.md`）要读到，才能按仓库约定判断风格。
- 只给冻结的 diff、文件清单、需求、验收、已知薄弱点、强度对应的必查项。

没有隔离子代理：停。告诉用户本宿主做不了门禁，请豁免或换宿主。不要自己审自己，也不要去调 omp。

## 换模型

审查模型档位不得低于开发模型。开发模型已是顶级档时，同档 + 隔离 + 对抗式提示即可。

能选模型：优先换一家。不能选：同源隔离，结论里写 `同源隔离，未跨厂商`。

## 主会话要做的机械步骤

不要把这些写成脚本。每次审查现场做：

1. **冻结 diff**（所有审查者共用这一份）
   - `uncommitted`（默认）：`git diff HEAD`，再把未跟踪文件补进去——`git ls-files --others --exclude-standard`，每个文件 `git diff --no-index -- /dev/null <file>`。`git diff HEAD` 不含新文件，新增模块最该审。
   - `staged`：`git diff --cached`
   - `branch`：对上游或 `origin/main` / `main` 取 `merge-base`，再 `git diff <merge-base>`
   - 或直接使用用户给的 git diff 范围
2. **填** `assets/review-prompt.md` 的 `{{REPO}}` `{{DIFF_PATH}}` `{{FILES_PATH}}` `{{STRENGTH}}` `{{FOCUS}}` `{{REQUIREMENT}}` `{{MAX_FINDINGS}}` `{{P3_RULE}}`（Low/Medium 填"不报 P3。"，High/Heavy 填"P3 单列一行，不展开。"）。diff 不大就内联进提示词；太大再写到 `$TMPDIR/review/`，不落仓库。
3. **并行**拉起 N 个只读子代理，互不可见。**起完不要空等**：宿主支持后台子代理时把审查放后台，主会话同时跑测试/构建/lint，或继续做下一个分片（见 SKILL.md 第 3 节）。串行等待是这套流程最大的时间浪费，且不换来任何安全性。
4. **校验**每份报告含 `## 未能验证的部分`。缺失 = 报告不完整，不计入有效数。只看"子代理成功返回"会把半截开场白当成通过。
5. **工作区**：审查前后各取一次 `git status --porcelain`，不一致就告警。
6. 有效报告数为 0：本次审查无效，不得声称已审。
7. **不要重复起审查者**。同一份 diff 不因为"想再确认一下"而多跑一轮；轮次预算见 `references/strengths.md`。
