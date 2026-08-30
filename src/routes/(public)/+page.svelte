<script lang="ts">
	import {
		ArrowRight,
		ChevronRight,
		MessageCircle,
		Package,
		Shield,
		Sparkles,
		Truck
	} from '@lucide/svelte';
	import Mascot from '$lib/assets/klimboys-maskot.svg';
	import { publicMessages } from '$lib/business';
	import { formatIdr } from '$lib/format';
	import {
		badgeStyles,
		buttonStyles,
		cardActionsStyles,
		cardBodyStyles,
		cardStyles,
		cardTitleStyles,
		cx
	} from '$lib/styles';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const features = [
		{
			icon: Package,
			title: 'Current menu',
			description: 'Products and selling prices come from the active Klimboys catalog.'
		},
		{
			icon: Sparkles,
			title: 'Clear size choices',
			description: 'Review available sizes before continuing an order.'
		},
		{
			icon: Shield,
			title: 'Verified destinations',
			description: 'Ordering and contact links appear only after their destinations are configured.'
		}
	];
</script>

<svelte:head>
	<title>Klimboys - Milkshake Menu and Ordering</title>
	<meta
		name="description"
		content="Browse the current Klimboys milkshake menu, compare sizes and prices, and continue through an available ordering channel."
	/>
	<meta name="theme-color" content="#FF6B6B" />
</svelte:head>

<!-- 1. Hero: establish the product and point to the next decision. -->
<section
	class="grid min-h-[80vh] w-full place-items-center bg-gradient-to-br from-[#FF6B6B]/10 via-surface to-accent/10 px-4 pt-28 pb-16"
>
	<div
		class="isolate flex w-full max-w-7xl flex-col items-center justify-center gap-8 lg:flex-row-reverse"
	>
		<img
			src={Mascot}
			alt="Klimboys mascot"
			width="188"
			height="321"
			fetchpriority="high"
			class="w-full max-w-xs rounded-lg lg:w-1/2 lg:max-w-sm"
		/>
		<div class="max-w-3xl text-center lg:text-left">
			<span
				class={badgeStyles('default', 'lg')}
				style="background-color: #FF6B6B; color: white; border-color: #FF6B6B;"
			>
				<Sparkles class="h-4 w-4" />
				Milkshakes made to order
			</span>
			<h1
				class="mt-4 text-5xl font-bold md:text-7xl"
				style="background: linear-gradient(to right, #FF6B6B, #FF8E8E); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
			>
				Shake Up Your Day
			</h1>
			<p class="py-6 text-lg text-ink/80 md:text-xl">{data.business.summary}</p>
			<div class="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
				<a
					href="/menu"
					class={buttonStyles({ size: 'lg' })}
					style="background-color: #FF6B6B; color: white; border-color: #FF6B6B;"
				>
					View live menu
					<ArrowRight class="h-5 w-5" />
				</a>
				<a href="#order" class={buttonStyles({ variant: 'outline', size: 'lg' })}> How to order </a>
			</div>
		</div>
	</div>
</section>

<!-- 2. Live menu preview: put real products before promotional content. -->
<section
	id="menu-preview"
	class="scroll-mt-24 bg-gradient-to-br from-orange-50 via-white to-pink-50 px-4 py-20"
	aria-labelledby="menu-preview-title"
