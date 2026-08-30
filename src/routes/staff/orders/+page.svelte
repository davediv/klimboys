<script lang="ts">
	import { ArrowLeft, ArrowRight, Plus } from '@lucide/svelte';
	import { APP_LANGUAGE_TAG, APP_TIME_ZONE } from '$lib/business';
	import { formatIdr } from '$lib/format';
	import {
		badgeStyles,
		buttonStyles,
		cardBodyStyles,
		cardStyles,
		compactTableStyles,
		cx
	} from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	function formatDateTime(value: string): string {
		return new Intl.DateTimeFormat(APP_LANGUAGE_TAG, {
			timeZone: APP_TIME_ZONE,
			dateStyle: 'medium',
			timeStyle: 'short'
		}).format(new Date(value));
	}

	function statusStyle(status: string) {
		if (status === 'completed') return badgeStyles('positive', 'sm');
		if (status === 'pending') return badgeStyles('caution', 'sm');
		if (status === 'cancelled' || status === 'refunded') return badgeStyles('danger', 'sm');
		return badgeStyles('ghost', 'sm');
	}
</script>

<svelte:head>
	<title>Orders - Klimboys</title>
	<meta name="description" content="Review recorded Klimboys orders." />
</svelte:head>

<div class="mb-6 flex flex-wrap items-start justify-between gap-4">
	<div>
		<h1 class="text-3xl font-bold text-gray-900">Orders</h1>
		<p class="mt-1 text-gray-600">
			{data.orderList.scope === 'all'
				? 'Review all recorded sales.'
				: 'Review sales recorded by your account.'}
		</p>
	</div>
	<a href="/staff/pos" class={buttonStyles({ tone: 'brand' })}>
		<Plus class="h-5 w-5" />
		New Sale
	</a>
</div>

<div class={cx(cardStyles, 'bg-white shadow-sm')}>
	<div class={cardBodyStyles}>
		{#if data.orderList.orders.length === 0}
			<div class="py-12 text-center">
				<p class="font-semibold text-gray-900">No orders recorded yet</p>
				<p class="mt-1 text-sm text-gray-600">Completed sales will appear here.</p>
			</div>
		{:else}
			<div class="overflow-x-auto">
				<table class={compactTableStyles}>
					<thead>
						<tr>
							<th>Order</th>
							<th>Date</th>
							{#if data.orderList.scope === 'all'}<th>Cashier</th>{/if}
							<th>Channel</th>
							<th>Payment</th>
							<th>Items</th>
							<th>Total</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each data.orderList.orders as order (order.id)}
							<tr>
								<td class="font-medium text-gray-900">{order.transactionCode}</td>
								<td class="whitespace-nowrap">{formatDateTime(order.createdAt)}</td>
								{#if data.orderList.scope === 'all'}<td>{order.cashierName}</td>{/if}
								<td>{order.channel}</td>
								<td>{order.paymentMethod}</td>
								<td>{order.itemQuantity}</td>
								<td class="font-medium">{formatIdr(order.total / 100)}</td>
								<td><span class={statusStyle(order.status)}>{order.status}</span></td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

{#if data.orderList.totalPages > 1}
	<nav class="mt-6 flex items-center justify-between" aria-label="Order pages">
		{#if data.orderList.page > 1}
			<a
				href={`/staff/orders?page=${data.orderList.page - 1}`}
				class={buttonStyles({ variant: 'outline' })}
			>
				<ArrowLeft class="h-4 w-4" /> Previous
			</a>
		{:else}
			<span></span>
		{/if}
		<p class="text-sm text-gray-600">
			Page {data.orderList.page} of {data.orderList.totalPages}
		</p>
		{#if data.orderList.page < data.orderList.totalPages}
			<a
				href={`/staff/orders?page=${data.orderList.page + 1}`}
				class={buttonStyles({ variant: 'outline' })}
			>
				Next <ArrowRight class="h-4 w-4" />
			</a>
		{:else}
			<span></span>
		{/if}
	</nav>
{/if}
