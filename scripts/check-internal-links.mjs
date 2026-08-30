import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, sep } from 'node:path';

const projectRoot = new URL('../', import.meta.url);
const sourceRoot = new URL('../src/', import.meta.url);
const routesRoot = new URL('../src/routes/', import.meta.url);
const sourceExtensions = new Set(['.js', '.mjs', '.svelte', '.ts']);

async function walk(directoryUrl) {
	const entries = await readdir(directoryUrl, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directoryUrl);
		if (entry.isDirectory()) files.push(...(await walk(entryUrl)));
		else files.push(entryUrl);
	}

	return files;
}

function routePath(fileUrl) {
	const relativePath = relative(routesRoot.pathname, new URL('./', fileUrl).pathname);
	const segments = relativePath
		.split(sep)
		.filter(Boolean)
		.filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')));

	return `/${segments.join('/')}`.replace(/\/$/, '') || '/';
}

function routeMatches(pathname, route) {
	const routeSegments = route.split('/').filter(Boolean);
	const pathSegments = pathname.split('/').filter(Boolean);
	if (routeSegments.length !== pathSegments.length) return false;

	return routeSegments.every(
		(segment, index) =>
			(segment.startsWith('[') && segment.endsWith(']')) || segment === pathSegments[index]
	);
}

const routeFiles = (await walk(routesRoot)).filter((fileUrl) =>
	['+page.svelte', '+server.ts'].some((filename) => fileUrl.pathname.endsWith(filename))
);
const availableRoutes = new Set(routeFiles.map(routePath));
const sourceFiles = (await walk(sourceRoot)).filter((fileUrl) =>
	sourceExtensions.has(extname(fileUrl.pathname))
);
const unresolved = [];
const hrefPattern = /\bhref\s*(?:=|:)\s*["'](\/[^"']*)["']/g;

for (const fileUrl of sourceFiles) {
	const source = await readFile(fileUrl, 'utf8');
	for (const match of source.matchAll(hrefPattern)) {
		const href = match[1];
		const pathname = href.split(/[?#]/, 1)[0] || '/';
		if (![...availableRoutes].some((route) => routeMatches(pathname, route))) {
			unresolved.push(`${relative(projectRoot.pathname, fileUrl.pathname)}: ${href}`);
		}
	}
}

if (unresolved.length > 0) {
	console.error('Unresolved internal links:');
	for (const entry of unresolved) console.error(`- ${entry}`);
	process.exitCode = 1;
} else {
	console.log(`Internal link check passed (${availableRoutes.size} routes scanned).`);
}
