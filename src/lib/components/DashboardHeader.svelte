<script lang="ts">
	import { Menu, LogOut, User, Moon, Sun } from '@lucide/svelte';
	import { signOut } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { theme, toggleTheme } from '$lib/stores/theme';
	import type { User as UserType } from 'better-auth';

	let {
		user,
		onmenuclick = () => {}
	}: {
		user?: UserType | null;
		onmenuclick?: () => void;
	} = $props();

	async function handleLogout() {
		await signOut();
		goto('/login');
	}
</script>

<header class="bg-base-100 border-base-300 border-b">
	<div class="px-4 py-3">
		<div class="flex items-center justify-between">
			<!-- Mobile menu button -->
			<button
				class="btn btn-ghost btn-circle lg:hidden"
				onclick={onmenuclick}
				aria-label="Open menu"
			>
				<Menu class="h-5 w-5" />
			</button>

			<!-- Title (hidden on mobile when menu is visible) -->
			<h1 class="hidden text-lg font-semibold sm:block lg:hidden">Dashboard</h1>

			<!-- Spacer for desktop -->
			<div class="hidden flex-1 lg:block"></div>

			<!-- Right side actions -->
			<div class="flex items-center gap-2">
				<!-- Dark mode toggle -->
				<button
					class="btn btn-ghost btn-circle"
					onclick={toggleTheme}
					aria-label="Toggle theme"
					title="Toggle theme"
				>
					{#if $theme === 'light'}
						<Moon class="h-5 w-5" />
					{:else}
						<Sun class="h-5 w-5" />
					{/if}
				</button>

				<!-- User dropdown -->
				<div class="dropdown dropdown-end">
					<button tabindex="0" class="btn btn-ghost btn-circle avatar" aria-label="User menu">
						<div class="w-10 rounded-full">
							<img src="/favicon.png" alt="User avatar" class="animate-spin-slow" />
						</div>
					</button>

					<ul
						class="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
					>
						<li class="menu-title">
							<span>{user?.email || 'No email'}</span>
						</li>
						<li>
							<a href="/dashboard/settings">
								<User class="h-4 w-4" />
								Settings
							</a>
						</li>
						<li>
							<button onclick={handleLogout} class="text-error">
								<LogOut class="h-4 w-4" />
								Logout
							</button>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</header>
