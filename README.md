# harness

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

`Agent = Model + Harness`。模型之外的全部——规则、工具、上下文管理、反馈回路——决定 agent 能否可靠交付。本仓库收集其中可复用的部分。

> Reusable practices for AI-agent development: a repo-local state layer plus a curated skill set.

## `.harness/` —— 仓库级状态层

给项目加一层 agent 可读写的状态目录，针对三个老问题：

- **决策蒸发**：A/B 取舍的理由留在对话里，下个会话重新讨论一遍 → `notes/` 记限时决策，INDEX 只列活条目，归档走机械规则
- **进度失忆**：半完成的工作无人认领 → 进度信息直接来自 `git status` 与分支，不设任务系统
- **文档腐化**：规则只进不出 → 结论并入 `spec/` 后条目归档，失效内容就地删除

四条设计目标：**轻量**（简单任务零写入，会话开始仅三次小读取）、**不腐化**、**低认知负担**（用户无命令，agent 自治）、**可追溯**（git 历史即审计）。

规范全文：`harness/SPEC.md` · 安装模板：`harness/template/`

## `skills/` —— 覆盖开发流程的 skill 集

每个 skill 可独立取用；检测到 `.harness/` 时自动对接，写入去向按 `harness/SPEC.md` 的四个具名去向。各 skill 正文开头的「上下游」写明前接、后接与写入。

### 工程

| 阶段 | skill | 作用 | 后接 |
| --- | --- | --- | --- |
| 澄清 | grill | 设计树逐轮追问，词汇表与决策当场落盘 | dev-plan |
| 规划 | dev-plan | 难点调研、选型逐条辩论，产出架构、代码量与三笔账工期 | 界面转 frontend-design；实现走 ponytail |
| 实现 | ponytail | 极简实现：能复用就不写、标准库优先，故意简化留 `ponytail:` 标记 | review 门禁；标记由 ponytail-debt 汇总 |
| 排障 | diagnosing-bugs | 疑难 bug 与性能回退的诊断循环 | 回归测试；高风险修复走 review |
| 审查 | review | 对抗式审查门禁：强度分级、隔离子代理、轮次预算 | P0/P1 前移为回归测试或持久规则 |
| 审查 | ponytail-review | 只查过度设计，每个发现一行，支持改动与全仓两种范围 | 删减回主会话实现 |
| 收尾 | ponytail-debt | 收拢 `ponytail:` 标记成债务台账 | — |
| 收尾 | handoff | 当前会话压缩为交接文档（仅手动调用） | 下一个会话 |

### 视觉

| 阶段 | skill | 作用 | 后接 |
| --- | --- | --- | --- |
| 设计 | frontend-design | 界面视觉方向与可用性硬约束，设计系统落盘 | 实现走 ponytail；动效读 web-anim |
| 设计到实现 | showcase-page | 概念驱动的展示页全流程，视觉细则回到 frontend-design | 自审后交付 |
| 实现 | web-anim | 动效配方库：GSAP、ScrollTrigger、落地页模板、p5.js 生成艺术 | — |

### 中文写作（贯穿各阶段）

| skill | 作用 | 后接 |
| --- | --- | --- |
| zh-talk | 中文会话措辞 | — |
| zh-write | 正式中文成稿：禁包装词，写简洁的书面语 | zh-check |
| zh-check | 成稿检查：JSON 词库机械扫描 + 规则逐条复查 | 回 zh-write 改写 |

### 写给 agent 的文档

| skill | 作用 | 后接 |
| --- | --- | --- |
| writing-for-agents | 写 skill 与 AGENTS.md 的规范：指针、信息层级、完成判据 | 中文成稿过 zh-check |

## 使用

### 安装 `.harness/`

把下面这段贴给目标项目里的 agent，让它完成安装：

```text
把 .harness/ 状态层装进当前仓库（规范全文见 clone 后的 harness/SPEC.md）：

1. `git clone --depth 1 https://github.com/gaoyu06/harness /tmp/harness-src`
2. 复制 `/tmp/harness-src/harness/template/.harness/` 到仓库根
3. 把 `/tmp/harness-src/harness/template/AGENTS.snippet.md` 全文追加到 `AGENTS.md`（不存在则新建；规则入口为其他文件时追加到该文件）
4. `.gitignore` 加一行 `.harness/local/`
5. 按仓库结构在 `.harness/spec/index.md` 登记初始路由行（"改什么之前 | 读什么"），暂无可写则留空表
6. 删除 `/tmp/harness-src`，汇报装了什么

仓库已有 `.harness/` 或 AGENTS.md 已含该序言时，停下汇报，不重复安装。
```

手动安装：

```bash
git clone --depth 1 https://github.com/gaoyu06/harness /tmp/harness-src
cp -R /tmp/harness-src/harness/template/.harness .
cat /tmp/harness-src/harness/template/AGENTS.snippet.md >> AGENTS.md
echo '.harness/local/' >> .gitignore
rm -rf /tmp/harness-src
```

装完按项目结构在 `.harness/spec/index.md` 登记路由行（"改什么之前 | 读什么"）。

### 装全局规则与全部 skill

```bash
./install.sh                    # Claude 配置目录默认 ~/.claude
./install.sh ~/.claude <其他 Claude 配置目录...>
```

`~/.agents/skills/` 是总目录：本仓库的 skill 链接进去，Codex 直接读取；各 Claude 配置目录的 `skills/` 逐项链接到总目录，两边看到同一套 skill。`rules/global-rules.md` 链接为 `~/.codex/AGENTS.md` 和各 Claude 配置目录的 `CLAUDE.md`。可重复运行；已存在的真实文件不覆盖，失效链接会清掉。不在本仓库的 skill 放进总目录后重跑一次，Claude 也会链上。

### 装单个 skill

复制对应目录到宿主 skill 目录（`~/.agents/skills/`、`~/.claude/skills/` 等）。

## 原则

- **单向集成**：skill 检测到 `.harness/` 才使用它，否则回退通用约定；`.harness/` 不依赖任何 skill。两者各自独立可用。
- **单一事实源**：规则正文只存一处，其他位置放指针。
- **机械归机械，判断归模型**：词库扫描、归档规则交给确定性的东西做；语境判断留给模型。

## 结构

- `harness/` — `.harness/` 状态层规范（`SPEC.md`）与安装模板（`template/`）
- `.harness/` — 本仓库自身的状态层（dogfood）
- `skills/` — 完整的 agent skills，每个子目录含 `SKILL.md` 与配套文件
- `prompts/` — 一次性提示词片段，不固化为 skill
- `rules/` — 全局规则文件（跨宿主适用的 rule、全局 CLAUDE.md 类）
- `notes/` — 实践笔记
- `snippets/` — 代码片段与配置样例

## 致谢

- `skills/grill`、`skills/review`、`skills/writing-for-agents`、`skills/diagnosing-bugs`、`skills/handoff` 参考或改写自 [mattpocock/skills](https://github.com/mattpocock/skills)（MIT）
- `skills/frontend-design` 基于 Anthropic 的 frontend-design skill（Apache-2.0）
- `skills/web-anim`：`gsap-core`、`gsap-timeline`、`gsap-scrolltrigger` 收录自 GSAP 官方 skill（MIT）；`algorithmic-art` 收录自 Anthropic 的 algorithmic-art skill（Apache-2.0）；`gsap-awwwards-website` 使用 [Eng0AI/gsap-awwwards-website-template](https://github.com/Eng0AI/gsap-awwwards-website-template) 模板

## License

[MIT](./LICENSE)
