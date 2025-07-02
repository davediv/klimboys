<script lang="ts">
	import DashboardHeader from '$lib/components/DashboardHeader.svelte';
	import DashboardSidebar from '$lib/components/DashboardSidebar.svelte';
	import DashboardMobileSidebar from '$lib/components/DashboardMobileSidebar.svelte';
	import DashboardFooter from '$lib/components/DashboardFooter.svelte';
	import type { PageData } from './$types';

	let { children, data } = $props<{ children: any; data: PageData }>();

	let sidebarOpen = $state(false);

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

<div class="flex min-h-screen">
	<!-- Desktop Sidebar -->
	<DashboardSidebar session={data.session} />

	<!-- Mobile Sidebar -->
	<DashboardMobileSidebar
		isOpen={sidebarOpen}
		onclose={() => (sidebarOpen = false)}
		session={data.session}
	/>

	<!-- Main Content -->
	<div class="flex flex-1 flex-col">
		<!-- Header -->
		<DashboardHeader user={data.session.user} onmenuclick={toggleSidebar} />

		<!-- Page Content -->
		<main class="bg-base-200 flex-1 p-3 sm:p-6">
			{@render children()}
		</main>

		<!-- Footer -->
		<DashboardFooter />
	</div>
</div>
