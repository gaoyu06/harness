# 从 GSD 到 Trellis 到自建：一个 agent 状态层的复盘

`Agent = Model + Harness`。模型之外的部分——规则、工具、上下文管理、反馈回路——决定 agent 能否可靠交付。这个仓库收集我在 harness 这一侧反复试错后留下的东西：一个仓库级状态层 `.harness/`，加一组覆盖开发流程的 skill。

这篇文章复盘我走过的完整路径：先用 GSD，换到 Trellis，再把 Trellis 整个删掉，自己写了一个只有文档、没有代码的状态层。每一步的理由都留在 git 历史里，数字和文件名取自真实提交。

## 时间线

| 时间 | 事件 |
| --- | --- |
| 2026 年中 | 在若干项目上使用 GSD（Get Shit Done） |
| 2026-07 | 在一个多仓库项目上引入 Trellis 0.6.7 全套 |
| 2026-07 ~ 08 | 六周里 Trellis 产出上百个任务目录（含归档），每个含 prd / design / implement 等文件 |
| 2026-09 | 整体删除 Trellis：近千个文件、七万多行；spec 语料迁出，决策改用轻量 note |
| 同月 | harness 仓库建立，把验证过的模式泛化成 `.harness/` 规范 |

## 第一幕：GSD，流程比任务重

GSD 是一个 spec 驱动的开发框架。先跑 `/gsd:new-project`，经过问答、研究、需求、路线图，生成一批文件：`PROJECT.md`、`REQUIREMENTS.md`、`ROADMAP.md`、`CONTEXT.md`、`RESEARCH.md`。然后每个 phase 由 planner 拆出 `PLAN.md`。主会话只做编排，重活派给研究、执行、验证三类子代理。

它要解决的问题是真的：context rot，会话一长质量就掉。办法是把决策提前写进文件，每个任务开全新上下文。

我的实际体验是另一回事：

- **token 消耗大**。每个任务前要先跑问答、研究、规划，每步都派子代理、各开一份上下文。同一个需求，直接做的成本可能是跑完 GSD 流程的几分之一。
- **任务变慢**。流程串行：研究没回来不能规划，规划没写完不能执行。小改动也要排队。
- **比 superpowers 还重**。superpowers 至少只是一组 skill，GSD 是一整套带状态文件的流水线。
- **人也被拖累了**。框架号称"复杂性在系统里，不在你的工作流里"。实际你要维护 PROJECT、REQUIREMENTS、ROADMAP、CONTEXT 之间的关系。框架帮你写文件，文件反过来要你照看。

GSD 给我的教训是：编排层的收益要大于固定成本才成立。工作以中小改动为主时，固定成本永远收不回来。

## 第二幕：Trellis，六周后整体删除

Trellis 的定位是"Team-level Agent Harness + 内置 LLM wiki"。装进仓库的东西包括：

- 三阶段 workflow（Plan / Execute / Finish），写在 `.trellis/workflow.md`
- 任务生命周期：`task.py create/start/finish/archive`，每个任务一个目录，内含 `prd.md`、`design.md`、`implement.md`、`task.json`、给 implement 和 check 代理各一份的 jsonl 上下文清单
- 按开发者分目录的 journal：`.trellis/workspace/<developer>/journal-N.md`
- SessionStart hook：会话开始自动注入身份、git 状态、活动任务、workflow 摘要
- 11 个配套 skill：`trellis-start`、`trellis-check`、`trellis-before-dev`、`trellis-brainstorm`、`trellis-break-loop`、`trellis-update-spec`、`trellis-session-insight`、`trellis-spec-bootstrap`、`trellis-channel`、`trellis-meta`、`trellis-finish-work`
- spec 库：`.trellis/spec/` 下的持久规则语料

没有 hook 的平台靠 `trellis-start` 手动补：会话开始跑三遍 `get_context.py`（状态、phase、packages），读 workflow 和 spec 索引，再决定请求走哪条流程。

### 实际发生了什么

六周里 Trellis 确实留下了有用的东西：`.trellis/spec/` 积累出一套真实反映项目的规则语料：部署、工程约定、跨包接口契约。这些是每次会话都该读的东西。

