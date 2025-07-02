<script lang="ts">
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import type { ComponentType } from 'svelte';
	import { Loader2 } from '@lucide/svelte';

	interface ButtonProps extends HTMLButtonAttributes {
		variant?:
			| 'primary'
			| 'secondary'
			| 'accent'
			| 'ghost'
			| 'link'
			| 'info'
			| 'success'
			| 'warning'
			| 'error';
		size?: 'xs' | 'sm' | 'md' | 'lg';
		outline?: boolean;
		wide?: boolean;
		block?: boolean;
		circle?: boolean;
		square?: boolean;
		loading?: boolean;
		disabled?: boolean;
		active?: boolean;
		glass?: boolean;
		noAnimation?: boolean;
		href?: string;
		external?: boolean;
		icon?: ComponentType;
		iconPosition?: 'left' | 'right';
		iconClass?: string;
		loadingText?: string;
		children?: any;
		class?: string;
		onclick?: (e: MouseEvent) => void;
	}

	let {
		variant = 'primary',
		size = 'md',
		outline = false,
		wide = false,
		block = false,
		circle = false,
		square = false,
		loading = false,
		disabled = false,
		active = false,
		glass = false,
		noAnimation = false,
		href,
		external = false,
		icon: Icon,
		iconPosition = 'left',
		iconClass = '',
		loadingText = 'Loading...',
		children,
		class: className = '',
		onclick,
		...restProps
	}: ButtonProps = $props();

	// Separate props for anchor vs button elements
	const buttonProps = href ? {} : restProps;
	const anchorProps = href
		? Object.fromEntries(
				Object.entries(restProps).filter(
					([key]) => !key.startsWith('form') && !key.includes('validity')
				)
			)
		: {};

	// Build button classes
	const buttonClasses = $derived(() => {
		const classes = ['btn'];

		// Variant
		if (variant && !loading) {
			classes.push(`btn-${variant}`);
		} else if (loading) {
			classes.push('btn-disabled');
		}

		// Size
		if (size !== 'md') {
			classes.push(`btn-${size}`);
		}

		// Modifiers
		if (outline) classes.push('btn-outline');
		if (wide) classes.push('btn-wide');
		if (block) classes.push('btn-block');
		if (circle) classes.push('btn-circle');
		if (square) classes.push('btn-square');
		if (active) classes.push('btn-active');
		if (glass) classes.push('glass');
		if (noAnimation) classes.push('no-animation');
		if (loading) classes.push('pointer-events-none');

		// Custom class
		if (className) classes.push(className);

		return classes.join(' ');
	});

	// Icon size based on button size
	const iconSize = $derived(() => {
		switch (size) {
			case 'xs':
				return 'h-3 w-3';
			case 'sm':
				return 'h-4 w-4';
			case 'lg':
				return 'h-6 w-6';
			default:
				return 'h-5 w-5';
		}
	});

	// Loading icon classes
	const loadingIconClasses = $derived(() => {
		return `${iconSize()} animate-spin ${iconClass}`;
	});

	// Regular icon classes
	const regularIconClasses = $derived(() => {
		return `${iconSize()} ${iconClass}`;
	});

	// Handle click
	function handleClick(e: MouseEvent) {
		if (!disabled && !loading && onclick) {
			onclick(e);
		}
	}
</script>

{#if href}
	<a
		{href}
		target={external ? '_blank' : undefined}
		rel={external ? 'noopener noreferrer' : undefined}
		class={buttonClasses()}
		aria-disabled={disabled || loading}
		tabindex={disabled || loading ? -1 : undefined}
		{...anchorProps}
	>
		{#if loading && iconPosition === 'left'}
			<Loader2 class={loadingIconClasses()} />
		{/if}

		{#if Icon && !loading && iconPosition === 'left'}
			<Icon class={regularIconClasses()} />
		{/if}

		{#if loading && loadingText}
			{loadingText}
		{:else if children}
			{@render children()}
		{/if}

		{#if Icon && !loading && iconPosition === 'right'}
			<Icon class={regularIconClasses()} />
		{/if}

		{#if loading && iconPosition === 'right'}
			<Loader2 class={loadingIconClasses()} />
		{/if}
	</a>
{:else}
	<button
		type="button"
		class={buttonClasses()}
		disabled={disabled || loading}
		aria-busy={loading}
		onclick={handleClick}
		{...buttonProps}
	>
		{#if loading && iconPosition === 'left'}
			<Loader2 class={loadingIconClasses()} />
		{/if}

		{#if Icon && !loading && iconPosition === 'left'}
			<Icon class={regularIconClasses()} />
		{/if}

		{#if loading && loadingText}
			{loadingText}
		{:else if children}
			{@render children()}
		{/if}

		{#if Icon && !loading && iconPosition === 'right'}
			<Icon class={regularIconClasses()} />
		{/if}

		{#if loading && iconPosition === 'right'}
			<Loader2 class={loadingIconClasses()} />
		{/if}
	</button>
{/if}
