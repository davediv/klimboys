<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import CashierPerformanceChart from '$lib/components/charts/CashierPerformanceChart.svelte';
	import { ArrowLeft, TrendingUp, TrendingDown, Award, Clock, ShoppingBag, DollarSign } from '@lucide/svelte';
	import { jakartaTime } from '$lib/utils/datetime';
	import type { PageData } from './$types';
	import { Chart, registerables } from 'chart.js';

	// Register Chart.js components
	Chart.register(...registerables);

	let { data }: { data: PageData } = $props();

	let weeklyTrendCanvas: HTMLCanvasElement;
	let hourlyPatternCanvas: HTMLCanvasElement;
	let channelDistCanvas: HTMLCanvasElement;
	let weeklyChart: Chart | null = null;
	let hourlyChart: Chart | null = null;
	let channelChart: Chart | null = null;

	// Calculate performance metrics
	const topPerformer = $derived(data.cashierSummary[0] || null);
	const totalRevenue = $derived(
		data.cashierSummary.reduce((sum, c) => sum + c.totalRevenue, 0)
	);
	const totalTransactions = $derived(
		data.cashierSummary.reduce((sum, c) => sum + c.totalTransactions, 0)
	);

	// Create weekly trend chart
	function createWeeklyTrendChart() {
		if (!weeklyTrendCanvas || !data.weeklyTrend.length) return;

		if (weeklyChart) {
			weeklyChart.destroy();
			weeklyChart = null;
		}

		const ctx = weeklyTrendCanvas.getContext('2d');
		if (!ctx) return;

		// Group data by date and cashier
		const dateMap = new Map<string, Map<string, number>>();
		const cashiers = new Set<string>();

		data.weeklyTrend.forEach(item => {
			if (!dateMap.has(item.date)) {
				dateMap.set(item.date, new Map());
			}
			dateMap.get(item.date)!.set(item.cashierName, item.revenue);
			cashiers.add(item.cashierName);
		});

		const sortedDates = Array.from(dateMap.keys()).sort();
		const cashierArray = Array.from(cashiers);

		const datasets = cashierArray.map((cashier, index) => ({
			label: cashier,
			data: sortedDates.map(date => dateMap.get(date)?.get(cashier) || 0),
			borderColor: `hsl(${index * 60}, 70%, 50%)`,
			backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.1)`,
			borderWidth: 2,
			tension: 0.3
		}));

		weeklyChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: sortedDates.map(date => {
					const d = new Date(date);
					return jakartaTime.days[d.getDay()].substring(0, 3);
				}),
				datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
						labels: {
							font: {
								size: 12
							}
						}
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								return `${context.dataset.label}: IDR ${context.parsed.y.toLocaleString('id-ID')}`;
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: function(value) {
								return 'IDR ' + (value as number).toLocaleString('id-ID');
							}
						}
					}
				}
			}
		});
	}

	// Create hourly pattern chart
	function createHourlyPatternChart() {
		if (!hourlyPatternCanvas || !data.hourlyPattern.length) return;

		if (hourlyChart) {
			hourlyChart.destroy();
			hourlyChart = null;
		}

		const ctx = hourlyPatternCanvas.getContext('2d');
		if (!ctx) return;

		// Group by cashier
		const cashierMap = new Map<string, { hours: number[], transactions: number[] }>();

		data.hourlyPattern.forEach(item => {
			if (!cashierMap.has(item.cashierName)) {
				cashierMap.set(item.cashierName, { hours: [], transactions: [] });
			}
			const cashierData = cashierMap.get(item.cashierName)!;
			cashierData.hours.push(item.hour);
			cashierData.transactions.push(item.transactions);
		});

		const hours = Array.from({ length: 24 }, (_, i) => i);
		const datasets = Array.from(cashierMap.entries()).map(([cashier, data], index) => {
			const hourlyData = hours.map(hour => {
				const idx = data.hours.indexOf(hour);
				return idx >= 0 ? data.transactions[idx] : 0;
			});

			return {
				label: cashier,
				data: hourlyData,
				borderColor: `hsl(${index * 60}, 70%, 50%)`,
				backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.1)`,
				borderWidth: 2,
				tension: 0.3
			};
		});

		hourlyChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: hours.map(h => `${h}:00`),
				datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
						labels: {
							font: {
								size: 12
							}
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Transactions'
						}
					}
				}
			}
		});
	}

	// Create channel distribution chart
	function createChannelDistChart() {
		if (!channelDistCanvas || !data.channelPreference.length) return;

		if (channelChart) {
			channelChart.destroy();
			channelChart = null;
		}

		const ctx = channelDistCanvas.getContext('2d');
		if (!ctx) return;

		// Group by cashier and aggregate channels
		const cashierChannels = new Map<string, Map<string, number>>();

		data.channelPreference.forEach(item => {
			if (!cashierChannels.has(item.cashierName)) {
				cashierChannels.set(item.cashierName, new Map());
			}
			cashierChannels.get(item.cashierName)!.set(item.channel, item.transactions);
		});

		const channels = ['store', 'grabfood', 'gofood', 'shopeefood', 'ubereats'];
		const datasets = Array.from(cashierChannels.entries()).map(([cashier, channelData], index) => ({
			label: cashier,
			data: channels.map(channel => channelData.get(channel) || 0),
			backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.8)`,
			borderColor: `hsl(${index * 60}, 70%, 50%)`,
			borderWidth: 1
		}));

		channelChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: channels.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
				datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: {
						position: 'top',
						labels: {
							font: {
								size: 12
							}
						}
					}
				},
				scales: {
					x: {
						stacked: false
					},
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Transactions'
						}
					}
				}
			}
		});
	}

	$effect(() => {
		createWeeklyTrendChart();
		createHourlyPatternChart();
		createChannelDistChart();

		return () => {
			if (weeklyChart) {
				weeklyChart.destroy();
				weeklyChart = null;
			}
			if (hourlyChart) {
				hourlyChart.destroy();
				hourlyChart = null;
			}
			if (channelChart) {
				channelChart.destroy();
				channelChart = null;
			}
		};
	});
</script>

<svelte:head>
	<title>Cashier Performance - Klimboys Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<div class="flex items-center gap-4">
				<Button href="/dashboard" variant="ghost" size="sm" icon={ArrowLeft}>
					Back
				</Button>
			</div>
			<h1 class="mt-2 text-3xl font-bold">Cashier Performance</h1>
			<p class="text-base-content/70 mt-1">Track and analyze individual cashier metrics</p>
		</div>
	</div>

	<!-- Summary Cards -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="bg-base-100 rounded-box p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-base-content/70 text-sm">Top Performer</p>
					<p class="mt-1 text-2xl font-bold">
						{topPerformer ? topPerformer.cashierName : 'N/A'}
					</p>
					{#if topPerformer}
						<p class="text-sm text-success">
							IDR {topPerformer.totalRevenue.toLocaleString('id-ID')}
						</p>
					{/if}
				</div>
				<Award class="text-warning h-8 w-8" />
			</div>
		</div>

		<div class="bg-base-100 rounded-box p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-base-content/70 text-sm">Total Revenue</p>
					<p class="mt-1 text-2xl font-bold">
						IDR {totalRevenue.toLocaleString('id-ID')}
					</p>
					<p class="text-base-content/50 text-sm">All cashiers combined</p>
				</div>
				<DollarSign class="text-success h-8 w-8" />
			</div>
		</div>

		<div class="bg-base-100 rounded-box p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-base-content/70 text-sm">Total Transactions</p>
					<p class="mt-1 text-2xl font-bold">{totalTransactions.toLocaleString()}</p>
					<p class="text-base-content/50 text-sm">This month</p>
				</div>
				<ShoppingBag class="text-primary h-8 w-8" />
			</div>
		</div>

		<div class="bg-base-100 rounded-box p-6 shadow">
			<div class="flex items-center justify-between">
				<div>
					<p class="text-base-content/70 text-sm">Active Cashiers</p>
					<p class="mt-1 text-2xl font-bold">{data.cashierSummary.length}</p>
					<p class="text-base-content/50 text-sm">With transactions</p>
				</div>
				<Clock class="text-info h-8 w-8" />
			</div>
		</div>
	</div>

	<!-- Performance Ranking Table -->
	<div class="bg-base-100 rounded-box shadow">
		<div class="p-6">
			<h3 class="mb-4 text-lg font-semibold">Performance Rankings</h3>
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Rank</th>
							<th>Cashier</th>
							<th>Revenue</th>
							<th>Transactions</th>
							<th>Avg Transaction</th>
							<th>Last Active</th>
							<th>Performance</th>
						</tr>
					</thead>
					<tbody>
						{#each data.cashierSummary as cashier, index}
							<tr>
								<td>
									<div class="flex items-center gap-2">
										{#if index === 0}
											<Award class="text-warning h-4 w-4" />
										{/if}
										<span class="font-medium">#{index + 1}</span>
									</div>
								</td>
								<td>
									<div>
										<div class="font-medium">{cashier.cashierName}</div>
										<div class="text-base-content/70 text-sm">{cashier.cashierEmail}</div>
									</div>
								</td>
								<td>
									<div>
										<div class="font-medium">
											IDR {cashier.totalRevenue.toLocaleString('id-ID')}
										</div>
										<div class="text-base-content/50 text-xs">
											Rank #{cashier.revenueRank}
										</div>
									</div>
								</td>
								<td>
									<div>
										<div class="font-medium">{cashier.totalTransactions}</div>
										<div class="text-base-content/50 text-xs">
											Rank #{cashier.transactionRank}
										</div>
									</div>
								</td>
								<td>
									<div>
										<div class="font-medium">
											IDR {Math.round(cashier.avgTransactionValue).toLocaleString('id-ID')}
										</div>
										<div class="text-base-content/50 text-xs">
											Rank #{cashier.avgValueRank}
										</div>
									</div>
								</td>
								<td>
									<span class="text-sm">
										{cashier.lastTransactionDate 
											? jakartaTime.relative(cashier.lastTransactionDate)
											: 'Never'}
									</span>
								</td>
								<td>
									<div class="flex gap-1">
										{#if cashier.revenueRank <= 3}
											<TrendingUp class="text-success h-4 w-4" />
										{:else if cashier.revenueRank > data.cashierSummary.length - 3}
											<TrendingDown class="text-error h-4 w-4" />
										{:else}
											<span class="text-base-content/50">-</span>
										{/if}
									</div>
								</td>
							</tr>
						{:else}
							<tr>
								<td colspan="7" class="text-center text-base-content/50">
									No cashier data available
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Today's Performance -->
	<div class="grid gap-6 lg:grid-cols-2">
		<CashierPerformanceChart
			data={data.todayPerformance}
			type="bar"
			title="Today's Performance"
		/>

		<CashierPerformanceChart
			data={data.cashierSummary.slice(0, 6)}
			type="doughnut"
			title="Revenue Distribution (This Month)"
		/>
	</div>

	<!-- Performance Charts -->
	<div class="grid gap-6">
		<!-- Weekly Trend -->
		<div class="bg-base-100 rounded-box p-6 shadow">
			<h3 class="mb-4 text-lg font-semibold">Weekly Revenue Trend</h3>
			{#if data.weeklyTrend.length > 0}
				<div style="height: 300px;">
					<canvas bind:this={weeklyTrendCanvas}></canvas>
				</div>
			{:else}
				<div class="flex h-48 items-center justify-center text-base-content/50">
					No weekly trend data available
				</div>
			{/if}
		</div>

		<!-- Hourly Pattern -->
		<div class="bg-base-100 rounded-box p-6 shadow">
			<h3 class="mb-4 text-lg font-semibold">Hourly Activity Pattern</h3>
			{#if data.hourlyPattern.length > 0}
				<div style="height: 300px;">
					<canvas bind:this={hourlyPatternCanvas}></canvas>
				</div>
			{:else}
				<div class="flex h-48 items-center justify-center text-base-content/50">
					No hourly pattern data available
				</div>
			{/if}
		</div>

		<!-- Channel Distribution -->
		<div class="bg-base-100 rounded-box p-6 shadow">
			<h3 class="mb-4 text-lg font-semibold">Channel Preference by Cashier</h3>
			{#if data.channelPreference.length > 0}
				<div style="height: 300px;">
					<canvas bind:this={channelDistCanvas}></canvas>
				</div>
			{:else}
				<div class="flex h-48 items-center justify-center text-base-content/50">
					No channel preference data available
				</div>
			{/if}
		</div>
	</div>

	<!-- Performance Comparison -->
	<CashierPerformanceChart
		data={data.cashierSummary}
		type="radar"
		title="Performance Comparison (Normalized)"
		height="400px"
	/>

	<!-- Top Products by Cashier -->
	<div class="bg-base-100 rounded-box shadow">
		<div class="p-6">
			<h3 class="mb-4 text-lg font-semibold">Top Selling Products by Cashier</h3>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.cashierSummary as cashier}
					{@const cashierProducts = data.topProductsByCashier.filter(
						p => p.cashierId === cashier.cashierId
					).slice(0, 5)}
					<div class="rounded-box border border-base-300 p-4">
						<h4 class="mb-2 font-medium">{cashier.cashierName}</h4>
						{#if cashierProducts.length > 0}
							<ul class="space-y-1 text-sm">
								{#each cashierProducts as product, idx}
									<li class="flex items-center justify-between">
										<span class="text-base-content/70">
											{idx + 1}. {product.productTitle}
										</span>
										<span class="badge badge-sm">{product.salesCount}</span>
									</li>
								{/each}
							</ul>
						{:else}
							<p class="text-base-content/50 text-sm">No sales data</p>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>