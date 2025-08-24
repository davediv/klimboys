<script lang="ts">
	import { page } from '$app/stores';
	import Logo from '$lib/assets/logo.svg';
	import { Menu, X, ShoppingBag, User } from '@lucide/svelte';

	let mobileMenuOpen = $state(false);

	const navItems = [
		{ href: '/', label: 'Home' },
		{ href: '/menu', label: 'Menu' },
		{ href: '/about', label: 'About' },
		{ href: '/contact', label: 'Contact' }
	];
</script>

<header class="sticky top-0 z-50 navbar border-b border-base-200 bg-base-100 shadow-sm">
	<div class="navbar-start">
		<div class="dropdown lg:hidden">
			<button
				tabindex="0"
				class="btn btn-circle btn-ghost"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
			{#if mobileMenuOpen}
				<ul
					class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					{#each navItems as item}
						<li>
							<a
								href={item.href}
								class="font-medium {$page.url.pathname === item.href ? 'active' : ''}"
								onclick={() => (mobileMenuOpen = false)}
							>
								{item.label}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<a href="/" class="flex items-center gap-2 px-2">
			<img src={Logo} alt="Klimboys Logo" class="h-8 w-auto sm:h-10" />
		</a>
	</div>

	<div class="navbar-center hidden lg:flex">
		<ul class="menu menu-horizontal gap-2 px-1">
			{#each navItems as item}
				<li>
					<a
						href={item.href}
						class="font-medium {$page.url.pathname === item.href ? 'active text-primary' : ''}"
					>
						{item.label}
					</a>
				</li>
			{/each}
		</ul>
	</div>

	<div class="navbar-end">
		<button class="btn btn-circle btn-ghost" aria-label="Shopping cart">
			<ShoppingBag class="h-5 w-5" />
		</button>
		<div class="dropdown dropdown-end">
			<button tabindex="0" class="btn btn-circle btn-ghost" aria-label="User menu">
				<User class="h-5 w-5" />
			</button>
			<ul class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow">
				<li><a href="/login">Login</a></li>
				<li><a href="/register">Register</a></li>
			</ul>
		</div>
	</div>
</header>
