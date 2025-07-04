<script lang="ts">
	import { Chart, registerables } from 'chart.js';
	import type { ComponentType } from 'svelte';

	// Register Chart.js components
	Chart.register(...registerables);

	let {
		data,
		type = 'bar',
		title = 'Cashier Performance',
		height = '300px'
	}: {
		data: {
			cashierName: string;
			revenue?: number;
			transactions?: number;
			avgTransactionValue?: number;
		}[];
		type?: 'bar' | 'radar' | 'doughnut';
		title?: string;
		height?: string;
	} = $props();

	let canvas: HTMLCanvasElement;
	let chart: Chart | null = null;

	function getChartData() {
		const labels = data.map(item => item.cashierName);

		if (type === 'bar') {
			return {
				labels,
				datasets: [
					{
						label: 'Revenue (IDR)',
						data: data.map(item => item.revenue || 0),
						backgroundColor: 'rgba(34, 197, 94, 0.8)',
						borderColor: 'rgba(34, 197, 94, 1)',
						borderWidth: 1,
						yAxisID: 'y'
					},
					{
						label: 'Transactions',
						data: data.map(item => item.transactions || 0),
						backgroundColor: 'rgba(59, 130, 246, 0.8)',
						borderColor: 'rgba(59, 130, 246, 1)',
						borderWidth: 1,
						yAxisID: 'y1'
					}
				]
			};
		} else if (type === 'radar') {
			// Normalize values for radar chart (0-100 scale)
			const maxRevenue = Math.max(...data.map(d => d.revenue || 0));
			const maxTransactions = Math.max(...data.map(d => d.transactions || 0));
			const maxAvgValue = Math.max(...data.map(d => d.avgTransactionValue || 0));

			return {
				labels: ['Revenue', 'Transactions', 'Avg Value'],
				datasets: data.map((cashier, index) => ({
					label: cashier.cashierName,
					data: [
						((cashier.revenue || 0) / maxRevenue) * 100,
						((cashier.transactions || 0) / maxTransactions) * 100,
						((cashier.avgTransactionValue || 0) / maxAvgValue) * 100
					],
					borderColor: `hsl(${index * 60}, 70%, 50%)`,
					backgroundColor: `hsla(${index * 60}, 70%, 50%, 0.2)`,
					borderWidth: 2
				}))
			};
		} else {
			// Doughnut chart for revenue distribution
			return {
				labels,
				datasets: [{
					data: data.map(item => item.revenue || 0),
					backgroundColor: [
						'rgba(34, 197, 94, 0.8)',
						'rgba(59, 130, 246, 0.8)',
						'rgba(251, 146, 60, 0.8)',
						'rgba(168, 85, 247, 0.8)',
						'rgba(236, 72, 153, 0.8)',
						'rgba(250, 204, 21, 0.8)'
					],
					borderColor: [
						'rgba(34, 197, 94, 1)',
						'rgba(59, 130, 246, 1)',
						'rgba(251, 146, 60, 1)',
						'rgba(168, 85, 247, 1)',
						'rgba(236, 72, 153, 1)',
						'rgba(250, 204, 21, 1)'
					],
					borderWidth: 1
				}]
			};
		}
	}

	function getChartOptions() {
		const baseOptions = {
			responsive: true,
			maintainAspectRatio: false,
			plugins: {
				legend: {
					position: type === 'doughnut' ? 'right' as const : 'top' as const,
					labels: {
						font: {
							size: 12
						}
					}
				},
				tooltip: {
					callbacks: {
						label: function(context: any) {
							if (type === 'doughnut') {
								const value = context.parsed;
								const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
								const percentage = ((value / total) * 100).toFixed(1);
								return `${context.label}: IDR ${value.toLocaleString('id-ID')} (${percentage}%)`;
							} else if (type === 'radar') {
								return `${context.dataset.label}: ${context.parsed.r.toFixed(1)}%`;
							} else {
								const label = context.dataset.label;
								const value = context.parsed.y;
								if (label.includes('Revenue')) {
									return `${label}: IDR ${value.toLocaleString('id-ID')}`;
								}
								return `${label}: ${value}`;
							}
						}
					}
				}
			}
		};

		if (type === 'bar') {
			return {
				...baseOptions,
				scales: {
					y: {
						type: 'linear' as const,
						display: true,
						position: 'left' as const,
						title: {
							display: true,
							text: 'Revenue (IDR)'
						},
						ticks: {
							callback: function(value: any) {
								return 'IDR ' + value.toLocaleString('id-ID');
							}
						}
					},
					y1: {
						type: 'linear' as const,
						display: true,
						position: 'right' as const,
						title: {
							display: true,
							text: 'Transactions'
						},
						grid: {
							drawOnChartArea: false
						}
					}
				}
			};
		} else if (type === 'radar') {
			return {
				...baseOptions,
				scales: {
					r: {
						beginAtZero: true,
						max: 100,
						ticks: {
							stepSize: 20,
							callback: function(value: any) {
								return value + '%';
							}
						}
					}
				}
			};
		}

		return baseOptions;
	}

	$effect(() => {
		if (!canvas || !data.length) return;

		if (chart) {
			chart.destroy();
			chart = null;
		}

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		chart = new Chart(ctx, {
			type: type === 'radar' ? 'radar' : type === 'doughnut' ? 'doughnut' : 'bar',
			data: getChartData(),
			options: getChartOptions()
		});

		return () => {
			if (chart) {
				chart.destroy();
				chart = null;
			}
		};
	});
</script>

<div class="bg-base-100 rounded-box p-6 shadow">
	<h3 class="mb-4 text-lg font-semibold">{title}</h3>
	{#if data.length > 0}
		<div style="height: {height};">
			<canvas bind:this={canvas}></canvas>
		</div>
	{:else}
		<div class="flex h-48 items-center justify-center text-base-content/50">
			No data available
		</div>
	{/if}
</div>