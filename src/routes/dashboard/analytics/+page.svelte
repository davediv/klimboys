<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import { BarChart3, TrendingUp, Package, Clock, CreditCard, ArrowLeft, Users } from '@lucide/svelte';
	import { jakartaTime } from '$lib/utils/datetime';
	import type { PageData } from './$types';
	import type { TransactionChannel, PaymentMethod } from '$lib/server/db/schema';
	import ChannelPerformanceChart from '$lib/components/charts/ChannelPerformanceChart.svelte';
	import { Chart, registerables } from 'chart.js';

	// Register Chart.js components
	Chart.register(...registerables);

	let { data }: { data: PageData } = $props();

	let selectedChannel = $state<TransactionChannel | 'all'>('all');
	let trendCanvas: HTMLCanvasElement;
	let hourlyCanvas: HTMLCanvasElement;
	let trendChart: Chart | null = null;
	let hourlyChart: Chart | null = null;

	const channelNames: Record<TransactionChannel, string> = {
		grabfood: 'GrabFood',
		gofood: 'GoFood',
		shopeefood: 'ShopeeFood',
		ubereats: 'UberEats',
		store: 'Store'
	};

	const channelColors: Record<TransactionChannel, string> = {
		grabfood: '#00b14f',
		gofood: '#ee2737',
		shopeefood: '#ff6d00',
		ubereats: '#06c167',
		store: '#3b82f6'
	};

	const paymentMethodNames: Record<PaymentMethod, string> = {
		cash: 'Cash',
		qris: 'QRIS',
		debit: 'Debit Card',
		credit: 'Credit Card',
		transfer: 'Bank Transfer'
	};

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	// Get top products for selected channel
	const topProducts = $derived(
		selectedChannel === 'all'
			? []
			: data.topProductsByChannel
					.filter(p => p.channel === selectedChannel)
					.slice(0, 10)
	);

	// Get payment methods for selected channel
	const paymentMethods = $derived(
		selectedChannel === 'all'
			? []
			: data.paymentMethodByChannel.filter(p => p.channel === selectedChannel)
	);

	// Create revenue trend chart
	function createTrendChart() {
		if (!trendCanvas || !data.channelDailyPerformance.length) return;

		if (trendChart) {
			trendChart.destroy();
			trendChart = null;
		}

		const ctx = trendCanvas.getContext('2d');
		if (!ctx) return;

		// Group data by date
		const dateMap = new Map<string, Record<TransactionChannel, number>>();
		data.channelDailyPerformance.forEach(item => {
			if (!dateMap.has(item.date)) {
				dateMap.set(item.date, {} as Record<TransactionChannel, number>);
			}
			dateMap.get(item.date)![item.channel] = item.revenue;
		});

		const dates = Array.from(dateMap.keys()).sort();
		const channels: TransactionChannel[] = ['grabfood', 'gofood', 'shopeefood', 'ubereats', 'store'];

		const datasets = channels.map(channel => ({
			label: channelNames[channel],
			data: dates.map(date => dateMap.get(date)?.[channel] || 0),
			borderColor: channelColors[channel],
			backgroundColor: channelColors[channel] + '20',
			tension: 0.3,
			fill: true
		}));

		trendChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: dates.map(d => jakartaTime.dayDate(d)),
				datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false
				},
				plugins: {
					title: {
						display: true,
						text: 'Revenue Trend by Channel (Last 30 Days)',
						font: { size: 16, weight: 'bold' }
					},
					legend: {
						position: 'top'
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
							}
						}
					}
				},
				scales: {
					x: {
						display: true,
						grid: { display: false }
					},
					y: {
						display: true,
						ticks: {
							callback: function(value) {
								return formatCurrency(value as number);
							}
						}
					}
				}
			}
		});
	}

	// Create hourly distribution chart
	function createHourlyChart() {
		if (!hourlyCanvas || !data.hourlyDistribution.length) return;

		if (hourlyChart) {
			hourlyChart.destroy();
			hourlyChart = null;
		}

		const ctx = hourlyCanvas.getContext('2d');
		if (!ctx) return;

		// Filter data based on selected channel
		const filteredData = selectedChannel === 'all'
			? data.hourlyDistribution
			: data.hourlyDistribution.filter(h => h.channel === selectedChannel);

		// Group by hour
		const hourMap = new Map<number, number>();
		filteredData.forEach(item => {
			hourMap.set(item.hour, (hourMap.get(item.hour) || 0) + item.transactions);
		});

		// Create 24-hour array
		const hours = Array.from({ length: 24 }, (_, i) => i);
		const transactions = hours.map(h => hourMap.get(h) || 0);

		hourlyChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: hours.map(h => `${h}:00`),
				datasets: [{
					label: 'Transactions',
					data: transactions,
					backgroundColor: selectedChannel === 'all' ? '#3b82f6' : channelColors[selectedChannel as TransactionChannel],
					borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: `Hourly Transaction Distribution${selectedChannel !== 'all' ? ' - ' + channelNames[selectedChannel as TransactionChannel] : ''}`,
						font: { size: 16, weight: 'bold' }
					},
					legend: {
						display: false
					}
				},
				scales: {
					x: {
						display: true,
						grid: { display: false }
					},
					y: {
						display: true,
						beginAtZero: true
					}
				}
			}
		});
	}

	// Effects for chart creation
	$effect(() => {
		const timer = setTimeout(() => {
			createTrendChart();
		}, 0);

		return () => {
			clearTimeout(timer);
			if (trendChart) {
				trendChart.destroy();
				trendChart = null;
			}
		};
	});

	$effect(() => {
		const timer = setTimeout(() => {
			createHourlyChart();
		}, 0);

		return () => {
			clearTimeout(timer);
			if (hourlyChart) {
				hourlyChart.destroy();
				hourlyChart = null;
			}
		};
	});
