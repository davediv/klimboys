<script lang="ts">
	import { useSession } from '$lib/auth';
	import { ArrowRight, Users, Shield, TrendingUp, Zap } from '@lucide/svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';

	const session = useSession();

	const features = [
		{
			icon: Shield,
			title: 'Secure',
			description: 'Built with security best practices and modern authentication'
		},
		{
			icon: TrendingUp,
			title: 'Analytics',
			description: 'Comprehensive dashboard with real-time analytics and insights'
		},
		{
			icon: Zap,
			title: 'Fast',
			description: 'Lightning-fast performance with Cloudflare Workers and SvelteKit'
		}
	];
</script>

<svelte:head>
	<title>SV Dashboard - Modern Web Application</title>
	<meta
		name="description"
		content="A modern dashboard application built with SvelteKit, Cloudflare Workers, and DaisyUI"
	/>
</svelte:head>

{#if !$session.isPending}
	<!-- Hero Section -->
	<div class="from-primary/10 via-base-100 to-secondary/10 min-h-screen bg-gradient-to-br">
		<!-- Header with theme toggle -->
		<div class="container mx-auto px-4 pt-4">
			<div class="flex justify-end">
				<ThemeToggle />
			</div>
		</div>

		<div class="container mx-auto px-4 pt-16 pb-16">
			<div class="mx-auto max-w-4xl text-center">
				<h1 class="text-base-content mb-6 text-5xl font-bold md:text-6xl">
					Welcome to
					<span class="text-primary">SV Dashboard</span>
				</h1>
				<p class="text-base-content/70 mx-auto mb-8 max-w-2xl text-xl">
					A modern, secure, and feature-rich dashboard application built with the latest web
					technologies. Get started with powerful management and analytics tools.
				</p>

				<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
					{#if $session.data}
						<a href="/dashboard" class="btn btn-primary btn-lg">
							Go to Dashboard
							<ArrowRight class="ml-2 h-5 w-5" />
						</a>
					{:else}
						<a href="/register" class="btn btn-primary btn-lg">
							Get Started
							<ArrowRight class="ml-2 h-5 w-5" />
						</a>
						<a href="/login" class="btn btn-outline btn-lg"> Sign In </a>
					{/if}
				</div>
			</div>
		</div>

		<!-- Features Section -->
		<div class="container mx-auto px-4 py-16">
			<div class="mb-12 text-center">
				<h2 class="text-base-content mb-4 text-3xl font-bold md:text-4xl">
					Why Choose SV Dashboard?
				</h2>
				<p class="text-base-content/70 mx-auto max-w-2xl text-lg">
					Built with modern technologies and best practices to deliver exceptional performance and
					user experience.
				</p>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
				{#each features as feature (feature.title)}
					{@const Icon = feature.icon}
					<div
						class="card bg-base-100 border-base-300 border shadow-lg transition-shadow hover:shadow-xl"
					>
						<div class="card-body text-center">
							<div
								class="bg-primary/10 mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
							>
								<Icon class="text-primary h-6 w-6" />
							</div>
							<h3 class="card-title justify-center text-xl">{feature.title}</h3>
							<p class="text-base-content/70">{feature.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Tech Stack Section -->
		<div class="bg-base-200/50 py-16">
			<div class="container mx-auto px-4">
				<div class="mb-12 text-center">
					<h2 class="text-base-content mb-4 text-3xl font-bold md:text-4xl">
						Built with Modern Technologies
					</h2>
					<p class="text-base-content/70 text-lg">
						Powered by the latest web technologies for optimal performance and developer experience.
					</p>
				</div>

				<div
					class="grid grid-cols-2 items-center justify-items-center gap-8 md:grid-cols-4 lg:grid-cols-6"
				>
					{#each ['SvelteKit', 'TypeScript', 'TailwindCSS', 'DaisyUI', 'Cloudflare', 'Drizzle'] as tech (tech)}
						<div class="text-center">
							<div
								class="bg-base-100 border-base-300 mb-2 flex h-16 w-16 items-center justify-center rounded-lg border shadow-md"
							>
								<span class="text-primary text-2xl font-bold">{tech.charAt(0)}</span>
							</div>
							<p class="text-base-content/70 text-sm font-medium">{tech}</p>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- CTA Section -->
		<div class="container mx-auto px-4 py-16">
			<div class="card bg-primary text-primary-content shadow-xl">
				<div class="card-body py-12 text-center">
					{#if $session.data}
						<h2 class="mb-4 text-3xl font-bold md:text-4xl">
							Welcome back, {$session.data.user.name}!
						</h2>
						<p class="mx-auto mb-8 max-w-2xl text-lg opacity-90">
							Access your dashboard to manage your account and view analytics.
						</p>
						<div class="flex flex-col justify-center gap-4 sm:flex-row">
							<a href="/dashboard" class="btn btn-secondary btn-lg">
								Go to Dashboard
								<ArrowRight class="ml-2 h-5 w-5" />
							</a>
						</div>
					{:else}
						<h2 class="mb-4 text-3xl font-bold md:text-4xl">Ready to Get Started?</h2>
						<p class="mx-auto mb-8 max-w-2xl text-lg opacity-90">
							Join thousands of users who trust SV Dashboard for their web application needs. Create
							your account today and experience the difference.
						</p>
						<div class="flex flex-col justify-center gap-4 sm:flex-row">
							<a href="/register" class="btn btn-secondary btn-lg">
								Create Account
								<ArrowRight class="ml-2 h-5 w-5" />
							</a>
							<a href="/login" class="btn btn-outline btn-primary-content btn-lg"> Sign In </a>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{:else}
	<div class="flex min-h-screen items-center justify-center">
		<div class="loading loading-spinner loading-lg"></div>
	</div>
{/if}
