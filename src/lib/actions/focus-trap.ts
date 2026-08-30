import type { Action } from 'svelte/action';

const FOCUSABLE_SELECTOR = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

function focusableElements(node: HTMLElement): HTMLElement[] {
	return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
		(element) =>
			element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true'
	);
}

export const focusTrap: Action<HTMLElement, boolean | undefined> = (node, enabled = true) => {
	let active = false;
	let previouslyFocused: HTMLElement | null = null;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;
		const elements = focusableElements(node);
		if (elements.length === 0) {
			event.preventDefault();
			node.focus();
			return;
		}

		const first = elements[0];
		const last = elements[elements.length - 1];
		if (event.shiftKey && document.activeElement === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && document.activeElement === last) {
			event.preventDefault();
			first.focus();
		}
	}

	function activate() {
		if (active) return;
		active = true;
		previouslyFocused =
			document.activeElement instanceof HTMLElement ? document.activeElement : null;
		node.addEventListener('keydown', handleKeydown);
		queueMicrotask(() => {
			const initial =
				node.querySelector<HTMLElement>('[data-autofocus]') ?? focusableElements(node)[0] ?? node;
			initial.focus();
		});
	}

	function deactivate(restoreFocus = true) {
		if (!active) return;
		active = false;
		node.removeEventListener('keydown', handleKeydown);
		if (restoreFocus && previouslyFocused?.isConnected) previouslyFocused.focus();
		previouslyFocused = null;
	}

	if (enabled) activate();

	return {
		update(nextEnabled = true) {
			if (nextEnabled) activate();
			else deactivate();
		},
		destroy() {
			deactivate();
		}
	};
};
