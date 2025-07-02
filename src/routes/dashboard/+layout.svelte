<script lang="ts">
	import { useSession } from '$lib/auth';
	import { goto } from '$app/navigation';
	import DashboardHeader from '$lib/components/DashboardHeader.svelte';
	import DashboardSidebar from '$lib/components/DashboardSidebar.svelte';
	import DashboardMobileSidebar from '$lib/components/DashboardMobileSidebar.svelte';
	import DashboardFooter from '$lib/components/DashboardFooter.svelte';

	let { children } = $props();

	const session = useSession();
	let sidebarOpen = $state(false);

	$effect(() => {
		// Redirect to login if not authenticated
		const unsubscribe = session.subscribe((s) => {
			if (s.data === null && !s.isPending) {
				goto('/login');
			}
		});

		return unsubscribe;
	});

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}
</script>

{#if $session.data}
	<div class="flex min-h-screen">
		<!-- Desktop Sidebar -->
		<DashboardSidebar />

		<!-- Mobile Sidebar -->
		<DashboardMobileSidebar isOpen={sidebarOpen} onclose={() => (sidebarOpen = false)} />

		<!-- Main Content -->
		<div class="flex flex-1 flex-col">
			<!-- Header -->
			<DashboardHeader user={$session.data.user} onmenuclick={toggleSidebar} />

			<!-- Page Content -->
			<main class="bg-base-200 flex-1 p-3 sm:p-6">
				{@render children()}
			</main>

			<!-- Footer -->
			<DashboardFooter />
		</div>
	</div>
{:else if $session.isPending}
	<div class="flex min-h-screen items-center justify-center">
		<div class="loading loading-spinner loading-lg"></div>
	</div>
{/if}
