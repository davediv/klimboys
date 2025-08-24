<script lang="ts">
	import { page } from '$app/stores';
	import Logo from '$lib/assets/logo.svg';
	import { Menu, X } from '@lucide/svelte';
	import { fly, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	interface Props {
		user?: {
			id: string;
			email: string;
			name?: string | null;
			role: string;
			emailVerified: boolean;
			image?: string | null;
			createdAt: Date;
			updatedAt: Date;
		} | null;
	}

	let { user = null }: Props = $props();

	let mobileMenuOpen = $state(false);
	let scrolled = $state(false);

	// Track scroll position for navbar transparency
	$effect(() => {
		function handleScroll() {
			scrolled = window.scrollY > 50;
		}

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	// Dynamic nav items based on user role
	let navItems = $derived(() => {
		const items = [
			{ href: '/', label: 'Home' },
			{ href: '/menu', label: 'Menu' },
			{ href: '/about', label: 'About' },
			{ href: '/contact', label: 'Contact' }
		];

		// Add role-specific items
		if (user?.role === 'admin') {
			items.push(
				{ href: '/dashboard', label: 'Dashboard' },
				{ href: '/admin/products', label: 'Products' }
			);
		} else if (user?.role === 'cashier') {
			items.push(
				{ href: '/dashboard/transaction', label: 'POS' },
				{ href: '/dashboard', label: 'Dashboard' }
			);
		}

		// Add login/logout items
		if (user) {
			items.push({ href: '/profile', label: 'Profile' });
		} else {
			items.push({ href: '/login', label: 'Login' });
			items.push({ href: '/register', label: 'Register' });
		}

		return items;
	});

	async function handleLogout() {
		await fetch('/api/auth/sign-out', { method: 'POST' });
		window.location.href = '/';
	}
</script>

<header
	class="fixed top-0 right-0 left-0 z-50 transition-all duration-300 {scrolled
		? 'bg-white shadow-md'
		: 'bg-transparent'}"
>
	<div class="container mx-auto px-4">
		<div class="flex items-center justify-between py-4">
			<!-- Logo (Left) -->
			<a href="/" class="flex items-center">
				<img
					src={Logo}
					alt="Klimboys"
					class="h-12 w-auto transition-all duration-300 sm:h-14 md:h-16"
				/>
			</a>

			<!-- Hamburger Menu (Right) -->
			<button
				class="relative z-50 rounded-lg p-2 transition-all duration-300 {scrolled
					? 'hover:bg-gray-100'
					: 'bg-white/80 backdrop-blur-sm hover:bg-white/90'} {mobileMenuOpen ? 'rotate-90' : ''}"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle menu"
			>
				<div class="relative h-6 w-6">
					{#if mobileMenuOpen}
						<div
							transition:fade={{ duration: 150 }}
							class="absolute inset-0 flex items-center justify-center"
						>
							<X class="h-6 w-6 text-gray-900" />
						</div>
					{:else}
						<div
							transition:fade={{ duration: 150 }}
							class="absolute inset-0 flex items-center justify-center"
						>
							<Menu class="h-6 w-6 text-gray-900" />
						</div>
					{/if}
				</div>
			</button>
		</div>
	</div>

	<!-- Full-screen Menu Overlay -->
	{#if mobileMenuOpen}
		<!-- Backdrop -->
		<button
			class="fixed inset-0 z-40 bg-black/50"
			onclick={() => (mobileMenuOpen = false)}
			aria-label="Close menu"
			transition:fade={{ duration: 300, easing: quintOut }}
		></button>

		<!-- Menu Panel -->
		<div
			class="fixed top-0 right-0 z-40 h-full w-full bg-white shadow-2xl sm:w-96"
			transition:fly={{ x: '100%', duration: 300, easing: quintOut }}
		>
			<div class="flex h-full flex-col">
				<!-- Menu Header -->
				<div class="flex items-center justify-between border-b p-6">
					<h2 class="text-xl font-bold text-gray-900">Menu</h2>
				</div>

				<!-- Menu Items -->
				<nav class="flex-1 overflow-y-auto">
					<ul class="py-4">
						{#each navItems() as item}
							<li>
								<a
									href={item.href}
									class="block px-6 py-3 text-lg font-medium transition-colors hover:bg-gray-50 {$page
										.url.pathname === item.href
										? 'bg-red-50 text-[#FF6B6B]'
										: 'text-gray-900'}"
									onclick={() => (mobileMenuOpen = false)}
								>
									{item.label}
								</a>
							</li>
						{/each}

						{#if user}
							<li class="mt-4 border-t pt-4">
								<button
									onclick={handleLogout}
									class="block w-full px-6 py-3 text-left text-lg font-medium text-red-600 transition-colors hover:bg-red-50"
								>
									Logout
								</button>
							</li>
						{/if}
					</ul>
				</nav>

				<!-- User Info (if logged in) -->
				{#if user}
					<div class="border-t p-6">
						<div class="text-sm text-gray-600">
							<p class="font-medium text-gray-900">{user.name || user.email}</p>
							<p class="capitalize">{user.role}</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</header>

<style>
	/* Add padding to body to account for fixed header */
	:global(body) {
		padding-top: 0;
	}
</style>
