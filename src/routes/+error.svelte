<script lang="ts">
	import { page } from '$app/stores';
	import Logo from '$lib/assets/logo.svg';
	import { buttonStyles } from '$lib/styles';
</script>

<svelte:head>
	<title>{$page.status} - Klimboys</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="grid min-h-screen place-items-center bg-surface-muted px-4 py-12 text-center">
	<div class="max-w-lg">
		<a href="/" class="inline-block">
			<img src={Logo} alt="Klimboys" class="mx-auto h-16 w-auto" />
		</a>
		<p class="mt-8 text-sm font-semibold tracking-widest text-brand uppercase">{$page.status}</p>
		<h1 class="mt-2 text-4xl font-bold text-ink">
			{$page.status === 404 ? 'Page not found' : 'Something went wrong'}
		</h1>
		<p class="mt-4 text-ink/70">
			{$page.status === 404
				? 'The page may have moved or is not available yet.'
				: $page.error?.message || 'Please try again from the homepage.'}
		</p>
		<div class="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
			<a href="/" class={buttonStyles({ tone: 'brand' })}>Back to Home</a>
			<a href="/menu" class={buttonStyles({ variant: 'outline', tone: 'brand' })}> View Menu </a>
		</div>
	</div>
</main>
