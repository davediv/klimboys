<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();
	
	// Don't show header/footer on dashboard routes
	let showHeaderFooter = $derived(!$page.url.pathname.startsWith('/dashboard'));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col">
	{#if showHeaderFooter}
		<Header user={data.user} />
	{/if}
	<main class="flex-1">
		{@render children?.()}
	</main>
	{#if showHeaderFooter}
		<Footer />
	{/if}
</div>
