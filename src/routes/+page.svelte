<script lang="ts">
	import {
		ArrowRight,
		Sparkles,
		Truck,
		Clock,
		Shield,
		Star,
		ChevronRight,
		MessageCircle
	} from '@lucide/svelte';
	import Mascot from '$lib/assets/klimboys-maskot.svg';

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

	const popularItems = [
		{
			name: 'Classic Chocolate',
			price: 'Rp 35.000',
			image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
			rating: 4.9
		},
		{
			name: 'Strawberry Delight',
			price: 'Rp 38.000',
			image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&h=400&fit=crop',
			rating: 4.8
		},
		{
			name: 'Vanilla Dream',
			price: 'Rp 32.000',
			image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
			rating: 4.7
		},
		{
			name: 'Oreo Blast',
			price: 'Rp 40.000',
			image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=400&h=400&fit=crop',
			rating: 4.9
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

<!-- Hero Section -->
<section
	class="hero min-h-screen bg-gradient-to-br from-[#FF6B6B]/10 via-base-100 to-secondary/10 pt-20"
	data-theme="light"
>
	<div class="hero-content flex-col lg:flex-row-reverse">
		<img src={Mascot} alt="Klimboys Mascot" class="w-full max-w-sm rounded-lg lg:w-1/2" />
		<div class="max-w-3xl text-center lg:text-left">
			<div class="mb-4 inline-block">
				<span
					class="badge gap-2 badge-lg"
					style="background-color: #FF6B6B; color: white; border-color: #FF6B6B;"
				>
					<Sparkles class="h-4 w-4" />
					Now Open for Delivery
				</span>
			</div>
			<h1
				class="text-5xl font-bold md:text-7xl"
				style="background: linear-gradient(to right, #FF6B6B, #FF8E8E); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;"
			>
				Shake Up Your Day
			</h1>
			<p class="py-6 text-lg text-base-content/80 md:text-xl">
				Premium milkshakes crafted with love. From classic flavors to unique creations, experience
				the perfect blend of taste and quality.
			</p>
			<div class="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
				<a
					href="/menu"
					class="btn gap-2 btn-lg"
					style="background-color: #FF6B6B; color: white; border-color: #FF6B6B;"
				>
					View Menu
					<ArrowRight class="h-5 w-5" />
				</a>
				<a href="/go/whatsapp" class="btn gap-2 btn-outline btn-lg">
					<MessageCircle class="h-5 w-5" />
					Order via WhatsApp
				</a>
			</div>
			<!-- Delivery Partners -->
			<div class="mt-8">
				<p class="mb-3 text-sm text-base-content/60">Also available on:</p>
				<div class="flex flex-wrap justify-center gap-4 lg:justify-start">
					<a href="/go/gofood" class="btn btn-ghost btn-sm">
						<span class="font-bold">GoFood</span>
					</a>
					<a href="/go/grabfood" class="btn btn-ghost btn-sm">
						<span class="font-bold text-green-600">GrabFood</span>
					</a>
					<a href="/go/shopeefood" class="btn btn-ghost btn-sm">
						<span class="font-bold text-orange-600">ShopeeFood</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Partners/Clients Carousel Section -->
<section class="bg-gradient-to-r from-pink-50 via-white to-red-50 py-16" data-theme="light">
	<div class="container mx-auto px-4">
		<div class="mb-8 text-center">
			<p class="text-sm font-semibold tracking-wider text-[#FF6B6B] uppercase">Trusted By</p>
			<h3 class="mt-2 text-2xl font-bold text-gray-900">Our Partners & Platforms</h3>
		</div>

		<!-- Carousel Container -->
		<div class="relative overflow-hidden">
			<!-- Gradient Masks for smooth edges -->
			<div
				class="absolute top-0 bottom-0 left-0 z-10 w-20 bg-gradient-to-r from-pink-50 via-white/80 to-transparent"
			></div>
			<div
				class="absolute top-0 right-0 bottom-0 z-10 w-20 bg-gradient-to-l from-red-50 via-white/80 to-transparent"
			></div>

			<!-- Scrolling Container -->
			<div class="animate-scroll flex items-center space-x-12">
				<!-- First set of logos -->
				<div class="flex shrink-0 items-center space-x-16">
					<!-- GoFood -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-2xl font-bold text-transparent"
							>GoFood</span
						>
					</div>

					<!-- GrabFood -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-2xl font-bold text-transparent"
							>GrabFood</span
						>
					</div>

					<!-- ShopeeFood -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-2xl font-bold text-transparent"
							>ShopeeFood</span
						>
					</div>

					<!-- UberEats -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span class="text-2xl font-bold"
							>Uber<span
								class="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
								>Eats</span
							></span
						>
					</div>

					<!-- Traveloka -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-2xl font-bold text-transparent"
							>Traveloka</span
						>
					</div>

					<!-- Maxim -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-2xl font-bold text-transparent"
							>Maxim</span
						>
					</div>
				</div>

				<!-- Duplicate set for seamless loop -->
				<div class="flex shrink-0 items-center space-x-16">
					<!-- GoFood -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-2xl font-bold text-transparent"
							>GoFood</span
						>
					</div>

					<!-- GrabFood -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-2xl font-bold text-transparent"
							>GrabFood</span
						>
					</div>

					<!-- ShopeeFood -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-2xl font-bold text-transparent"
							>ShopeeFood</span
						>
					</div>

					<!-- UberEats -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span class="text-2xl font-bold"
							>Uber<span
								class="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent"
								>Eats</span
							></span
						>
					</div>

					<!-- Traveloka -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-2xl font-bold text-transparent"
							>Traveloka</span
						>
					</div>

					<!-- Maxim -->
					<div
						class="flex h-20 items-center justify-center rounded-xl bg-white px-8 shadow-sm transition-shadow hover:shadow-md"
					>
						<span
							class="bg-gradient-to-r from-purple-500 to-purple-600 bg-clip-text text-2xl font-bold text-transparent"
							>Maxim</span
						>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="px-4 py-20" data-theme="light">
	<div class="container mx-auto">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">Why Choose Klimboys?</h2>
			<p class="mx-auto max-w-2xl text-base-content/70">
				We're committed to delivering the best milkshake experience with quality ingredients and
				exceptional service.
			</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
			{#each features as feature}
				<div class="card bg-base-100 transition-shadow hover:shadow-xl">
					<div class="card-body items-center text-center">
						<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							{#if feature.icon === Sparkles}
								<Sparkles class="h-8 w-8 text-primary" />
							{:else if feature.icon === Truck}
								<Truck class="h-8 w-8 text-primary" />
							{:else if feature.icon === Clock}
								<Clock class="h-8 w-8 text-primary" />
							{:else if feature.icon === Shield}
								<Shield class="h-8 w-8 text-primary" />
							{/if}
						</div>
						<h3 class="card-title">{feature.title}</h3>
						<p class="text-base-content/70">{feature.description}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Popular Items Section -->
<section
	class="bg-gradient-to-br from-orange-50 via-white to-pink-50 px-4 py-20"
	data-theme="light"
>
	<div class="container mx-auto">
		<div class="mb-12 flex items-center justify-between">
			<div>
				<h2
					class="mb-2 bg-gradient-to-r from-[#FF6B6B] to-orange-500 bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
				>
					Popular Shakes
				</h2>
				<p class="text-gray-600">Customer favorites you'll love</p>
			</div>
			<a href="/menu" class="btn gap-2 border-[#FF6B6B]/20 btn-ghost hover:bg-[#FF6B6B]/10">
				View All
				<ChevronRight class="h-5 w-5" />
			</a>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			{#each popularItems as item}
				<div
					class="card border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
				>
					<figure class="px-4 pt-4">
						<img src={item.image} alt={item.name} class="h-48 w-full rounded-xl object-cover" />
					</figure>
					<div class="card-body">
						<div class="mb-2 flex items-center gap-2">
							<Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />
							<span class="text-sm font-medium text-gray-700">{item.rating}</span>
						</div>
						<h3 class="card-title text-gray-800">{item.name}</h3>
						<p
							class="bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] bg-clip-text text-xl font-bold text-transparent"
						>
							{item.price}
						</p>
						<div class="mt-4 card-actions justify-end">
							<button
								class="btn w-full border-none bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] text-white transition-all btn-sm hover:scale-105 hover:shadow-lg"
								>Add to Cart</button
							>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="px-4 py-20" data-theme="light">
	<div class="container mx-auto">
		<div class="card text-white" style="background: linear-gradient(to right, #FF6B6B, #FF8E8E);">
			<div class="card-body py-16 text-center">
				<h2 class="mb-4 text-3xl font-bold md:text-4xl">Ready to Taste the Difference?</h2>
				<p class="mx-auto mb-8 max-w-2xl text-lg opacity-90">
					Join thousands of happy customers who made Klimboys their favorite milkshake destination.
				</p>
				<div class="flex flex-col justify-center gap-4 sm:flex-row">
					<a href="/go/whatsapp" class="btn btn-lg btn-neutral">Order via WhatsApp</a>
					<button class="btn text-white btn-ghost btn-lg">Find Our Store</button>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Testimonials Section -->
<section
	class="bg-gradient-to-br from-purple-50 via-pink-50 to-white px-4 py-20"
	data-theme="light"
>
	<div class="container mx-auto">
		<div class="mb-12 text-center">
			<h2
				class="mb-4 bg-gradient-to-r from-purple-600 to-[#FF6B6B] bg-clip-text text-3xl font-bold text-transparent md:text-4xl"
			>
				What Our Customers Say
			</h2>
			<p class="text-gray-600">Real reviews from real shake lovers</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			{#each testimonials as testimonial}
				<div
					class="card border border-purple-100 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
				>
					<div class="relative card-body">
						<!-- Quote Icon -->
						<div class="absolute -top-4 -left-2 font-serif text-6xl text-[#FF6B6B]/10">"</div>

						<div class="mb-4 flex justify-center gap-1">
							{#each Array(testimonial.rating) as _}
								<Star class="h-5 w-5 fill-yellow-400 text-yellow-400" />
							{/each}
						</div>
						<p class="mb-6 text-center leading-relaxed text-gray-700">
							{testimonial.comment}
						</p>
						<div class="border-t pt-4 text-center">
							<p class="font-semibold text-gray-800">{testimonial.name}</p>
							<p class="text-sm text-gray-500">Verified Customer</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<style>
	@keyframes scroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-50%);
		}
	}

	.animate-scroll {
		animation: scroll 20s linear infinite;
	}

	.animate-scroll:hover {
		animation-play-state: paused;
	}
</style>
