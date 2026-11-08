// Screenshots of every scene in <harnessDir>/scenes/*.mjs, for a UI review:
//   node scripts/shots.mjs serve                    keep the dev server and the entry page up
//   node scripts/shots.mjs run [--only re] [--themes light,dark] [--lang zh|en] [--out dir] [--jobs 3]
// A scene is { id, title, harness, query?, eval?, size?, wait? }: the harness
// (<harnessDir>/<harness>.<ext>) is shown on the entry page with the query,
// `eval` runs on the settled page (a click that opens something), and the
// picture is taken in each theme. `run` reuses a server that `serve` keeps
// up, else starts its own. The pictures, manifest.json and index.html (every
// scene, the themes side by side, page errors under them) go to
// .shots/<time>/ unless --out says otherwise; a folder that has a run
// already keeps its other scenes.
import { mkdir, mkdtemp, readFile, readdir, rm, rmdir, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { pathToFileURL } from 'node:url';

// ── Per project ────────────────────────────────────────────────────────────
// The entry page loads a harness by name (?h=Name). SvelteKit below; for
// another stack see HARNESS.md in the ui-shots skill. The entry is written
// while a run lasts and removed after; keep it out of git (.gitignore).
const SVELTEKIT_ENTRY = `<script lang="ts">
	// Written by scripts/shots.mjs while it runs; not part of the app.
	const all = import.meta.glob<{ default: import('svelte').Component }>('../../../scripts/browser/*.svelte');
	const name = new URLSearchParams(location.search).get('h') ?? '';
	const load = all[\`../../../scripts/browser/\${name}.svelte\`];
</script>

{#if load}{#await load() then m}<m.default />{/await}{:else}<p style="padding:24px">No harness {name}</p>{/if}
`;
const CONFIG = {
	harnessDir: 'scripts/browser',
	// The dev server, run from the project root. The config adds harnessDir
	// to the files Vite may serve (shots.vite.config.js in the skill).
	server: ['node_modules/vite/bin/vite.js', '--config', 'scripts/shots.vite.config.js'],
	entry: { dir: 'src/routes/shots-dev', path: '/shots-dev', files: { '+page.svelte': SVELTEKIT_ENTRY } },
	// Runs in every page before the app: the interface language, flags the
	// app reads at start. __LANG__ is --lang.
	init: `try { localStorage.setItem('locale', '__LANG__') } catch {}`
};
// ───────────────────────────────────────────────────────────────────────────

const root = resolve(import.meta.dirname, '..');
const entryDir = join(root, CONFIG.entry.dir);
const args = process.argv.slice(2);
const cmd = args[0];
const opt = (name, def) => {
	const i = args.indexOf(`--${name}`);
	return i < 0 ? def : args[i + 1];
};
const port = Number(opt('port', process.env.SHOTS_PORT || 1440));
const base = `http://localhost:${port}${CONFIG.entry.path}`;
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 60_000) {
	const end = Date.now() + ms;
	while (Date.now() < end) {
		try {
			const v = await fn();
			if (v) return v;
		} catch {}
		await pause(150);
	}
	throw new Error('Timed out waiting for the browser or the dev server');
}
const up = async () => {
	try {
		return (await fetch(base)).ok;
	} catch {
		return false;
	}
};

// Only the entry's own files are removed, and its folder only when this
// script made it: an entry may share a folder with the app.
let madeDir = false;
async function writeEntry() {
	madeDir ||= !(await stat(entryDir).catch(() => null));
	await mkdir(entryDir, { recursive: true });
	for (const [name, content] of Object.entries(CONFIG.entry.files)) await writeFile(join(entryDir, name), content);
}
async function removeEntry() {
	for (const name of Object.keys(CONFIG.entry.files)) await rm(join(entryDir, name), { force: true });
	if (madeDir) await rmdir(entryDir).catch(() => {});
}
async function startServer() {
	await writeEntry();
	const server = spawn(process.execPath, [...CONFIG.server, '--port', String(port), '--strictPort'], { cwd: root, stdio: 'ignore' });
	await until(up, 90_000);
	return server;
}
async function stopServer(server) {
	if (server && server.exitCode === null) {
		server.kill();
		await once(server, 'exit');
	}
	await removeEntry();
}

