import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import {
	PUBLIC_CONFIG_KEYS,
	validatePublicEnvironment
} from '../src/lib/server/public-business.js';

const projectRoot = new URL('../', import.meta.url);
const runtimeRoots = [
	new URL('../src/routes/', import.meta.url),
	new URL('../src/lib/components/', import.meta.url)
];
const sourceExtensions = new Set(['.js', '.mjs', '.svelte', '.ts']);
const forbiddenRuntimeContent = [
	{ pattern: /replace with (?:your|the|an|actual)/i, reason: 'replacement instruction' },
	{ pattern: /within 30 minutes/i, reason: 'unverified delivery promise' },
	{ pattern: /thousands of happy customers/i, reason: 'unverified customer-count claim' },
	{ pattern: /Sarah Johnson|Mike Chen|Lisa Anderson/, reason: 'sample testimonial identity' },
	{ pattern: /verified customer/i, reason: 'unsourced review verification claim' },
	{ pattern: /6282112345678|\+62 21 1234 5678/, reason: 'known placeholder phone number' },
	{ pattern: /hello@klimboys\.com/i, reason: 'known placeholder email address' },
	{
		pattern: /klimboys-delivery|now-food\/shop\/klimboys/i,
		reason: 'known placeholder delivery destination'
	}
];

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

const modeArgumentIndex = process.argv.indexOf('--mode');
const mode = modeArgumentIndex >= 0 ? process.argv[modeArgumentIndex + 1] : 'production';
const loadedEnvironment = loadEnv(mode || 'production', fileURLToPath(projectRoot), '');
const environment = { ...loadedEnvironment, ...process.env };
const issues = validatePublicEnvironment(environment);

for (const runtimeRoot of runtimeRoots) {
	const files = (await walk(runtimeRoot)).filter((fileUrl) =>
		sourceExtensions.has(fileUrl.pathname.slice(fileUrl.pathname.lastIndexOf('.')))
	);
	for (const fileUrl of files) {
		const source = await readFile(fileUrl, 'utf8');
		for (const forbidden of forbiddenRuntimeContent) {
			if (forbidden.pattern.test(source)) {
				issues.push(
					`${fileURLToPath(fileUrl).replace(`${fileURLToPath(projectRoot)}/`, '')} contains a ${forbidden.reason}.`
				);
			}
		}
	}
}

if (issues.length > 0) {
	console.error('Public configuration check failed:');
	for (const issue of issues) console.error(`- ${issue}`);
	process.exitCode = 1;
} else {
	const configuredCount = PUBLIC_CONFIG_KEYS.filter((key) =>
		Boolean(environment[key]?.trim())
	).length;
	console.log(`Public configuration check passed (${configuredCount} optional values configured).`);
}
