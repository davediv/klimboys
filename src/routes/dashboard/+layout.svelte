<script lang="ts">
	import '../../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import { getStaffPageTitle } from '$lib/navigation';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { children, data }: { children: Snippet; data: LayoutData } = $props();

	// Get page title based on current route
	let pageTitle = $derived(getStaffPageTitle($page.url.pathname));
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- All dashboard pages use the same layout -->
<DashboardLayout user={data.user} title={pageTitle}>
	{@render children?.()}
</DashboardLayout>