async function loadScenes() {
	const dir = join(root, CONFIG.harnessDir, 'scenes');
	const files = (await readdir(dir)).filter((f) => f.endsWith('.mjs')).sort();
	const scenes = [];
	for (const f of files) {
		const list = (await import(pathToFileURL(join(dir, f)).href)).default;
		for (const s of list) scenes.push({ group: f.replace(/\.mjs$/, ''), ...s });
	}
	const ids = new Set();
	for (const s of scenes) {
		if (ids.has(s.id)) throw new Error(`Two scenes are called ${s.id}`);
		ids.add(s.id);
	}
	return scenes;
}

/** A headless Chrome and a way to drive one tab of it over the DevTools protocol. */
async function startChrome() {
	const profile = await mkdtemp(join(tmpdir(), 'ui-shots-'));
	const chrome = spawn(
		process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		['--headless', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'],
		{ stdio: 'ignore' }
	);
	const debugPort = await until(async () => (await readFile(join(profile, 'DevToolsActivePort'), 'utf8')).split('\n')[0]);
	const http = `http://127.0.0.1:${debugPort}`;
	return {
		async tab() {
			const t = await (await fetch(`${http}/json/new?about:blank`, { method: 'PUT' })).json();
			const ws = new WebSocket(t.webSocketDebuggerUrl);
			await once(ws, 'open');
			let seq = 0;
			const pending = new Map();
			const errors = [];
			ws.addEventListener('message', (e) => {
				const m = JSON.parse(e.data);
				if (m.id) {
					const p = pending.get(m.id);
					pending.delete(m.id);
					m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result);
				}
				if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text);
			});
			// A page that never answers (a busy loop, a promise that never
			// settles) fails its scene instead of holding up the run.
			const call = (method, params = {}) =>
				new Promise((res, rej) => {
					const id = ++seq;
					const timer = setTimeout(() => {
						pending.delete(id);
						rej(new Error(`timeout: ${method}`));
					}, 45_000);
					pending.set(id, { resolve: (v) => (clearTimeout(timer), res(v)), reject: (e) => (clearTimeout(timer), rej(e)) });
					ws.send(JSON.stringify({ id, method, params }));
				});
			await call('Runtime.enable');
			await call('Page.enable');
			return { call, errors, close: () => ws.close() };
		},
		async stop() {
			if (chrome.exitCode === null) {
				chrome.kill();
				await once(chrome, 'exit');
			}
			await rm(profile, { recursive: true, force: true, maxRetries: 3 });
		}
	};
}

