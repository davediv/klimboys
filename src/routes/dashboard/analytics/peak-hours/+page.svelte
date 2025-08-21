<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import {
		Clock,
		TrendingUp,
		TrendingDown,
		AlertCircle,
		Users,
		ArrowLeft,
		Calendar
	} from '@lucide/svelte';
	import { jakartaTime } from '$lib/utils/datetime';
	import type { PageData } from './$types';
	import { Chart, registerables } from 'chart.js';
	import type { TransactionChannel } from '$lib/server/db/schema';

	// Register Chart.js components
	Chart.register(...registerables);

	let { data }: { data: PageData } = $props();

	let heatmapCanvas: HTMLCanvasElement;
	let trendCanvas: HTMLCanvasElement;
	let channelCanvas: HTMLCanvasElement;
	let heatmapChart: Chart | null = null;
	let trendChart: Chart | null = null;
	let channelChart: Chart | null = null;

	const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

	function formatCurrency(amount: number) {
		return new Intl.NumberFormat('id-ID', {
			style: 'currency',
			currency: 'IDR',
			minimumFractionDigits: 0
		}).format(amount);
	}

	function formatHour(hour: number): string {
		return `${hour.toString().padStart(2, '0')}:00`;
	}

	function getHourRange(hour: number): string {
		const nextHour = (hour + 1) % 24;
		return `${formatHour(hour)} - ${formatHour(nextHour)}`;
	}

	// Calculate insights
	const peakHourInsights = $derived(() => {
		if (!data.peakHours.length) return null;

		const topPeak = data.peakHours[0];
		const avgPeakTransactions =
			data.peakHours.reduce((sum, h) => sum + h.avgTransactions, 0) / data.peakHours.length;
		const avgPeakRevenue =
			data.peakHours.reduce((sum, h) => sum + h.avgRevenue, 0) / data.peakHours.length;

		return {
			primaryPeak: topPeak,
			avgPeakTransactions: Math.round(avgPeakTransactions),
			avgPeakRevenue,
			peakHours: data.peakHours.map((h) => h.hour)
		};
	});

	// Create heatmap chart
	function createHeatmapChart() {
		if (!heatmapCanvas || !data.hourlyDistribution.length) return;

		if (heatmapChart) {
			heatmapChart.destroy();
			heatmapChart = null;
		}

		const ctx = heatmapCanvas.getContext('2d');
		if (!ctx) return;

		// Create a 7x24 matrix for the heatmap
		const matrix: number[][] = Array(7)
			.fill(null)
			.map(() => Array(24).fill(0));
		const maxValue = Math.max(...data.hourlyDistribution.map((d) => d.transactions));

		// Fill the matrix
		data.hourlyDistribution.forEach((item) => {
			matrix[item.dayOfWeek][item.hour] = item.transactions;
		});

		// Flatten for Chart.js
		const chartData: { x: number; y: number; v: number }[] = [];
		matrix.forEach((day, dayIndex) => {
			day.forEach((value, hourIndex) => {
				chartData.push({ x: hourIndex, y: dayIndex, v: value });
			});
		});

		heatmapChart = new Chart(ctx, {
			type: 'scatter',
			data: {
				datasets: [
					{
						label: 'Transactions',
						data: chartData,
						backgroundColor: (context) => {
							const value = context.raw as { v: number };
							const intensity = value.v / maxValue;
							return `rgba(59, 130, 246, ${0.1 + intensity * 0.9})`; // Blue with varying opacity
						},
						pointRadius: 20,
						pointHoverRadius: 22
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					x: {
						type: 'linear',
						position: 'bottom',
						min: -0.5,
						max: 23.5,
						ticks: {
							stepSize: 1,
							callback: (value) => formatHour(value as number)
						},
						grid: {
							display: false
						}
					},
					y: {
						type: 'linear',
						min: -0.5,
						max: 6.5,
						reverse: true,
						ticks: {
							stepSize: 1,
							callback: (value) => dayNamesShort[value as number] || ''
						},
						grid: {
							display: false
						}
					}
				},
				plugins: {
					title: {
						display: true,
						text: 'Transaction Heatmap by Day and Hour',
						font: { size: 16, weight: 'bold' }
					},
					legend: {
						display: false
					},
					tooltip: {
						callbacks: {
							title: (context) => {
								const point = context[0].raw as { x: number; y: number; v: number };
								return `${dayNames[point.y]}, ${getHourRange(point.x)}`;
							},
							label: (context) => {
								const point = context.raw as { x: number; y: number; v: number };
								return `Transactions: ${point.v}`;
							}
						}
					}
				}
			}
		});
	}

	// Create weekly trend chart
	function createTrendChart() {
		if (!trendCanvas || !data.weeklyPattern.length) return;

		if (trendChart) {
			trendChart.destroy();
			trendChart = null;
		}

		const ctx = trendCanvas.getContext('2d');
		if (!ctx) return;

		// Group by date and create datasets
		const dateMap = new Map<string, Map<number, number>>();
		data.weeklyPattern.forEach((item) => {
			if (!dateMap.has(item.date)) {
				dateMap.set(item.date, new Map());
			}
			dateMap.get(item.date)!.set(item.hour, item.transactions);
		});

		const hours = Array.from({ length: 24 }, (_, i) => i);
		const dates = Array.from(dateMap.keys()).sort();

		const datasets = dates.map((date, index) => {
			const dayData = dateMap.get(date)!;
			const data = hours.map((hour) => dayData.get(hour) || 0);

			return {
				label: jakartaTime.dayDate(date),
				data,
				borderColor: `hsl(${index * 50}, 70%, 50%)`,
				backgroundColor: `hsla(${index * 50}, 70%, 50%, 0.1)`,
				tension: 0.3,
				fill: false
			};
		});

		trendChart = new Chart(ctx, {
			type: 'line',
			data: {
				labels: hours.map((h) => formatHour(h)),
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
						text: 'Hourly Transaction Trend (Last 7 Days)',
						font: { size: 16, weight: 'bold' }
					},
					legend: {
						position: 'top'
					}
				},
				scales: {
					x: {
						display: true,
						grid: { display: false }
					},
					y: {
						display: true,
						beginAtZero: true,
						title: {
							display: true,
							text: 'Number of Transactions'
						}
					}
				}
			}
		});
	}

	// Create channel peak hours chart
	function createChannelChart() {
		if (!channelCanvas || !data.peakHoursByChannel.length) return;

		if (channelChart) {
			channelChart.destroy();
			channelChart = null;
		}

		const ctx = channelCanvas.getContext('2d');
		if (!ctx) return;

		// Get top 3 peak hours for each channel
		const channelPeaks = new Map<
			TransactionChannel,
			Array<{ hour: number; transactions: number }>
		>();

		data.peakHoursByChannel.forEach((item) => {
			if (!channelPeaks.has(item.channel)) {
				channelPeaks.set(item.channel, []);
			}
			const peaks = channelPeaks.get(item.channel)!;
			if (peaks.length < 3) {
				peaks.push({ hour: item.hour, transactions: item.transactions });
			}
		});

		const channels = Array.from(channelPeaks.keys());
		const datasets = [0, 1, 2].map((peakIndex) => ({
			label: `Peak ${peakIndex + 1}`,
			data: channels.map((channel) => {
				const peaks = channelPeaks.get(channel);
				return peaks && peaks[peakIndex] ? peaks[peakIndex].transactions : 0;
			}),
			backgroundColor: `rgba(59, 130, 246, ${0.8 - peakIndex * 0.2})`
		}));

		channelChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: channels.map((c) => channelNames[c]),
				datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: 'Top 3 Peak Hours by Channel',
						font: { size: 16, weight: 'bold' }
					},
					legend: {
						position: 'top'
					},
					tooltip: {
						callbacks: {
							afterLabel: (context) => {
								const channelIndex = context.dataIndex;
								const peakIndex = context.datasetIndex;
								const channel = channels[channelIndex];
								const peaks = channelPeaks.get(channel);
								if (peaks && peaks[peakIndex]) {
									return `Hour: ${formatHour(peaks[peakIndex].hour)}`;
								}
								return '';
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

	// Effects for chart creation
	$effect(() => {
		const timer = setTimeout(() => {
			createHeatmapChart();
		}, 0);

		return () => {
			clearTimeout(timer);
			if (heatmapChart) {
				heatmapChart.destroy();
				heatmapChart = null;
			}
		};
	});

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
			createChannelChart();
		}, 0);

		return () => {
			clearTimeout(timer);
			if (channelChart) {
				channelChart.destroy();
				channelChart = null;
			}
		};
	});
