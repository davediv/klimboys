<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import type { TransactionChannel } from '$lib/server/db/schema';

	// Register Chart.js components
	Chart.register(...registerables);

	let {
		monthData = [],
		todayData = [],
		height = '400px'
	}: {
		monthData: Array<{
			channel: TransactionChannel;
			revenue: number;
			transactions: number;
			avgOrderValue?: number;
		}>;
		todayData: Array<{
			channel: TransactionChannel;
			revenue: number;
			transactions: number;
		}>;
		height?: string;
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	const channelNames: Record<TransactionChannel, string> = {
		grabfood: 'GrabFood',
		gofood: 'GoFood',
		shopeefood: 'ShopeeFood',
		ubereats: 'UberEats',
		store: 'Store'
	};

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function createChart() {
		if (!canvas || (!monthData.length && !todayData.length)) {
			return;
		}

		// Destroy existing chart if any
		if (chart) {
			chart.destroy();
			chart = null;
		}

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Get all unique channels
		const allChannels = new Set<TransactionChannel>();
		monthData.forEach(d => allChannels.add(d.channel));
		todayData.forEach(d => allChannels.add(d.channel));
		
		const channels = Array.from(allChannels).sort();
		const labels = channels.map(c => channelNames[c]);

		// Create maps for easy lookup
		const monthMap = new Map(monthData.map(d => [d.channel, d]));
		const todayMap = new Map(todayData.map(d => [d.channel, d]));

		// Prepare data arrays
		const monthRevenue = channels.map(c => monthMap.get(c)?.revenue || 0);
		const todayRevenue = channels.map(c => todayMap.get(c)?.revenue || 0);
		const monthTransactions = channels.map(c => monthMap.get(c)?.transactions || 0);
		const todayTransactions = channels.map(c => todayMap.get(c)?.transactions || 0);

		chart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: "Today's Revenue",
						data: todayRevenue,
						backgroundColor: 'rgba(34, 197, 94, 0.8)',
						borderColor: 'rgb(34, 197, 94)',
						borderWidth: 1,
						yAxisID: 'y-revenue',
						order: 2
					},
					{
						label: 'Month Revenue',
						data: monthRevenue,
						backgroundColor: 'rgba(34, 197, 94, 0.3)',
						borderColor: 'rgb(34, 197, 94)',
						borderWidth: 1,
						yAxisID: 'y-revenue',
						order: 3
					},
					{
						label: "Today's Transactions",
						data: todayTransactions,
						backgroundColor: 'rgba(59, 130, 246, 0.8)',
						borderColor: 'rgb(59, 130, 246)',
						borderWidth: 1,
						yAxisID: 'y-transactions',
						order: 0,
						type: 'line',
						tension: 0.3,
						pointRadius: 4,
						pointHoverRadius: 6
					},
					{
						label: 'Month Transactions',
						data: monthTransactions,
						backgroundColor: 'rgba(239, 68, 68, 0.8)',
						borderColor: 'rgb(239, 68, 68)',
						borderWidth: 1,
						yAxisID: 'y-transactions',
						order: 1,
						type: 'line',
						tension: 0.3,
						pointRadius: 4,
						pointHoverRadius: 6
					}
				]
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
						text: 'Channel Performance Comparison',
						font: {
							size: 16,
							weight: 'bold'
						},
						padding: {
							bottom: 20
						}
					},
					legend: {
						display: true,
						position: 'top'
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								if (context.dataset.yAxisID === 'y-revenue') {
									return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
								}
								return `${context.dataset.label}: ${context.parsed.y} transactions`;
							}
						}
					}
				},
				scales: {
					x: {
						display: true,
						grid: {
							display: false
						}
					},
					'y-revenue': {
						type: 'linear',
						display: true,
						position: 'left',
						grid: {
							color: 'rgba(0, 0, 0, 0.05)'
						},
						ticks: {
							callback: function(value) {
								return formatCurrency(value as number);
							}
						},
						title: {
							display: true,
							text: 'Revenue (IDR)'
						}
					},
					'y-transactions': {
						type: 'linear',
						display: true,
						position: 'right',
						grid: {
							drawOnChartArea: false
						},
						title: {
							display: true,
							text: 'Number of Transactions'
						}
					}
				}
			}
		});
	}

	// Effect for chart lifecycle
	$effect(() => {
		const timer = setTimeout(() => {
			if (canvas && (monthData.length > 0 || todayData.length > 0)) {
				createChart();
			}
		}, 0);

		return () => {
			clearTimeout(timer);
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});
</script>

<div class="bg-base-100 rounded-box p-6 shadow">
	{#if monthData.length === 0 && todayData.length === 0}
		<div class="flex items-center justify-center" style="height: {height};">
			<p class="text-base-content/50">No channel performance data available.</p>
		</div>
	{:else}
		<div style="position: relative; height: {height};">
			<canvas bind:this={canvas}></canvas>
		</div>
	{/if}
</div>