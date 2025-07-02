<script lang="ts">
	import { Sun, Moon } from '@lucide/svelte';
	import { theme, toggleTheme } from '$lib/stores/theme';

	function handleToggle() {
		toggleTheme();
	}
</script>

<button
	class="btn btn-ghost btn-circle"
	onclick={handleToggle}
	aria-label="Toggle theme"
	title="Toggle theme"
>
	{#if $theme === 'light'}
		<Moon class="h-5 w-5" />
	{:else}
		<Sun class="h-5 w-5" />
	{/if}
</button>