</script>

<svelte:head>
	<title>Peak Hours Analysis - Klimboys Admin</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
		<div>
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="sm" href="/dashboard/analytics" icon={ArrowLeft}>
					Back to Analytics
				</Button>
			</div>
			<h1 class="mt-2 text-3xl font-bold">Peak Hours Analysis</h1>
			<p class="text-base-content/70 mt-1">
				Analyzing traffic patterns from {jakartaTime.dayDate(data.dateRange.start)} to {jakartaTime.dayDate(
					data.dateRange.end
				)}
			</p>
		</div>
	</div>

	<!-- Key Insights -->
	{#if peakHourInsights()}
		<div class="bg-base-100 rounded-box p-6 shadow">
			<h2 class="mb-4 flex items-center gap-2 text-xl font-bold">
				<AlertCircle class="text-info h-5 w-5" />
				Key Insights
			</h2>
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
				<div class="bg-base-200 rounded-lg p-4">
					<div class="text-base-content/70 text-sm">Primary Peak Hour</div>
					<div class="text-primary text-2xl font-bold">
						{getHourRange(peakHourInsights()!.primaryPeak.hour)}
					</div>
					<div class="text-base-content/70 mt-1 text-sm">
						~{peakHourInsights()!.primaryPeak.avgTransactions} orders/day
					</div>
				</div>
				<div class="bg-base-200 rounded-lg p-4">
					<div class="text-base-content/70 text-sm">Peak Hours Revenue</div>
					<div class="text-success text-2xl font-bold">
						{formatCurrency(peakHourInsights()!.avgPeakRevenue)}
					</div>
					<div class="text-base-content/70 mt-1 text-sm">Average per day</div>
				</div>
				<div class="bg-base-200 rounded-lg p-4">
					<div class="text-base-content/70 text-sm">Peak Period</div>
					<div class="text-lg font-bold">
						{peakHourInsights()!
							.peakHours.map((h) => formatHour(h))
							.join(', ')}
					</div>
					<div class="text-base-content/70 mt-1 text-sm">Top 5 busiest hours</div>
				</div>
				<div class="bg-base-200 rounded-lg p-4">
					<div class="text-base-content/70 text-sm">Staff Recommendation</div>
					<div class="flex items-center gap-2 text-lg font-bold">
						<Users class="h-5 w-5" />
						{peakHourInsights()!.avgPeakTransactions > 20 ? '3-4' : '2-3'} Staff
					</div>
					<div class="text-base-content/70 mt-1 text-sm">During peak hours</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Peak vs Quiet Hours -->
	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<!-- Peak Hours -->
		<div class="bg-base-100 rounded-box shadow">
			<div class="border-b p-4">
				<h3 class="flex items-center gap-2 text-lg font-bold">
					<TrendingUp class="text-success h-5 w-5" />
					Peak Hours (Top 5)
				</h3>
			</div>
			<div class="p-4">
				<div class="space-y-3">
					{#each data.peakHours as hour, index}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="badge badge-lg badge-success font-bold">{index + 1}</div>
								<div>
									<p class="font-medium">{getHourRange(hour.hour)}</p>
									<p class="text-base-content/70 text-sm">
										~{Math.round(hour.avgTransactions)} orders/day
									</p>
								</div>
							</div>
							<div class="text-right">
								<p class="font-semibold">{formatCurrency(hour.avgRevenue)}</p>
								<p class="text-base-content/70 text-xs">avg revenue/day</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Quiet Hours -->
		<div class="bg-base-100 rounded-box shadow">
			<div class="border-b p-4">
				<h3 class="flex items-center gap-2 text-lg font-bold">
					<TrendingDown class="text-warning h-5 w-5" />
					Quiet Hours (Bottom 5)
				</h3>
			</div>
			<div class="p-4">
				<div class="space-y-3">
					{#each data.quietHours as hour, index}
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<div class="badge badge-lg badge-warning font-bold">{index + 1}</div>
								<div>
									<p class="font-medium">{getHourRange(hour.hour)}</p>
									<p class="text-base-content/70 text-sm">
										~{Math.round(hour.avgTransactions)} orders/day
									</p>
								</div>
							</div>
							<div class="text-right">
								<p class="font-semibold">{formatCurrency(hour.avgRevenue)}</p>
								<p class="text-base-content/70 text-xs">avg revenue/day</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Transaction Heatmap -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<div style="position: relative; height: 400px;">
			<canvas bind:this={heatmapCanvas}></canvas>
		</div>
		<div class="text-base-content/70 mt-4 text-center text-sm">
			Darker blue indicates higher transaction volume
		</div>
	</div>

	<!-- Weekly Trend -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<div style="position: relative; height: 400px;">
			<canvas bind:this={trendCanvas}></canvas>
		</div>
	</div>

	<!-- Channel Peak Hours -->
	<div class="bg-base-100 rounded-box p-6 shadow">
		<div style="position: relative; height: 350px;">
			<canvas bind:this={channelCanvas}></canvas>
		</div>
	</div>

	<!-- Day of Week Analysis -->
	<div class="bg-base-100 rounded-box shadow">
		<div class="border-b p-4">
			<h3 class="flex items-center gap-2 text-lg font-bold">
				<Calendar class="h-5 w-5" />
				Day of Week Performance
			</h3>
		</div>
		<div class="p-4">
			<div class="overflow-x-auto">
				<table class="table">
					<thead>
						<tr>
							<th>Day</th>
							<th class="text-right">Transactions</th>
							<th class="text-right">Revenue</th>
							<th class="text-right">Avg/Transaction</th>
						</tr>
					</thead>
					<tbody>
						{#each data.dayOfWeekAnalysis as day}
							<tr>
								<td class="font-medium">{dayNames[day.dayOfWeek]}</td>
								<td class="text-right">{day.transactions.toLocaleString()}</td>
								<td class="text-right">{formatCurrency(day.revenue)}</td>
								<td class="text-right">{formatCurrency(day.revenue / day.transactions)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Recommendations -->
	<div class="bg-info/10 rounded-box p-6 shadow">
		<h3 class="mb-4 flex items-center gap-2 text-lg font-bold">
			<AlertCircle class="text-info h-5 w-5" />
			Recommendations Based on Peak Hours Analysis
		</h3>
		<div class="space-y-3">
			<div class="flex items-start gap-3">
				<span class="badge badge-info">Staffing</span>
				<p class="text-sm">
					Schedule additional staff during {data.peakHours
						.slice(0, 3)
						.map((h) => formatHour(h.hour))
						.join(', ')}
					to handle the increased order volume efficiently.
				</p>
			</div>
			<div class="flex items-start gap-3">
				<span class="badge badge-info">Inventory</span>
				<p class="text-sm">
					Ensure adequate stock levels before peak hours begin. Consider pre-preparing popular items
					30 minutes before {formatHour(data.peakHours[0]?.hour || 12)}.
				</p>
			</div>
			<div class="flex items-start gap-3">
				<span class="badge badge-info">Marketing</span>
				<p class="text-sm">
					Target promotions during quiet hours ({data.quietHours
						.slice(0, 3)
						.map((h) => formatHour(h.hour))
						.join(', ')}) to balance order distribution throughout the day.
				</p>
			</div>
			<div class="flex items-start gap-3">
				<span class="badge badge-info">Operations</span>
				<p class="text-sm">
					Schedule maintenance, training, and administrative tasks during quiet periods to minimize
					disruption to service.
				</p>
			</div>
		</div>
	</div>
</div>