>
	<div class="container mx-auto">
		<div class="mb-12 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p class="text-sm font-semibold tracking-wider text-brand uppercase">Live menu</p>
				<h2
					id="menu-preview-title"
					class="mt-2 bg-gradient-to-r from-[#FF6B6B] to-orange-500 bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
				>
					Popular shakes
				</h2>
				<p class="mt-2 text-gray-600">Current products and prices from the Klimboys catalog.</p>
			</div>
			<a
				href="/menu"
				class={cx(
					buttonStyles({ variant: 'ghost' }),
					'gap-2 border-[#FF6B6B]/20 hover:bg-[#FF6B6B]/10'
				)}
			>
				View full menu
				<ChevronRight class="h-5 w-5" />
			</a>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			{#each data.popularProducts as product (product.id)}
				<article
					class={cx(
						cardStyles,
						'border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'
					)}
				>
					<figure class="flex items-center justify-center px-4 pt-4">
						{#if product.imageUrl}
							<img
								src={product.imageUrl}
								alt=""
								width="400"
								height="400"
								loading="lazy"
								decoding="async"
								class="h-48 w-full rounded-xl object-cover"
							/>
						{:else}
							<div class="grid h-48 w-full place-items-center rounded-xl bg-surface-strong">
								<Package class="h-12 w-12 text-ink/30" />
							</div>
						{/if}
					</figure>
					<div class={cardBodyStyles}>
						<h3 class={cx(cardTitleStyles, 'text-gray-800')}>{product.name}</h3>
						<p
							class="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] bg-clip-text text-xl font-bold text-transparent"
						>
							{#if product.variants.length > 0}
								From {formatIdr(
									Math.min(...product.variants.map((variant) => variant.sellingPrice)) / 100
								)}
							{:else}
								Price unavailable
							{/if}
						</p>
						<div class={cx(cardActionsStyles, 'mt-4 justify-end')}>
							<a
								href={`/menu#product-${product.id}`}
								class={cx(
									buttonStyles({ size: 'sm', block: true }),
									'border-none bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white transition-all hover:shadow-lg'
								)}>Choose a size</a
							>
						</div>
					</div>
				</article>
			{/each}

			{#if data.popularProducts.length === 0}
				<div class="col-span-full rounded-lg bg-white p-8 text-center shadow-sm">
					<Package class="mx-auto h-10 w-10 text-ink/30" />
					<p class="mt-3 text-ink/70">The featured menu is temporarily unavailable.</p>
					<a href="/menu" class={cx(buttonStyles({ tone: 'brand' }), 'mt-4')}>Browse menu</a>
				</div>
			{/if}
		</div>
	</div>
</section>

<!-- 3. Ordering channels: explain the handoff after customers see the menu. -->
<section id="order" class="scroll-mt-24 px-4 py-20" aria-labelledby="order-title">
	<div class="container mx-auto max-w-6xl">
		<div class="mb-10 text-center">
			<p class="text-sm font-semibold tracking-wider text-brand uppercase">How to order</p>
			<h2 id="order-title" class="mt-2 text-3xl font-bold md:text-4xl">
				Choose your ordering channel
			</h2>
			<p class="mx-auto mt-4 max-w-2xl text-ink/70">
				Check the menu and size first, then continue through one of the verified destinations below.
			</p>
		</div>

		{#if data.business.orderingChannels.length > 0}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{#each data.business.orderingChannels as channel (channel.id)}
					<a
						href={channel.href}
						class={cx(
							cardStyles,
							'group p-6 hover:border-brand',
							channel.id === 'whatsapp' && 'border-brand/20 bg-brand/5'
						)}
					>
						{#if channel.id === 'whatsapp'}
							<MessageCircle class="h-8 w-8 text-brand" />
						{:else}
							<Truck class="h-8 w-8 text-brand" />
						{/if}
						<h3 class="mt-4 text-lg font-bold">{channel.label}</h3>
						<p class="mt-1 text-sm text-ink/70">{channel.description}</p>
						<span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
							Continue <ArrowRight class="h-4 w-4" />
						</span>
					</a>
				{/each}
			</div>
		{:else}
			<p
				class="rounded-lg border border-surface-strong bg-surface-muted p-6 text-center text-ink/70"
				role="status"
			>
				{publicMessages.orderingUnavailable}
			</p>
		{/if}
	</div>
</section>

<!-- 4. Observable ordering details; unsupported marketing claims stay unpublished. -->
<section id="about" class="scroll-mt-24 bg-surface-muted px-4 py-20" aria-labelledby="about-title">
	<div class="container mx-auto">
		<div class="mb-12 text-center">
			<p class="text-sm font-semibold tracking-wider text-brand uppercase">Plan your order</p>
			<h2 id="about-title" class="mt-2 text-3xl font-bold md:text-4xl">What you can check here</h2>
			<p class="mx-auto mt-4 max-w-2xl text-ink/70">
				Use current catalog and availability information before leaving for another ordering
				channel.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			{#each features as feature (feature.title)}
				<article class={cx(cardStyles, 'bg-surface transition-shadow hover:shadow-xl')}>
					<div class={cx(cardBodyStyles, 'items-center text-center')}>
						<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
							{#if feature.icon === Package}
								<Package class="h-8 w-8 text-brand" />
							{:else if feature.icon === Sparkles}
								<Sparkles class="h-8 w-8 text-brand" />
							{:else}
								<Shield class="h-8 w-8 text-brand" />
							{/if}
						</div>
						<h3 class={cardTitleStyles}>{feature.title}</h3>
						<p class="text-ink/70">{feature.description}</p>
					</div>
				</article>
			{/each}
		</div>
	</div>
</section>