但任务层基本是空转的。回看 git 历史，deploy、git 清理、小修这几类占多数的请求从不走任务生命周期：不建任务、不写 prd、不 archive。它们照样完成了，只是每次会话开始都先付一遍"加载上下文、判断是否建任务"的税。这个税每会话收一次，是复利。

Trellis 里真正有价值的残留只有 spec 语料。而 spec 恰恰是可以脱离框架存在的部分。

### 为什么不修，而是删

当时考虑过几个方向，都否掉了，理由写在那次决策的 note 里：

- **深度定制 Trellis**：bundled skills 和 `trellis update` 会把它长回来。框架的默认值互相咬合，剪掉任务系统，剩下的部分仍按有任务系统的方式运行。
- **自己写一个新的 workflow 引擎**：写出来就是 Trellis 2，问题原样保留。
- **给 note 留一个 `Implementing` 状态**：进度属于分支和 PR。note 是决策，不是看板卡。

删除那次提交的数字值得记下：**956 个文件、77462 行删除、356 行新增**。新增的是 spec 的路由索引和第一版决策记录。六周的实验，净产出是几百行规范和一个教训：会话记忆要解决的只有三件事——持久规则、限时决策、进度。

## 第三幕：自建 .harness

先在一个真实项目上跑了一个月的简化版：持久规则进 spec 目录，限时决策进 notes 目录，进度看 git。确认站得住之后，把它抽成可安装到任意仓库的规范，就是现在这个仓库的 `harness/SPEC.md`。

### 结构

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

安装到一个新项目只需三步：复制模板目录、`AGENTS.md` 追加一段序言、`.gitignore` 加一行。没有 CLI、没有 hook、没有数据库。

### 会话开始：三次小读取

1. 读 `notes/INDEX.md`，请求命中某条 note 才打开它；
2. 读 `spec/index.md`，按要改的区域决定读哪份 spec，不命中不读；
3. `git status`——脏工作区或进行中分支就是未完成任务的痕迹。

如果索引没命中但怀疑有历史，用 `rg` 扫一遍 `.harness/`（含 `archive/`）；换同义词再扫一次，仍无就视为无，不编造。

整个开场成本是三个小文件加一条命令。对比 Trellis 的开场——三遍 `get_context.py`、workflow、spec 索引、任务分类决策——量级完全不同。

### notes/：决策的临时存放处

note 解决的是"决策蒸发"：A/B 取舍的理由留在对话里，下个会话重新讨论一遍。规则写得很硬：

- **默认不写**。只有四种情况才写：跨边界契约；选了 A 没选 B 且理由会被重新发明；明确"不做 X"；难逆转的选择。bugfix、部署、清理、PR 已经说清的事不写。
- `proposing` 需要用户决策时，停下问一个问题，不把问题埋进正文。
- **归档是机械规则，不是"感觉过时了"**：proposing 14 天没有进展 → abandoned；结论进了 spec/ 或代码 → 一段话并入 spec/ 后 `git mv` 进 `archive/`；新 note `replaces:` 旧的 → 同一改动内归档。三种情形都删 INDEX 行。
- 两条不变量：INDEX 只列活 note；两条 accepted 互相矛盾即错误，`replaces:` 为准。
- 同一条守卫被修补第二次，开新 note 换原理，不在旧 note 上叠第三层补丁。

### 进度：git 是事实源

不设任务系统。半完成的工作在 git 里都有对应物：脏工作区、进行中分支、worktree、未合并 PR。再维护一份任务状态，只会多出两份事实互相矛盾的可能。跨会话的工作尽早开分支，或者先开一条 proposing note 留下线索。

### 收尾：并入后台子代理

存在待整理内容时（note 生效、结论待并入、INDEX 待清），主会话启动一个后台子代理按 `.harness/wrap-up.md` 执行，不等待、不代劳。这份清单本身就是子代理的提示词。

### skills：单向集成

skill 检测到 `.harness/` 存在才使用它，否则回退到项目通用约定；`.harness/` 不依赖任何 skill。两边各自独立可用。skill 要落盘时只有四个具名去向：

