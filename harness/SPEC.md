# .harness 规范

仓库级状态层：进度信息来自 git，持久规则入 `spec/`，限时决策入 `notes/`。引入任意项目只需复制骨架并在 `AGENTS.md` 追加序言。无 CLI、hooks、数据库。

## 设计目标

- **轻量**：会话开始三次小读取，简单任务零写入；不设任务系统
- **不腐化**：INDEX 只列活 note；归档走机械规则；结论并入 spec/ 后 note 即归档
- **低认知**：用户不参与流程；仅当 proposing 需要决策时才被问一个问题
- **可追溯**：每次变动一个 commit；accepted 的 note 正文不改，修正走 `replaces:`

## 结构

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

`.harness/` 自包含，不含规范本身。

## 会话开始

1. 读 `notes/INDEX.md`；请求命中某条 note 才打开它。
2. 读 `spec/index.md`；按要改的区域决定读哪份，不命中不读。
3. `git status`（多 worktree 加 `git worktree list`）。脏工作区或进行中分支即未完成任务的痕迹，向用户确认处置。
4. 索引未命中但怀疑有历史 → `rg` 关键词扫 `.harness/`（含 `archive/`）；换同义词再试一次，仍无即视为无，不编造。

## notes/

`NOTE.md` 必含 `status` `decision` `why` `rejected` `replaces` `links`，≤80 行，材料进 `evidence/`。

status：`proposing` 选项未定、不得当规则引用；`accepted` 有约束力，实现以 git 提交为准，note 不记录执行状态；`archived` 已失效。

**何时写（默认不写）**：跨边界契约；选 A 非 B 且理由会被重新发明；明确"不做 X"；难逆转的选择。bugfix、部署、清理、PR 已说清的事不写。

**创建**：符合写入条件 → proposing 需用户决策则停下问一个问题，不埋进正文 → 建目录 + INDEX 加行。INDEX 的 Decision 摘要含日后检索的关键词（改动面、术语）；实现某 note 的 commit 在消息里引用其 slug。

**归档（机械规则）**：proposing 14 天无动静 → abandoned；结论已进 spec/ 或代码 → 以一段话并入 spec/ 后 `git mv` 进 `archive/`；新 note `replaces:` 旧 → 同一改动内归档。三种情形都删 INDEX 行。守卫第二次被修补 → 开新 note 换原理，不做第三次修补。

**不变量**：INDEX 只列活 note；两条 accepted 矛盾即错误，`replaces:` 为准。

## spec/

写"仍然成立"的，失效的删——腐化的 spec 比没有更贵。`index.md` 是唯一入口，条目写成触发语；新增文件要登记一行。

## 进度

git 是事实源：脏工作区、进行中分支、worktree、PR。跨会话工作尽早开分支，或先开 proposing note 留下线索。backlog 归用户自己的文件，不进 harness。

## 收尾

存在待整理内容时才执行（note 生效、结论待并入、INDEX 待清）：主会话启动后台子代理按 `.harness/wrap-up.md` 执行，不等待、不代劳。

## 与 skills 的关系

单向集成：skill 检测到 `.harness/` 存在才使用它，否则回退到项目通用约定；`.harness/` 不依赖任何 skill。两者各自可独立使用。

skill 写入时引用四个具名去向，映射集中定义在这里，不在各 skill 内重复展开：

| 去向 | 有 `.harness/` | 无 `.harness/` |
| --- | --- | --- |
| 持久规则 | `spec/standards.md` | `AGENTS.md` / `CLAUDE.md` |
| 词汇表 | `spec/context.md` | `CONTEXT.md` |
| 决策记录 | `notes/` | `docs/adr/` |
| 会话产物 | `local/` | 不落盘 |

## 安装到新项目

复制 `template/.harness/` → `AGENTS.md` 追加 `template/AGENTS.snippet.md` → `.gitignore` 加 `.harness/local/`。
