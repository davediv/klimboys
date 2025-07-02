<script lang="ts">
	import { useSession } from '$lib/auth';
	import {
		Users,
		Activity,
		TrendingUp,
		DollarSign,
		ArrowUpRight,
		ArrowDownLeft
	} from '@lucide/svelte';

	const session = useSession();

	// Mock data for dashboard
	const stats = [
		{
			title: 'Total Users',
			value: '2,543',
			change: '+12.5%',
			trend: 'up',
			icon: Users
		},
		{
			title: 'Active Sessions',
			value: '1,247',
			change: '+5.2%',
			trend: 'up',
			icon: Activity
		},
		{
			title: 'Revenue',
			value: '$45,623',
			change: '+18.7%',
			trend: 'up',
			icon: DollarSign
		},
		{
			title: 'Conversion Rate',
			value: '3.24%',
			change: '-2.1%',
			trend: 'down',
			icon: TrendingUp
		}
	];
</script>

<svelte:head>
	<title>Dashboard - Overview</title>
</svelte:head>

<div class="container mx-auto space-y-6 p-6">
	<!-- Welcome Section -->
	<div class="text-center sm:text-left">
		<h1 class="text-2xl font-bold sm:text-3xl">
			Welcome back, {$session.data?.user.name || 'Test'}!
		</h1>
		<p class="text-base-content/60 mt-2 text-sm sm:text-base">
			Here's what's happening with your dashboard today.
		</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat (stat.title)}
			{@const Icon = stat.icon}
			<div class="card bg-base-100 shadow-md">
				<div class="card-body p-5">
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<p class="text-base-content/60 text-sm font-medium">{stat.title}</p>
							<p class="mt-2 text-3xl font-bold">{stat.value}</p>
						</div>
						<div class="text-primary">
							<Icon class="h-8 w-8" />
						</div>
					</div>
					<div class="mt-4 flex items-center justify-end text-sm">
						<span class="{stat.trend === 'up' ? 'text-success' : 'text-error'} font-medium">
							{stat.change}
						</span>
						<span class="text-base-content/60 ml-2"> from last month </span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Content Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Chart Placeholder -->
		<div class="lg:col-span-2">
			<div class="card bg-base-100 border-base-300 border shadow-sm">
				<div class="card-body">
					<h3 class="card-title text-lg">Analytics Overview</h3>
					<div class="bg-base-200 mt-4 flex h-64 items-center justify-center rounded-lg">
						<div class="text-center">
							<TrendingUp class="text-base-content/50 mx-auto mb-2 h-12 w-12" />
							<p class="text-base-content/70">Chart placeholder</p>
							<p class="text-base-content/50 text-sm">Analytics data will be displayed here</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
