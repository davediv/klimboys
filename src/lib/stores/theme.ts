import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'light' | 'dark';

// Check for saved theme in localStorage or default to light
function getInitialTheme(): Theme {
	if (!browser) return 'light';

	const saved = localStorage.getItem('theme');
	if (saved === 'light' || saved === 'dark') {
		return saved;
	}

	// Check system preference
	if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
		return 'dark';
	}

	return 'light';
}

// Create the theme store
export const theme = writable<Theme>(getInitialTheme());

// Function to toggle theme
export function toggleTheme() {
	theme.update((current) => {
		const newTheme = current === 'light' ? 'dark' : 'light';

		if (browser) {
			localStorage.setItem('theme', newTheme);
			document.documentElement.setAttribute('data-theme', newTheme);
		}

		return newTheme;
	});
}

// Function to set specific theme
export function setTheme(newTheme: Theme) {
	theme.set(newTheme);

	if (browser) {
		localStorage.setItem('theme', newTheme);
		document.documentElement.setAttribute('data-theme', newTheme);
	}
}

// Initialize theme on client
if (browser) {
	theme.subscribe((value) => {
		document.documentElement.setAttribute('data-theme', value);
	});
}
