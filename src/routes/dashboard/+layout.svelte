<script lang="ts">
	import '../../app.css';
	import favicon from '$lib/assets/favicon.ico';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import { page } from '$app/stores';
	import type { LayoutData } from './$types';

	let { children, data }: { children: any; data: LayoutData } = $props();

	// Get page title based on current route
	let pageTitle = $derived(() => {
		const path = $page.url.pathname;
		if (path === '/dashboard') return 'Dashboard';
		if (path.includes('/transaction')) return 'Transactions';
		if (path.includes('/products')) return 'Products';
		if (path.includes('/reports')) return 'Reports';
		if (path.includes('/users')) return 'Users';
		if (path.includes('/settings')) return 'Settings';
		return 'Dashboard';
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- All dashboard pages use the same layout -->
<DashboardLayout user={data.user} title={pageTitle()}>
	{@render children?.()}
</DashboardLayout>
