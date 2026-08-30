<script lang="ts">
	import { ArrowLeft, ShieldCheck } from '@lucide/svelte';
	import Logo from '$lib/assets/logo.svg';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description: string;
		children: Snippet;
	}

	let { title, description, children }: Props = $props();
</script>

<main
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-red-50 px-4 py-12"
>
	<div class="w-full max-w-md">
		<a
			href="/"
			class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to public website
		</a>

		<div class="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
			<div class="mb-8 text-center">
				<img src={Logo} alt="Klimboys" class="mx-auto h-14 w-auto" />
				<div class="mt-5 flex items-center justify-center gap-2 text-sm font-semibold text-brand">
					<ShieldCheck class="h-5 w-5" />
					Staff workspace
				</div>
				<h1 class="mt-2 text-3xl font-bold text-gray-900">{title}</h1>
				<p class="mt-2 text-gray-600">{description}</p>
			</div>

			{@render children()}
		</div>
	</div>
</main>