// The first visit to a harness can land while Vite optimizes a dependency it
// just found and reloads; that load fails to import the harness. Try again.
// A page that drew nothing (still loading) is tried again too.
const STALE = /Failed to fetch dynamically imported module|Outdated Optimize Dep|^empty page$/;
async function shoot(tab, scene, theme, lang, file) {
	for (let attempt = 0; ; attempt++) {
		const errs = await shootOnce(tab, scene, theme, file);
		if (attempt >= 2 || !errs.some((e) => STALE.test(e))) return errs;
		await pause(2000);
	}
}
async function shootOnce(tab, scene, theme, file) {
	const [width, height] = (scene.size ?? '1440x900').split('x').map(Number);
	tab.errors.length = 0;
	await tab.call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: width < 600 });
	// Reduced motion: the app's animations finish at once (the spec asks
	// every app to honour it), so no picture lands mid-fade.
	await tab.call('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: theme }, { name: 'prefers-reduced-motion', value: 'reduce' }] });
	const q = new URLSearchParams(scene.query ?? '');
	q.set('h', scene.harness);
	await tab.call('Page.navigate', { url: `${base}?${q}` });
	await until(async () => (await tab.call('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true })).result.value === 'complete');
	// Fonts, data the harness loads, entrance animations.
	await pause(scene.wait ?? 1500);
	const drawn = await tab.call('Runtime.evaluate', { expression: 'document.body.innerText.trim().length > 0', returnByValue: true });
	if (!drawn.result.value) tab.errors.push('empty page');
	if (scene.eval) {
		const r = await tab.call('Runtime.evaluate', { expression: `(async () => { ${scene.eval} })()`, awaitPromise: true });
		if (r.exceptionDetails) tab.errors.push(`eval: ${r.exceptionDetails.exception?.description ?? r.exceptionDetails.text}`);
		await pause(900);
	}
	const shot = await tab.call('Page.captureScreenshot', { format: 'png' });
	await writeFile(file, Buffer.from(shot.data, 'base64'));
	return [...tab.errors];
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function gallery(results, themes, when) {
	const groups = new Map();
	for (const r of results) groups.set(r.group, [...(groups.get(r.group) ?? []), r]);
	const nav = [...groups.keys()].map((g) => `<a href="#${esc(g)}">${esc(g)} <span>${groups.get(g).length}</span></a>`).join('');
	const body = [...groups]
		.map(
			([g, list]) => `<section id="${esc(g)}"><h2>${esc(g)}</h2>${list
				.map(
					(r) => `<article><h3>${esc(r.title ?? r.id)} <code>${esc(r.id)}</code></h3><div class="pair">${themes
						.map((t) => (r.files[t] ? `<a href="${esc(r.files[t])}" target="_blank"><img loading="lazy" src="${esc(r.files[t])}" alt="${esc(r.id)} ${t}"></a>` : ''))
						.join('')}</div>${r.errors.length ? `<pre class="err">${esc(r.errors.join('\n'))}</pre>` : ''}</article>`
				)
				.join('')}</section>`
		)
		.join('');
	const failed = results.filter((r) => r.errors.length).length;
	return `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>界面截图 ${esc(when)}</title>
<style>
:root{color-scheme:light dark;--bg:#fafaf8;--fg:#15171c;--dim:#6b6f78;--line:#e4e4e0;--err:#c0392b}
@media (prefers-color-scheme:dark){:root{--bg:#0c0d10;--fg:#ececea;--dim:#8b8f98;--line:#24262b;--err:#ff7a6b}}
body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 -apple-system,"PingFang SC",sans-serif;display:grid;grid-template-columns:220px 1fr}
nav{position:sticky;top:0;height:100vh;overflow:auto;padding:20px 16px;border-right:1px solid var(--line)}
nav b{display:block;margin-bottom:12px}nav a{display:flex;justify-content:space-between;color:inherit;text-decoration:none;padding:4px 0}nav a span{color:var(--dim)}
main{padding:20px 28px;min-width:0}h2{margin:32px 0 12px;font-size:18px}h3{font-size:14px;font-weight:600;margin:20px 0 8px}h3 code{color:var(--dim);font-weight:400;margin-left:8px}
.pair{display:grid;grid-template-columns:repeat(${themes.length},minmax(0,1fr));gap:12px}.pair img{width:100%;border:1px solid var(--line);border-radius:6px;display:block}
.err{color:var(--err);white-space:pre-wrap;font-size:12px;margin:6px 0 0}
</style>
<nav><b>${results.length} 个场景 · ${themes.join(' / ')}${failed ? ` · ${failed} 个有报错` : ''}</b>${nav}</nav><main>${body}</main>`;
}

async function run() {
	const only = opt('only', '');
	const themes = opt('themes', 'light,dark').split(',');
	const lang = opt('lang', 'zh').startsWith('zh') ? 'zh' : 'en';
	const jobs = Number(opt('jobs', 3));
	const when = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '').replace(/^(\d{8})/, '$1-');
	const out = resolve(opt('out', join(root, '.shots', when)));
	const scenes = (await loadScenes()).filter((s) => !only || new RegExp(only).test(s.id));
	if (!scenes.length) throw new Error(`No scene matches ${only}`);
	await mkdir(out, { recursive: true });
	let vite = null;
	if (await up()) {
		// The entry's import.meta.glob is read once: rewriting the entry makes a
		// running server see harnesses added since it started.
		await writeEntry();
		await pause(1500);
	} else vite = await startServer();
	const chrome = await startChrome();
	const results = [];
	try {
		// One visit to each harness first, so Vite has optimized what they
		// import before any picture is taken.
		const warm = await chrome.tab();
		for (const h of new Set(scenes.map((s) => s.harness))) {
			await warm.call('Page.navigate', { url: `${base}?h=${h}` }).catch(() => {});
			await pause(1200);
		}
		warm.close();
		const queue = [...scenes];
		let done = 0;
		const openTab = async () => {
			const tab = await chrome.tab();
			await tab.call('Page.addScriptToEvaluateOnNewDocument', { source: CONFIG.init.replaceAll('__LANG__', lang) });
			return tab;
		};
		const worker = async () => {
			let tab = await openTab();
			for (let s = queue.shift(); s; s = queue.shift()) {
				const r = { id: s.id, title: s.title, group: s.group, files: {}, errors: [] };
				for (const theme of themes) {
					const name = `${s.id.replace(/[^\w.-]+/g, '_')}.${theme}.png`;
					// A timeout gets one more try, in a new tab (the old one may be stuck).
					for (let attempt = 0; attempt < 2; attempt++) {
						try {
							const errs = await shoot(tab, s, theme, lang, join(out, name));
							r.files[theme] = name;
							for (const e of errs) r.errors.push(`[${theme}] ${e}`);
							break;
						} catch (e) {
							const timedOut = /^timeout/.test(e.message);
							if (timedOut) {
								tab.close();
								tab = await openTab();
							}
							if (!timedOut || attempt === 1) {
								r.errors.push(`[${theme}] ${e.message}`);
								break;
							}
						}
					}
				}
				results.push(r);
				done++;
				console.log(`${String(done).padStart(3)}/${scenes.length} ${s.id}${r.errors.length ? `  ⚠ ${r.errors[0].split('\n')[0]}` : ''}`);
			}
			tab.close();
		};
		await Promise.all(Array.from({ length: Math.min(jobs, scenes.length) }, worker));
	} finally {
		await chrome.stop();
		if (vite) await stopServer(vite);
	}
	// Into a folder that has a run already (--out of an earlier run, say after
	// --only on what changed): these scenes replace theirs, the rest stay.
	const all = await loadScenes();
	const order = new Map(all.map((s, i) => [s.id, i]));
	const before = await readFile(join(out, 'manifest.json'), 'utf8').then(JSON.parse, () => null);
	const fresh = new Set(results.map((r) => r.id));
	const merged = [...(before?.scenes ?? []).filter((r) => !fresh.has(r.id) && order.has(r.id)), ...results];
	merged.sort((a, b) => order.get(a.id) - order.get(b.id));
	const stamp = before?.when ?? when;
	await writeFile(join(out, 'manifest.json'), JSON.stringify({ when: stamp, lang, themes, scenes: merged }, null, 2));
	await writeFile(join(out, 'index.html'), gallery(merged, themes, stamp));
	console.log(`\n${join(out, 'index.html')}`);
}

async function serve() {
	if (await up()) return console.log(`Already up: ${base}`);
	const vite = await startServer();
	console.log(`Serving ${base}?h=<harness> (Ctrl-C stops it)`);
	const stop = async () => {
		await stopServer(vite);
		process.exit(0);
	};
	process.on('SIGINT', stop);
	process.on('SIGTERM', stop);
	await once(vite, 'exit');
	await removeEntry();
}

if (cmd === 'serve') await serve();
else if (cmd === 'run') await run();
else console.log('usage: node scripts/shots.mjs serve | run [--only re] [--themes light,dark] [--lang zh|en] [--out dir] [--jobs 3]');