</script>

<svelte:head>
	<title>Channel Analytics - Klimboys Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="sm" href="/dashboard" icon={ArrowLeft}>
					Back to Dashboard
				</Button>
			</div>
			<h1 class="mt-2 text-3xl font-bold">Channel Performance Analytics</h1>
			<p class="text-base-content/70 mt-1">
				Analyzing data from {jakartaTime.dayDate(data.dateRange.start)} to {jakartaTime.dayDate(data.dateRange.end)}
			</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<Button variant="primary" href="/dashboard/analytics/peak-hours" icon={Clock}>
				Peak Hours
			</Button>
			<Button variant="primary" href="/dashboard/analytics/cashier-performance" icon={Users}>
				Cashier Performance
			</Button>
		</div>
	</div>

	<!-- Summary Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
		{#each data.channelSummary as channel}
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-title" style="color: {channelColors[channel.channel]}">
						{channelNames[channel.channel]}
					</div>
					<div class="stat-value text-2xl">{formatCurrency(channel.revenue)}</div>
					<div class="stat-desc">
						{channel.transactions} orders • Avg: {formatCurrency(channel.avgOrderValue)}
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Channel Distribution Charts -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<ChannelPerformanceChart 
			data={data.channelSummary} 
			type="revenue" 
			height="350px" 
		/>
		<ChannelPerformanceChart 
			data={data.channelSummary} 
			type="transactions" 
			height="350px" 
		/>
	</div>

	<!-- Revenue Trend Chart -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<div style="position: relative; height: 400px;">
			<canvas bind:this={trendCanvas}></canvas>
		</div>
	</div>

	<!-- Channel Selector -->
	<div class="bg-base-100 rounded-box p-4 shadow">
		<div class="flex flex-wrap gap-2">
			<span class="text-sm font-medium">Select Channel:</span>
			<Button
				size="sm"
				variant={selectedChannel === 'all' ? 'primary' : 'ghost'}
				onclick={() => selectedChannel = 'all'}
			>
				All Channels
			</Button>
			{#each Object.entries(channelNames) as [value, name]}
				<Button
					size="sm"
					variant={selectedChannel === value ? 'primary' : 'ghost'}
					onclick={() => selectedChannel = value as TransactionChannel}
				>
					{name}
				</Button>
			{/each}
		</div>
	</div>

	<!-- Channel Details Grid -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Hourly Distribution -->
		<div class="lg:col-span-2">
			<div class="bg-base-100 rounded-box p-6 shadow">
				<div style="position: relative; height: 350px;">
					<canvas bind:this={hourlyCanvas}></canvas>
				</div>
			</div>
		</div>

		<!-- Top Products or Payment Methods -->
		<div>
			{#if selectedChannel !== 'all'}
				<!-- Top Products -->
				<div class="bg-base-100 rounded-box shadow">
					<div class="border-b p-4">
						<h3 class="text-lg font-bold">
							Top Products - {channelNames[selectedChannel as TransactionChannel]}
						</h3>
					</div>
					<div class="max-h-96 overflow-y-auto p-4">
						{#if topProducts.length > 0}
							<div class="space-y-2">
								{#each topProducts as product, index}
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-2">
											<span class="badge badge-sm">{index + 1}</span>
											<div>
												<p class="text-sm font-medium">{product.productTitle}</p>
												<p class="text-xs text-base-content/70">{product.quantity} sold</p>
											</div>
										</div>
										<p class="text-sm font-semibold">{formatCurrency(product.revenue)}</p>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-base-content/50 text-center">No data available</p>
						{/if}
					</div>
				</div>

				<!-- Payment Methods -->
				<div class="bg-base-100 rounded-box mt-6 shadow">
					<div class="border-b p-4">
						<h3 class="text-lg font-bold">
							Payment Methods - {channelNames[selectedChannel as TransactionChannel]}
						</h3>
					</div>
					<div class="p-4">
						{#if paymentMethods.length > 0}
							<div class="space-y-3">
								{#each paymentMethods as method}
									{@const percentage = ((method.transactions / paymentMethods.reduce((sum, m) => sum + m.transactions, 0)) * 100).toFixed(1)}
									<div>
										<div class="flex items-center justify-between mb-1">
											<span class="text-sm font-medium">{paymentMethodNames[method.paymentMethod]}</span>
											<span class="text-sm">{percentage}%</span>
										</div>
										<div class="w-full bg-base-200 rounded-full h-2">
											<div
												class="bg-primary h-2 rounded-full"
												style="width: {percentage}%"
											></div>
										</div>
										<div class="flex justify-between mt-1">
											<span class="text-xs text-base-content/70">{method.transactions} transactions</span>
											<span class="text-xs font-medium">{formatCurrency(method.revenue)}</span>
										</div>
									</div>
								{/each}
							</div>
						{:else}
							<p class="text-base-content/50 text-center">No data available</p>
						{/if}
					</div>
				</div>
			{:else}
				<div class="bg-base-100 rounded-box p-6 shadow">
					<div class="flex h-full items-center justify-center">
						<div class="text-center">
							<BarChart3 class="mx-auto mb-4 h-12 w-12 text-base-content/30" />
							<p class="text-base-content/50">Select a channel to view details</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>