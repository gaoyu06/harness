# Adopt .harness layer

- status: accepted
- replaces: none

## Decision

本仓库启用 `.harness/` 状态层：`spec/` 存持久规则（`index.md` 路由）、`notes/` 存限时决策（INDEX + `archive/`）、进度信息来自 git。无任务系统、无 journal、无 STATE。

## Why

目标四条：轻量（简单任务零写入）、不腐化（机械归档而非感觉）、低认知（用户无命令）、可追溯（git 即审计）。aicare 拆 Trellis 的记录证明任务层是会话开始税：deploy、git、小修从不使用任务生命周期，有用的残留只有 spec 语料。

## Rejected

- Trellis / GSD 式任务生命周期——会话开始税，小任务用不上
- 单文件 append-only 决策日志（先实现的草案）——活集合靠"读末尾"的约定，不如 INDEX + 物理 archive 可检查
- hooks / CLI / sqlite——纯文档对多宿主等价生效
- journal.md——与 git 历史重复

## Links

- 规范：`harness/SPEC.md`
- 参照：aicare `docs/agent-notes/`、`~/dev/skills-mp`
