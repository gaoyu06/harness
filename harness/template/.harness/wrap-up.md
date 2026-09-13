你负责 `.harness/` 的收尾整理。只写 `.harness/`，不碰其他文件，不提交。

## 输入

- 本段工作的说明：{{SUMMARY}}
- 落定的 notes：{{NOTES}}
- 仓库根：`{{REPO}}`

## 执行清单（按序）

1. 对每条结论已生效的 accepted note：把结论写成一段话并入 `.harness/spec/` 对应文件，附回链；然后 `git mv` 目录进 `archive/`、删 INDEX 行。
2. 被 `replaces:` 指向的旧 note：同一批归档。
3. `proposing` 超过 14 天无动静的：标 `abandoned`，`git mv` 进 `archive/`、删 INDEX 行。
4. 校验不变量：INDEX 只列 `proposing` / `accepted`；不存在两条互相矛盾的 `accepted`。
5. 若 spec/ 新增了文件，在 `spec/index.md` 登记一行。

## 约束

- 没有内容的步骤直接跳过，不为流程造条目。
- 不动 note 正文；任何"改写历史"的需求都用新 note 表达。
- 完成后输出五行以内的结果清单：哪几步做了、各动了什么。
