# standards

- skills/ 以真实文件入库，不放符号链接
- 外部 skill 原样收录时目录内附其 LICENSE；改写移植在 README 致谢注明出处
- 未获用户明确要求不 commit、不 push
- 编写或修改 skills/ 下的 skill：必须遵循 `skills/writing-for-agents/`（指针写法、信息层级、完成判据、删减纪律）
- 中文编写的 skill：成稿后必须过 `skills/zh-check/`（脚本扫描 + 规则复查），两遍干净才算完成
- skill 的 description 写成中文单行，用单引号包裹。首句以领域词开头，写用户会怎么提这个请求和调用时机（「写代码前调用」「动手修之前调用」），不以否定或限定词开头（实测「门禁，默认不审」「疑难 bug」都导致不触发）；接「用于：」列触发分支，一个分支一个触发词，英文触发词原样保留；与同组 skill 易混时，末句写分流（「X 转 Y」）
- 仅手动调用的 skill 设 `disable-model-invocation: true`，description 写一行摘要
- skill 正文标题下放「## 上下游」：按需写前接、读取、后接、分流、写入，没有的项省略；写入用 `harness/SPEC.md` 的四个具名去向
- 新增 skill 或改变其阶段、上下游：同步更新 README 的 skill 总表
