// The app's Vite config, plus the screenshot harnesses in scripts/ among the
// files the dev server may serve (scripts/shots.mjs loads them on demand).
import app from '../vite.config.js';

export default async (env) => {
	const config = await (typeof app === 'function' ? app(env) : app);
	return { ...config, server: { ...config.server, fs: { ...config.server?.fs, allow: [...(config.server?.fs?.allow ?? []), 'scripts'] } } };
};
