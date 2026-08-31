<script lang="ts">
	import { Search, MessageCircle, Package } from '@lucide/svelte';
	import { formatIdr } from '$lib/format';
	import {
		alertStyles,
		badgeStyles,
		buttonStyles,
		cardBodyStyles,
		cardStyles,
		cx,
		inputStyles,
		selectStyles
	} from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let whatsappAvailable = $derived(
		data.business.orderingChannels.some((channel) => channel.id === 'whatsapp')
	);

	function orderHref(product: string, size: string): string {
		const query = new URLSearchParams({ product, size });
		return `/go/whatsapp?${query.toString()}`;
	}
</script>

<svelte:head>
	<title>Menu - Klimboys</title>
	<meta
		name="description"
		content="Browse current Klimboys milkshakes, sizes, prices, and availability."
	/>
</svelte:head>

<section class="min-h-screen bg-surface-muted px-4 pt-32 pb-20">
	<div class="container mx-auto max-w-7xl">
		<div class="mx-auto mb-10 max-w-2xl text-center">
			<p class="text-sm font-semibold tracking-wider text-brand uppercase">Klimboys Menu</p>
			<h1 class="mt-2 text-4xl font-bold text-ink md:text-5xl">Choose your shake</h1>
			<p class="mt-4 text-ink/70">
				Review current sizes, prices, and availability.
				{#if data.business.orderingChannels.length > 0}
					Then continue through one of the verified ordering destinations.
				{/if}
			</p>
		</div>

		<form method="GET" class={cx(cardStyles, 'mb-8 bg-surface shadow-sm')} aria-label="Filter menu">
			<div class={cx(cardBodyStyles, 'gap-4 md:flex-row')}>
				<label class="flex-1">
					<span class="sr-only">Search menu</span>
					<span class="relative block">
						<Search class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
						<input
							name="search"
							type="search"
							value={data.search}
							placeholder="Search milkshakes..."
							class={cx(inputStyles({ full: true }), 'pl-10')}
						/>
					</span>
				</label>
				<label>
					<span class="sr-only">Filter by category</span>
					<select name="category" class={selectStyles({ full: true })} value={data.category}>
						<option value="">All categories</option>
						{#each data.categories as category (category)}
							<option value={category}>{category}</option>
						{/each}
					</select>
				</label>
				<button type="submit" class={buttonStyles({ tone: 'brand' })}>Apply filters</button>
				{#if data.search || data.category}
					<a href="/menu" class={buttonStyles({ variant: 'ghost' })}>Clear</a>
				{/if}
			</div>
		</form>

		{#if data.catalogError}
			<div class={cx(alertStyles('caution'), 'mb-8')} role="status">
				<span>{data.catalogError}</span>
				{#if whatsappAvailable}
					<a href="/go/whatsapp" class={buttonStyles({ tone: 'neutral', size: 'sm' })}>
						<MessageCircle class="h-4 w-4" />
						Order via WhatsApp
					</a>
				{/if}
			</div>
		{/if}

		{#if data.products.length === 0 && !data.catalogError}
			<div class="rounded-lg bg-surface p-12 text-center shadow-sm">
				<Package class="mx-auto h-12 w-12 text-ink/30" />
				<h2 class="mt-4 text-xl font-semibold">No shakes match these filters</h2>
				<p class="mt-2 text-ink/60">Try another search or browse every category.</p>
				<a href="/menu" class={cx(buttonStyles({ tone: 'brand' }), 'mt-6')}>View full menu</a>
			</div>
		{:else}
			<div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
					{#each data.products as product, index (product.id)}
					<article
						id={`product-${product.id}`}
						class={cx(cardStyles, 'scroll-mt-28 bg-surface shadow-sm')}
					>
						{#if product.imageUrl}
							<img
								src={product.imageUrl}
									alt=""
									width="640"
									height="360"
									loading={index < 3 ? 'eager' : 'lazy'}
									fetchpriority={index === 0 ? 'high' : index < 3 ? 'auto' : 'low'}
									decoding="async"
									class="aspect-video w-full rounded-t-lg object-cover"
							/>
						{:else}
							<div class="grid aspect-video place-items-center rounded-t-lg bg-surface-strong">
								<Package class="h-12 w-12 text-ink/30" />
							</div>
						{/if}
						<div class={cardBodyStyles}>
							<div class="flex items-start justify-between gap-4">
								<div>
									<h2 class="text-xl font-semibold">{product.name}</h2>
									<p class="mt-1 text-ink/60">
										{product.description || 'Description not provided.'}
									</p>
								</div>
								<span class={badgeStyles('ghost', 'sm')}>{product.category}</span>
							</div>

							<div class="mt-4 space-y-2">
								{#each product.variants as variant (variant.id)}
									<div
										class="flex items-center justify-between gap-3 rounded-lg bg-surface-muted p-3"
									>
										<div>
											<p class="font-semibold">Size {variant.size}</p>
											<p class="text-xs text-ink/60">{variant.volumeMl} ml</p>
										</div>
										<div class="flex items-center gap-3">
											<p class="font-semibold">{formatIdr(variant.sellingPrice / 100)}</p>
											{#if variant.available && whatsappAvailable}
												<a
													href={orderHref(product.name, variant.size)}
													class={buttonStyles({ tone: 'brand', size: 'sm' })}
												>
													<MessageCircle class="h-4 w-4" />
													Order
												</a>
											{:else if !variant.available}
												<span class={badgeStyles('danger', 'sm')}>Unavailable</span>
											{:else}
												<span class={badgeStyles('positive', 'sm')}>Available</span>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}

		<div class="mt-12 rounded-lg bg-surface p-6 text-center shadow-sm">
			{#if data.business.orderingChannels.length > 0}
				<h2 class="text-xl font-semibold">Continue your order</h2>
				<div class="mt-4 flex flex-wrap justify-center gap-3">
					{#each data.business.orderingChannels as channel (channel.id)}
						<a href={channel.href} class={buttonStyles({ variant: 'outline' })}>
							{channel.label}
						</a>
					{/each}
				</div>
			{:else}
				<h2 class="text-xl font-semibold">Ordering destinations are being verified</h2>
				<p class="mt-2 text-ink/60">
					Ordering actions will appear here as soon as a verified destination is configured.
				</p>
			{/if}
		</div>
	</div>
</section>
