# 从 GSD 到 Trellis 到自己写：这个仓库是怎么来的

`Agent = Model + Harness`。模型之外的部分——规则、工具、上下文管理、反馈回路——决定 agent 能否稳定交付。这个仓库收集的是我在这件事上反复试过之后留下的东西：一个叫 `.harness/` 的仓库级状态层，加一组开发流程用的 skill。

这套东西不是设计出来的，是删出来的。前面经历了两轮框架：GSD 和 Trellis。写一下过程。

## GSD

GSD 是 spec 驱动框架。流程是 `/gsd:new-project` 起步，问答、研究、需求、路线图走一轮，产出 `PROJECT.md`、`REQUIREMENTS.md`、`ROADMAP.md`、`CONTEXT.md`、`RESEARCH.md` 一批文件；每个 phase 再拆出 `PLAN.md`。干活时主会话只做编排，重活派给研究、执行、验证三类子代理，每个子代理开新上下文。

它想解决的问题是 context rot，方向没错。问题是成本：每接一个任务先跑一串问答和规划，每一步都开新子代理上下文，token 开销明显大于直接做；流程串行，小改动也要等前面的步骤走完。整套东西比 superpowers 还重——superpowers 只是一组 skill，GSD 是一整条带状态文件的流水线。

最重的一环其实落在人身上。PROJECT、REQUIREMENTS、ROADMAP、CONTEXT 之间的关系要自己维护，文件是框架写的，照看文件的是人。我用它做的多数工作是中小改动，这个流程的固定成本在那类工作上收不回来。

## Trellis

之后换成 Trellis 0.6.7，在一个多仓库项目上跑了六周。它的自我定位是 "Team-level Agent Harness + 内置 LLM wiki"，装进仓库的东西有：

- 三阶段 workflow（Plan / Execute / Finish），写在 `.trellis/workflow.md`
- 任务生命周期：`task.py create/start/finish/archive`，每个任务一个目录，内含 `prd.md`、`design.md`、`implement.md`、`task.json`，外加给 implement 和 check 代理各一份的 jsonl 上下文清单
- 按开发者分目录的 journal：`.trellis/workspace/<developer>/journal-N.md`
- SessionStart hook，会话开始自动注入身份、git 状态、活动任务、workflow 摘要
- 11 个配套 skill（`trellis-start`、`trellis-check`、`trellis-before-dev`、`trellis-brainstorm` 等）
- `.trellis/spec/` 规则语料库

没有 hook 的平台用 `trellis-start` 手动补：会话开始跑三遍 `get_context.py`（状态、phase、packages 各一遍），读 workflow 和 spec 索引，再决定请求走哪条流程。

六周下来它确实产出了有价值的东西：`.trellis/spec/` 积累出一套真实反映项目的规则——部署、工程约定、跨包接口契约，每次会话都该读。任务目录也攒了上百个（含归档）。

但任务层基本是空转的。回看 git 历史，deploy、git 清理、小修这类占多数的请求从来不走任务生命周期：不建任务、不写 prd、不 archive。事情照样做完。只是每次会话开始都先付一遍"加载上下文、判断是否建任务"的成本，每会话收一次。

真正留下来的只有 spec 语料，而 spec 恰恰是不依赖框架的部分。

考虑过修而不是删，否掉了三个方向。深度定制：bundled skills 和 `trellis update` 会把它长回来，框架的默认值互相咬合，剪掉任务系统，其余部分仍按有任务系统的方式运行。自己写 workflow 引擎：写出来就是 Trellis 2。给决策记录留 `Implementing` 状态：进度属于分支和 PR，note 是决策，不是看板卡。

删除那次提交的数字：956 个文件、77462 行删除、356 行新增。新增的是 spec 的路由索引和第一版决策记录。六周实验的净产出是几百行规范和一个判断：会话记忆要解决的只有三件事——持久规则、限时决策、进度。

## .harness

先在一个真实项目上跑了一个月简化版：持久规则进 spec 目录，限时决策进 notes 目录，进度看 git。站住了，才抽成可安装到任意仓库的规范，即 `harness/SPEC.md`。

