# 测试页与假数据

`ui-shots` 的参考：怎么写测试页、怎么造假数据，以及已经踩过的坑。

## 测试页

测试页是一个组件，放在测试页目录（默认 `scripts/browser/`）。它挂载应用的真实组件，并把组件的数据来源换成假数据，查询参数决定显示哪个状态。

- **换数据来源，不改应用代码**：直接给状态仓库赋值；用桩函数替换请求方法（按路径返回假数据）；替换宿主能力，例如 Tauri 的 `invoke`、本机后台服务的连接、`fetch`。实在要改应用才能显示的界面，跳过并在交付时写明原因。
- **拼窗口，不挂外壳**：应用外壳通常依赖宿主和后台，挂不起来。按外壳的结构和宽度，用真实的导航栏、侧栏、标题栏拼一个外框。主区放要截的页面，截出来和真实窗口一致。
- **宿主专属界面**：有的分区只在桌面版出现（读启动时注入的标记）。做法是用 iframe 加载内页，在内页脚本运行前写入这个标记。
- **只截真实会出现的状态**：先读组件的显示条件再造状态。例如更新弹窗只在「必须更新」时才显示下载进度，单独造「下载中」只会得到空白页。
- **文件头注释**写清显示什么、接受哪些查询参数，场景文件只引用这些参数。
- **截稳定画面**：关掉动画，`prefers-reduced-motion` 返回 true，CSS 动画时长压到 1ms，否则弹窗淡入到一半就被截下来。弹窗类场景的 `wait` 多给一两秒。

## 假数据

- 全项目用同一批人名、项目、智能体或客户，各页面之间互相对得上。
- 像真实在用：标题、正文、编号、分支、金额都按真实业务写。时间分布在几分钟到几天之间，有已读和未读，有成功也有失败。
- 不出现「测试」「示例」、test、demo、foo 这类字样。真实命令里的 `pnpm test` 不算。
- 依赖当天日期的逻辑（星期几、月末），换一天跑截图结果就不同。需要稳定时，在测试页里固定时间。

## 其他技术栈的入口页

`CONFIG.entry` 是运行期间写入、结束后删除的文件。SvelteKit 用路由（默认配置）。普通 Vite 加 Vue 时，在项目根目录写两个文件，`path` 设为 `/shots.html`：

```js
entry: {
	dir: '.',
	path: '/shots.html',
	files: {
		'shots.html': '<!doctype html><meta charset="utf-8"><div id="app"></div><script type="module" src="/shots-entry.ts"></script>',
		'shots-entry.ts': `import { createApp } from 'vue';
import '/src/styles/main.css'; // 应用的全局样式
const all = import.meta.glob('/scripts/browser/*.vue');
const name = new URLSearchParams(location.search).get('h') ?? '';
const load = all['/scripts/browser/' + name + '.vue'];
if (load) load().then((m: any) => createApp(m.default).mount('#app'));
else document.body.textContent = 'No harness ' + name;`
	}
}
```

React 把 `createApp(...).mount` 换成 `createRoot(document.getElementById('app')!).render(createElement(m.default))`。入口里要引入应用的全局样式和主题初始化，测试页才是真实样式。程序只删 `files` 里列出的文件；目录是程序自己建的，才连目录一起删。

## 已知的坑

- **403 / Failed to fetch dynamically imported module**：框架只允许 Vite 提供 `src` 等目录下的文件，测试页目录要用 `shots.vite.config.js` 放行。
- **新加的测试页显示 No harness**：`import.meta.glob` 在入口页编译时只读一次。`run` 开始时会重写入口页；手动调试时，保存一下入口页即可。
- **首次访问空白**：Vite 发现新依赖后会重载页面。`run` 已经做了预热、空白重试和超时重试，换一个新标签页再试。
- **报错层盖住截图**：修好对应的测试页。用 CSS 藏掉 Vite 的报错层，会连真实错误一起藏掉。
- **并行子代理**：共用一个 `serve`。各自启动服务器会互相抢端口，入口文件也会被反复重写。
