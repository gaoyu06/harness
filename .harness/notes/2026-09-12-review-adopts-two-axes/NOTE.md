# review adopts two axes

- status: accepted
- replaces: none

## Decision

`skills/review` 吸收 mattpocock `code-review` 的两块内容：spec 符合性轴（缺失/未要求/实现存疑，引用需求原文，不进 P 级排序）与 Fowler 坏味道基线（12 个具名 smell + 三条绑定规则，走判断项节不分级）。门禁、强度、预算、裁决、前移框架保持自有。

## Why

审查内容层面需要一个"需求与实现的 delta"独立轴——零缺陷但做错事的改动不能被 finding 排序掩盖。smell 基线给审查者可枚举的代码质量判据，避免"风格冲突"这类空话。

## Rejected

- 直接换用 mattpocock `code-review`——无门禁、无强度、无预算、无裁决
- spec 轴起独立子代理——`{{REQUIREMENT}}` 本就在每个审查者上下文里，agent 级隔离不成立；只需保住报告层分轴

## Links

- `skills/review/`
- 上游：`~/dev/skills-mp/skills/engineering/code-review/`
