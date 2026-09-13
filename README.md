# Harness Engineering 实践

个人 harness engineering 实践仓库。

`Agent = Model + Harness`。模型之外的全部——规则、工具、上下文管理、反馈回路——决定 agent 能否可靠交付。本仓库收集其中可复用的部分。

## 内容

- `harness/` — `.harness/` 仓库级状态层：规范（`SPEC.md`）与安装模板（`template/`）
- `skills/` — 可直接复用的 agent skills
- `prompts/` — 一次性提示词片段
- `rules/` — 全局规则文件
- `notes/` — 实践笔记
- `snippets/` — 代码片段与配置样例

## 致谢

- `skills/grill`、`skills/review`、`skills/writing-for-agents`、`skills/diagnosing-bugs`、`skills/handoff` 参考或改写自 [mattpocock/skills](https://github.com/mattpocock/skills)（MIT）
- `skills/frontend-design` 基于 Anthropic 的 frontend-design skill（Apache-2.0）

## License

[MIT](./LICENSE)
