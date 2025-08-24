<script lang="ts">
	import { ArrowRight, Sparkles, Truck, Clock, Shield, Star, ChevronRight } from '@lucide/svelte';

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
</svelte:head>

<!-- Hero Section -->
<section class="hero min-h-[80vh] bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10">
	<div class="hero-content text-center">
		<div class="max-w-3xl">
			<div class="mb-4 inline-block">
				<span class="badge gap-2 badge-lg badge-primary">
					<Sparkles class="h-4 w-4" />
					Now Open for Delivery
				</span>
			</div>
			<h1
				class="bg-gradient-to-r from-primary to-secondary bg-clip-text text-5xl font-bold text-transparent md:text-7xl"
			>
				Shake Up Your Day
			</h1>
			<p class="py-6 text-lg text-base-content/80 md:text-xl">
				Premium milkshakes crafted with love. From classic flavors to unique creations, experience
				the perfect blend of taste and quality.
			</p>
			<div class="flex flex-col justify-center gap-4 sm:flex-row">
				<a href="/menu" class="btn gap-2 btn-lg btn-primary">
					View Menu
					<ArrowRight class="h-5 w-5" />
				</a>
				<button class="btn btn-outline btn-lg">Order Now</button>
			</div>
		</div>
	</div>
</section>

<!-- Features Section -->
<section class="px-4 py-20">
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
<section class="bg-base-200/50 px-4 py-20">
	<div class="container mx-auto">
		<div class="mb-12 flex items-center justify-between">
			<div>
				<h2 class="mb-2 text-3xl font-bold md:text-4xl">Popular Shakes</h2>
				<p class="text-base-content/70">Customer favorites you'll love</p>
			</div>
			<a href="/menu" class="btn gap-2 btn-ghost">
				View All
				<ChevronRight class="h-5 w-5" />
			</a>
		</div>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
			{#each popularItems as item}
				<div
					class="card bg-base-100 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl"
				>
					<figure class="px-4 pt-4">
						<img src={item.image} alt={item.name} class="h-48 w-full rounded-xl object-cover" />
					</figure>
					<div class="card-body">
						<div class="mb-2 flex items-center gap-2">
							<Star class="h-4 w-4 fill-warning text-warning" />
							<span class="text-sm font-medium">{item.rating}</span>
						</div>
						<h3 class="card-title">{item.name}</h3>
						<p class="text-xl font-bold text-primary">{item.price}</p>
						<div class="mt-4 card-actions justify-end">
							<button class="btn w-full btn-sm btn-primary">Add to Cart</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA Section -->
<section class="px-4 py-20">
	<div class="container mx-auto">
		<div class="card bg-gradient-to-r from-primary to-secondary text-primary-content">
			<div class="card-body py-16 text-center">
				<h2 class="mb-4 text-3xl font-bold md:text-4xl">Ready to Taste the Difference?</h2>
				<p class="mx-auto mb-8 max-w-2xl text-lg opacity-90">
					Join thousands of happy customers who made Klimboys their favorite milkshake destination.
				</p>
				<div class="flex flex-col justify-center gap-4 sm:flex-row">
					<button class="btn btn-lg btn-neutral">Order Online</button>
					<button class="btn text-primary-content btn-ghost btn-lg">Find Our Store</button>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Testimonials Section -->
<section class="bg-base-200/50 px-4 py-20">
	<div class="container mx-auto">
		<div class="mb-12 text-center">
			<h2 class="mb-4 text-3xl font-bold md:text-4xl">What Our Customers Say</h2>
			<p class="text-base-content/70">Real reviews from real shake lovers</p>
		</div>
		<div class="grid grid-cols-1 gap-8 md:grid-cols-3">
			{#each testimonials as testimonial}
				<div class="card bg-base-100">
					<div class="card-body">
						<div class="mb-4 flex gap-1">
							{#each Array(testimonial.rating) as _}
								<Star class="h-5 w-5 fill-warning text-warning" />
							{/each}
						</div>
						<p class="text-base-content/80 italic">"{testimonial.comment}"</p>
						<div class="mt-4">
							<p class="font-semibold">{testimonial.name}</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Newsletter Section -->
<section class="px-4 py-20">
	<div class="container mx-auto max-w-2xl text-center">
		<h2 class="mb-4 text-3xl font-bold md:text-4xl">Stay Updated</h2>
		<p class="mb-8 text-base-content/70">
			Get exclusive offers and be the first to know about new flavors!
		</p>
		<form class="mx-auto flex max-w-md flex-col gap-4 sm:flex-row">
			<input
				type="email"
				placeholder="Enter your email"
				class="input-bordered input flex-1"
				required
			/>
			<button type="submit" class="btn btn-primary">Subscribe</button>
		</form>
	</div>
</section>