结构：

```
.harness/
├── spec/index.md       # 路由表："改 X 之前读 Y"，必读
├── spec/*.md           # 持久规则语料
├── notes/INDEX.md      # 索引：仅 proposing + accepted
├── notes/YYYY-MM-DD-slug/NOTE.md (+ evidence/)
├── notes/archive/      # 已归档条目
├── wrap-up.md          # 收尾清单（兼作子代理提示词）
└── local/              # gitignore：会话产物存放区
```

安装三步：复制模板目录，`AGENTS.md` 追加一段序言，`.gitignore` 加一行。没有 CLI、hook、数据库。

会话开始只做三次小读取：`notes/INDEX.md`（命中才打开 note）、`spec/index.md`（命中才读对应 spec）、`git status`。索引没命中但怀疑有历史，`rg` 扫 `.harness/` 含 `archive/`，换同义词再扫一次，仍无就视为无。对比 Trellis 开场的三遍 `get_context.py` 加任务分类决策，成本不是一个量级。

note 的规则：默认不写，只有跨边界契约、选 A 非 B 且理由会被重新发明、明确"不做 X"、难逆转的选择这四种情况才写；`proposing` 需要用户决策时停下问一个问题。归档走机械规则：proposing 14 天没有进展标 abandoned，结论进了 spec/ 或代码就并入并 `git mv` 进 `archive/`，被 `replaces:` 指向的同一批归档，三种情形都删 INDEX 行。两条不变量：INDEX 只列活 note；两条 accepted 矛盾即错误。同一条守卫被修补第二次，开新 note 换原理，不叠第三层补丁。

进度不设任务系统。半完成的工作在 git 里都有对应物：脏工作区、进行中分支、worktree、未合并 PR。再维护一份任务状态，只是多一份会互相矛盾的事实源。

收尾不占用主会话：有东西要整理时（note 生效、结论待并入、INDEX 待清），主会话起一个后台子代理按 `wrap-up.md` 执行，不等待。

skill 与 `.harness/` 是单向集成：检测到才用，否则回退通用约定；`.harness/` 不依赖任何 skill。skill 要落盘的内容只有四个去向：

| 去向 | 有 `.harness/` | 无 `.harness/` |
| --- | --- | --- |
| 持久规则 | `spec/standards.md` | `AGENTS.md` / `CLAUDE.md` |
| 词汇表 | `spec/glossary.md` | `GLOSSARY.md` |
| 决策记录 | `notes/` | `docs/adr/` |
| 会话产物 | `local/` | 不落盘 |

设计时也否掉了几样东西：单文件 append-only 决策日志，活集合靠"读文件末尾"的约定维持，不如 INDEX 加物理 archive 可检查；hooks / CLI / sqlite，各宿主能力差异大，纯文档是唯一到处等价生效的形态；journal.md，与 git 历史重复。

## 仓库现状

`harness/` 是规范和安装模板；`.harness/` 是仓库自己的状态层，目前活着的 note 只有两条；`skills/` 十二个，覆盖需求访谈（grill）、极简实现（ponytail）、过度设计审查（ponytail-review / ponytail-debt）、bug 诊断（diagnosing-bugs）、审查门禁（review）、会话交接（handoff）、写作规范（writing-for-agents / zh-write / zh-talk / zh-check）、UI 约束（frontend-design）；`rules/` 是跨宿主全局规则；`prompts/`、`notes/`、`snippets/` 收一次性材料。

两轮框架用下来，失败集中在同几处：每个会话收一次的固定成本、只进不出导致腐化的文档、服务于框架自身流程的文件生态。现在衡量一个 harness 部件的标准是它能否整个删掉而不损失代码。GSD 删掉了，Trellis 删掉了，`.harness/` 也是按这个标准设计的：它自己不产生状态，只读 git 已有的状态。

规范全文在 `harness/SPEC.md`，仓库在 [github.com/gaoyu06/harness](https://github.com/gaoyu06/harness)。
