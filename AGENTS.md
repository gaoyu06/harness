# AGENTS.md

Harness engineering 实践仓库：收集 agent 开发中可复用的经验。

## 结构

- `harness/` — `.harness/` 状态层规范（`SPEC.md`）与安装模板（`template/`）
- `.harness/` — 本仓库自身的状态层（dogfood）
- `skills/` — 完整的 agent skills，每个子目录含 `SKILL.md` 与配套文件
- `prompts/` — 一次性提示词片段，不固化为 skill
- `rules/` — 全局规则文件（跨宿主适用的 rule、全局 CLAUDE.md 类）
- `notes/` — 实践笔记
- `snippets/` — 代码片段与配置样例

## .harness

规范见 `harness/SPEC.md`。会话开始：

1. 读 `.harness/notes/INDEX.md`（命中才打开 note）和 `.harness/spec/index.md`（命中才读对应 spec）。
2. `git status`——脏工作区或进行中分支即未完成任务的痕迹，向用户确认处置。
3. 索引未命中但怀疑有历史：`rg` 扫 `.harness/`（含 `archive/`），仍无即视为无。

维护：默认不写 note（写入条件见 SPEC）；`proposing` 需用户决策时停下问一个问题；结论进了 `spec/` 或代码即归档 note（`git mv` 进 `archive/` 并删 INDEX 行）；并入、归档、清 INDEX 由后台子代理按 `.harness/wrap-up.md` 执行，主会话不等待；会话产物放 `.harness/local/`；实现 note 的 commit 引用其 slug。

## 约定

见 `.harness/spec/standards.md`。高频义务单独点名：

- 写或改 `skills/` 里的 skill：按 `skills/writing-for-agents/` 的方法执行
- 中文编写的 skill：成稿后过 `skills/zh-check/`
- 写 `README.md` 等门面文档：只写当前成立的稳定状态；改名、分叉、迁移这类变更说明归 commit message / note，不进正文

## References

- [mattpocock/skills](https://github.com/mattpocock/skills) — Matt Pocock 的 skill 集，本地 clone 于 `~/dev/skills-mp`。参考点：user-invoked / model-invoked 二元划分、`grill` 追问原语、共享语言词汇表、spec → tickets → implement 流水线
- aicare 工作区（`~/dev/aicare`）— agent-notes 与 spec 语料模式来源
