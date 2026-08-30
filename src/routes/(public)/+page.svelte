<script lang="ts">
	import {
		ArrowRight,
		ChevronRight,
		Clock,
		MessageCircle,
		Package,
		Shield,
		Sparkles,
		Star,
		Truck
	} from '@lucide/svelte';
	import Mascot from '$lib/assets/klimboys-maskot.svg';
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
			icon: Sparkles,
			title: 'Premium Quality',
			description: 'Made with the finest ingredients and fresh milk daily'
		},
		{
			icon: Truck,
			title: 'Fast Delivery',
			description: 'Get your favorite shakes delivered within 30 minutes'
		},
		{
			icon: Clock,
			title: 'Open Late',
			description: 'Serving you refreshing treats until late night'
		},
		{
			icon: Shield,
			title: '100% Fresh',
			description: 'No preservatives, just pure natural goodness'
		}
	];

	const testimonials = [
		{
			name: 'Sarah Johnson',
			comment: 'Best milkshakes in town! The chocolate one is my absolute favorite.',
			rating: 5
		},
		{
			name: 'Mike Chen',
			comment: 'Amazing quality and super fast delivery. Highly recommend!',
			rating: 5
		},
		{
			name: 'Lisa Anderson',
			comment: 'Fresh ingredients and perfect sweetness. Love coming here!',
			rating: 5
		}
	];
</script>

<svelte:head>
	<title>Klimboys - Premium Milkshake Store</title>
	<meta
		name="description"
		content="Experience the best milkshakes in town at Klimboys. Fresh ingredients, premium quality, and fast delivery."
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
			<p class="py-6 text-lg text-ink/80 md:text-xl">
				Browse the live Klimboys menu, choose your size, then order through the channel that works
				best for you.
			</p>
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
				Check the menu and size first, then continue through WhatsApp or a delivery platform.
			</p>
		</div>

		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
			<a
				href="/go/whatsapp"
				class={cx(cardStyles, 'group border-brand/20 bg-brand/5 p-6 hover:border-brand')}
			>
				<MessageCircle class="h-8 w-8 text-brand" />
				<h3 class="mt-4 text-lg font-bold">WhatsApp</h3>
				<p class="mt-1 text-sm text-ink/70">Send your selected shake directly to Klimboys.</p>
				<span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
					Continue to WhatsApp <ArrowRight class="h-4 w-4" />
				</span>
			</a>
			<a href="/go/gofood" class={cx(cardStyles, 'group p-6 hover:border-brand')}>
				<Truck class="h-8 w-8 text-red-600" />
				<h3 class="mt-4 text-lg font-bold">GoFood</h3>
				<p class="mt-1 text-sm text-ink/70">Order for delivery through GoFood.</p>
				<span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
					Open GoFood <ArrowRight class="h-4 w-4" />
				</span>
			</a>
			<a href="/go/grabfood" class={cx(cardStyles, 'group p-6 hover:border-brand')}>
				<Truck class="h-8 w-8 text-green-600" />
				<h3 class="mt-4 text-lg font-bold">GrabFood</h3>
				<p class="mt-1 text-sm text-ink/70">Order for delivery through GrabFood.</p>
				<span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
					Open GrabFood <ArrowRight class="h-4 w-4" />
				</span>
			</a>
			<a href="/go/shopeefood" class={cx(cardStyles, 'group p-6 hover:border-brand')}>
				<Truck class="h-8 w-8 text-orange-600" />
				<h3 class="mt-4 text-lg font-bold">ShopeeFood</h3>
				<p class="mt-1 text-sm text-ink/70">Order for delivery through ShopeeFood.</p>
				<span class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand">
					Open ShopeeFood <ArrowRight class="h-4 w-4" />
				</span>
			</a>
		</div>
	</div>
</section>

<!-- 4. Quality proof. -->
<section id="about" class="scroll-mt-24 bg-surface-muted px-4 py-20" aria-labelledby="about-title">
	<div class="container mx-auto">
		<div class="mb-12 text-center">
			<p class="text-sm font-semibold tracking-wider text-brand uppercase">Why Klimboys</p>
			<h2 id="about-title" class="mt-2 text-3xl font-bold md:text-4xl">Made for a better shake</h2>
			<p class="mx-auto mt-4 max-w-2xl text-ink/70">
				Quality ingredients and service designed around a fresh milkshake experience.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
			{#each features as feature (feature.title)}
				<article class={cx(cardStyles, 'bg-surface transition-shadow hover:shadow-xl')}>
					<div class={cx(cardBodyStyles, 'items-center text-center')}>
						<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
							{#if feature.icon === Sparkles}
								<Sparkles class="h-8 w-8 text-brand" />
							{:else if feature.icon === Truck}
								<Truck class="h-8 w-8 text-brand" />
							{:else if feature.icon === Clock}
								<Clock class="h-8 w-8 text-brand" />
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

<!-- 5. Reviews, followed by location, hours, and contact in the global footer. -->
<section
	class="bg-gradient-to-br from-purple-50 via-pink-50 to-white px-4 py-20"
	aria-labelledby="reviews-title"
>
	<div class="container mx-auto">
		<div class="mb-12 text-center">
			<h2
				id="reviews-title"
				class="mb-4 bg-gradient-to-r from-purple-600 to-[#FF6B6B] bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
			>
				What our customers say
			</h2>
			<p class="text-gray-600">Reviews from shake lovers.</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			{#each testimonials as testimonial (testimonial.name)}
				<figure
					class={cx(
						cardStyles,
						cardBodyStyles,
						'border border-purple-100 bg-white shadow-lg transition-shadow hover:shadow-xl'
					)}
				>
					<div
						class="mb-4 flex justify-center gap-1"
						aria-label={`${testimonial.rating} out of 5 stars`}
					>
						{#each Array(testimonial.rating).keys() as starIndex (starIndex)}
							<Star class="h-5 w-5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
						{/each}
					</div>
					<blockquote class="mb-6 text-center leading-relaxed text-gray-700">
						“{testimonial.comment}”
					</blockquote>
					<figcaption class="border-t pt-4 text-center">
						<p class="font-semibold text-gray-800">{testimonial.name}</p>
						<p class="text-sm text-gray-500">Verified customer</p>
					</figcaption>
				</figure>
			{/each}
		</div>
	</div>
</section>
