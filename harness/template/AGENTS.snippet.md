## .harness

本仓库带 `.harness/` 状态层（规范：https://github.com/gaoyu06/harness）。会话开始：

1. 读 `.harness/notes/INDEX.md`（命中才打开 note）和 `.harness/spec/index.md`（命中才读对应 spec）。
2. `git status`——脏工作区或进行中分支即未完成任务的痕迹，向用户确认处置。
3. 索引未命中但怀疑有历史：`rg` 扫 `.harness/`（含 `archive/`），仍无即视为无。

维护：默认不写 note（写入条件见上游规范）；`proposing` 需用户决策时停下问一个问题；结论进了 `spec/` 或代码即归档 note（`git mv` 进 `archive/` 并删 INDEX 行）；并入、归档、清 INDEX 由后台子代理按 `.harness/wrap-up.md` 执行，主会话不等待；会话产物放 `.harness/local/`；实现 note 的 commit 引用其 slug。
