<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import { jakartaTime } from '$lib/utils/datetime';

	// Register Chart.js components
	Chart.register(...registerables);

	let {
		data = [],
		height = '300px'
	}: {
		data: Array<{ date: string; revenue: number; transactions: number }>;
		height?: string;
	} = $props();

	let canvas = $state<HTMLCanvasElement>();
	let chart = $state<Chart | null>(null);

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function createChart() {
		if (!canvas || !data.length) return;

		// Destroy existing chart if any
		if (chart) {
			chart.destroy();
		}

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		// Prepare data
		const labels = data.map(d => jakartaTime.dayDate(d.date));
		const revenueData = data.map(d => d.revenue);
		const transactionData = data.map(d => d.transactions);

		chart = new Chart(ctx, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: 'Revenue',
						data: revenueData,
						borderColor: 'rgb(34, 197, 94)', // green-500
						backgroundColor: 'rgba(34, 197, 94, 0.1)',
						yAxisID: 'y-revenue',
						tension: 0.3,
						pointRadius: 4,
						pointHoverRadius: 6
					},
					{
						label: 'Transactions',
						data: transactionData,
						borderColor: 'rgb(59, 130, 246)', // blue-500
						backgroundColor: 'rgba(59, 130, 246, 0.1)',
						yAxisID: 'y-transactions',
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
						text: 'Daily Sales Trend',
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
						position: 'top',
						labels: {
							usePointStyle: true,
							padding: 15
						}
					},
					tooltip: {
						callbacks: {
							label: function(context) {
								if (context.dataset.label === 'Revenue') {
									return `Revenue: ${formatCurrency(context.parsed.y)}`;
								}
								return `${context.dataset.label}: ${context.parsed.y}`;
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

	$effect(() => {
		// Create chart when canvas is ready or data changes
		if (canvas && data.length > 0) {
			createChart();
		}

		// Cleanup on unmount
		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});
</script>

<div class="bg-base-100 rounded-box p-6 shadow" style="height: {height};">
	<canvas bind:this={canvas}></canvas>
</div>