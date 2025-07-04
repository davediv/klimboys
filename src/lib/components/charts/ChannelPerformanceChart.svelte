<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import type { TransactionChannel } from '$lib/server/db/schema';

	// Register Chart.js components
	Chart.register(...registerables);

	let {
		data = [],
		height = '300px',
		type = 'revenue' as 'revenue' | 'transactions'
	}: {
		data: Array<{
			channel: TransactionChannel;
			revenue: number;
			transactions: number;
			avgOrderValue?: number;
		}>;
		height?: string;
		type?: 'revenue' | 'transactions';
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

	const channelColors: Record<TransactionChannel, string> = {
		grabfood: '#00b14f', // Grab green
		gofood: '#ee2737', // Gojek red
		shopeefood: '#ff6d00', // Shopee orange
		ubereats: '#06c167', // Uber green
		store: '#3b82f6' // Blue for store
	};

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function createChart() {
		if (!canvas || !data.length) {
			console.log('Chart creation skipped:', { canvas: !!canvas, dataLength: data.length });
			return;
		}

		// Destroy existing chart if any
		if (chart) {
			chart.destroy();
			chart = null;
		}

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			console.error('Failed to get canvas context');
			return;
		}

		console.log('Creating channel performance chart with data:', data);

		// Prepare data
		const labels = data.map(d => channelNames[d.channel]);
		const backgroundColors = data.map(d => channelColors[d.channel]);
		const values = data.map(d => type === 'revenue' ? d.revenue : d.transactions);

		// Calculate percentages for labels
		const total = values.reduce((sum, val) => sum + val, 0);
		const percentages = values.map(val => total > 0 ? ((val / total) * 100).toFixed(1) : '0');

		chart = new Chart(ctx, {
			type: 'doughnut',
			data: {
				labels,
				datasets: [{
					data: values,
					backgroundColor: backgroundColors,
					borderWidth: 2,
					borderColor: '#fff'
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: type === 'revenue' ? 'Revenue by Channel' : 'Transactions by Channel',
						font: {
							size: 16,
							weight: 'bold'
						},
						padding: {
							bottom: 20
						}
					},
					legend: {
						position: 'bottom',
						labels: {
							padding: 15,
							usePointStyle: true,
							font: {
								size: 12
							},
							generateLabels: function(chart) {
								const data = chart.data;
								if (!data.labels || !data.datasets) return [];
								
								return data.labels.map((label, i) => {
									const value = data.datasets[0].data[i] as number;
									const percentage = percentages[i];
									return {
										text: `${label} (${percentage}%)`,
										fillStyle: data.datasets[0].backgroundColor?.[i] as string,
										strokeStyle: data.datasets[0].borderColor as string,
										lineWidth: data.datasets[0].borderWidth as number,
										hidden: false,
										index: i
									};
								});
							}
						}
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								const label = context.label || '';
								const value = context.parsed;
								const percentage = percentages[context.dataIndex];
								
								if (type === 'revenue') {
									return `${label}: ${formatCurrency(value)} (${percentage}%)`;
								} else {
									return `${label}: ${value} transactions (${percentage}%)`;
								}
							}
						}
					}
				}
			}
		});
	}

	// Effect for chart lifecycle
	$effect(() => {
		// Wait for next tick to ensure canvas is mounted
		const timer = setTimeout(() => {
			if (canvas && data.length > 0) {
				createChart();
			}
		}, 0);

		// Cleanup
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
	{#if data.length === 0}
		<div class="flex items-center justify-center" style="height: {height};">
			<p class="text-base-content/50">No channel data available for the selected period.</p>
		</div>
	{:else}
		<div style="position: relative; height: {height};">
			<canvas bind:this={canvas}></canvas>
		</div>
		
		<!-- Channel Stats Summary -->
		<div class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
			{#each data as channelData}
				<div class="text-center">
					<div class="text-sm font-medium text-base-content/70">{channelNames[channelData.channel]}</div>
					<div class="text-lg font-bold" style="color: {channelColors[channelData.channel]}">
						{#if type === 'revenue'}
							{formatCurrency(channelData.revenue)}
						{:else}
							{channelData.transactions}
						{/if}
					</div>
					{#if channelData.avgOrderValue !== undefined && type === 'revenue'}
						<div class="text-xs text-base-content/50">
							Avg: {formatCurrency(channelData.avgOrderValue)}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>