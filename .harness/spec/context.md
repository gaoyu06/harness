# context

本仓库词汇表。

- **spec/**：持久规则层，写"仍然成立"的内容
- **note**：限时决策记录，`proposing` / `accepted` / `archived` 三态
- **INDEX**：notes/ 的索引，只列活 note
- **并入**：note 结论以一段话写入 spec/ 的动作，之后 note 归档
- **收尾**：后台子代理执行的整理工作（并入、归档、清 INDEX），清单见 `.harness/wrap-up.md`
- **local/**：会话产物存放区，gitignore
