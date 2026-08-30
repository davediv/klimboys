<script lang="ts">
	import favicon from '$lib/assets/favicon.ico';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<a
	href="#public-main-content"
	class="sr-only z-[1000] rounded bg-white px-4 py-2 text-ink shadow focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
>
	Skip to main content
</a>

<div class="flex min-h-screen flex-col">
	<Header user={data.user} />
	<main id="public-main-content" tabindex="-1" class="flex-1">
		{@render children()}
	</main>
	<Footer business={data.business} />
</div>