| 去向 | 有 `.harness/` | 无 `.harness/` |
| --- | --- | --- |
| 持久规则 | `spec/standards.md` | `AGENTS.md` / `CLAUDE.md` |
| 词汇表 | `spec/glossary.md` | `GLOSSARY.md` |
| 决策记录 | `notes/` | `docs/adr/` |
| 会话产物 | `local/` | 不落盘 |

映射集中定义在 SPEC，各 skill 不重复展开。规则正文只存一处，其他位置放指针。

### 设计时被否掉的东西

- **单文件 append-only 决策日志**（第一版草案）：活集合靠"读文件末尾"的约定维持，不如 INDEX + 物理 archive 可检查。
- **hooks / CLI / sqlite**：纯文档对多宿主等价生效。各宿主能力差异很大——Claude Code、Codex、Windsurf、Devin 各不相同，文字约定是唯一到处一样的东西。
- **journal.md**：与 git 历史重复。Trellis 的 journal 记录了"哪个会话做了什么"，这件事 `git log` 回答得更好。

## 这个仓库怎么组织

状态层之外，仓库本身是一组可拆开取用的部件：

- `harness/` — `.harness/` 规范全文和安装模板
- `.harness/` — 本仓库自己的状态层，dogfood。现在活着的 note 只有两条：启用 `.harness/` 的决策、review skill 吸收双审查轴的决策
- `skills/` — 十二个可独立取用的 skill：需求访谈（grill）、极简实现（ponytail）、过度设计审查（ponytail-review / ponytail-debt）、疑难 bug 诊断（diagnosing-bugs）、对抗式审查门禁（review）、会话交接（handoff）、给 agent 写文档的规范（writing-for-agents）、UI 设计约束（frontend-design）、中文措辞与成稿检查（zh-talk / zh-write / zh-check）
- `rules/` — 跨宿主的全局工程规则
- `prompts/`、`notes/`、`snippets/` — 一次性提示词、实践笔记、代码样例

三条贯穿原则：单向集成；单一事实源（规则正文只存一处，其他位置放指针）；机械归机械、判断归模型——词库扫描和归档规则交给确定性的东西做，语境判断留给模型。

## 哪些问题反复出现

**会话开始税是复利。** 每个会话都收一次的成本，再小也值得砍掉。GSD 的税是流程，Trellis 的税是上下文加载加任务分类。现在的成本是三个小文件，其中两个是索引，不命中不展开。

**任务系统对小任务是负资产。** 真实工作里大量请求是 deploy、git、小修，它们需要的是规则和事实，不是生命周期。任务系统只在跨多日、多上下文窗口的大工作上才可能收回成本。而这种工作，用分支加一条 proposing note 也够追踪。

**文档只进不出就会腐化。** Trellis 的 spec 有价值，因为每条都是"仍然成立"的。spec 的维护规则必须包含删除：失效内容就地删，结论并入后 note 归档。腐化的 spec 比没有 spec 更贵——它让 agent 按旧事实行动。

**决策理由会蒸发，结论不会。** 代码和 spec 留下了"是什么"，留不下"为什么不是另一个"。note 专门记后者，记完归档，不假装它是进度。

**深度定制第三方框架是死路。** 框架的默认值互相咬合，剪掉一块，其余部分仍按完整形态运行，升级时全长回来。要裁剪就裁剪到自己拥有全部代码为止——对状态层来说，这意味着零代码。

**框架解决的是框架自己的问题。** GSD 的文件生态服务于 GSD 的流水线，Trellis 的 jsonl 清单服务于 Trellis 的角色分工。换掉框架时这些文件全是废稿。只有脱离框架也能成立的内容——规则语料、决策理由——能带走。

## 现状

`.harness/` 的前身先在一个真实项目上跑了一个月。泛化成规范后，在 harness 仓库自身继续 dogfood。它最诚实的证明是：两周的提交历史里没有任何"维护状态层"的提交。没有需要修的状态——它自己不产生状态，只读 git 已有的状态。

现在判断标准只剩一条：能否删掉。GSD 删掉了，Trellis 删掉了，`.harness/` 的设计目标也是"随时删掉，项目不损失任何代码"。状态层应该是消耗品，不是资产。

---

*仓库：[github.com/gaoyu06/harness](https://github.com/gaoyu06/harness)，规范全文在 `harness/SPEC.md`。*
