---
name: handoff
description: 把当前会话压缩成交接文档，供下一个会话接手。
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

## 上下游

- 前接：当前会话。
- 后接：下一个会话读交接文档接手。

Write a handoff document summarising the current conversation so a fresh agent can continue the work. Save to `.harness/local/` when the project carries `.harness/`; otherwise to the temporary directory of the user's OS - not the current workspace.

Include a "suggested skills" section in the document, naming which skills the next agent should call the Skill tool for.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the doc accordingly.
