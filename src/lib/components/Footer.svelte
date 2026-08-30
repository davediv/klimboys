<script lang="ts">
	import { Clock, ExternalLink, Mail, MapPin, Phone } from '@lucide/svelte';
	import Logo from '$lib/assets/logo.svg';
	import { publicMessages, type PublicBusinessConfig } from '$lib/business';

	let { business }: { business: PublicBusinessConfig } = $props();
</script>

<div id="contact" class="scroll-mt-24 bg-surface-muted">
	<div class="container mx-auto px-4">
		<footer
			class="grid w-full grid-cols-1 place-items-start gap-8 p-10 text-sm leading-5 text-ink md:grid-cols-2 lg:grid-cols-4"
		>
			<div class="grid place-items-start gap-2">
				<img src={Logo} alt="Klimboys" class="mb-4 h-12 w-auto" />
				<p class="text-lg font-semibold">Klimboys Milkshake Store</p>
				<p class="mt-2 max-w-xs">{business.summary}</p>
			</div>

			<nav class="grid place-items-start gap-2" aria-label="Footer navigation">
				<h2 class="mb-2 font-semibold uppercase opacity-60">Quick links</h2>
				<a
					href="/menu"
					class="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Our menu</a
				>
				<a
					href="/#about"
					class="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
					>About Klimboys</a
				>
				<a
					href="/#contact"
					class="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2">Contact</a
				>
				<a
					href="/staff-login"
					class="hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
					>Staff sign in</a
				>
			</nav>

			<section class="grid place-items-start gap-2" aria-labelledby="store-contact-title">
				<h2 id="store-contact-title" class="mb-2 font-semibold uppercase opacity-60">
					Store contact
				</h2>
				{#if business.contact.address}
					<div class="flex items-start gap-2">
						<MapPin class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
						{#if business.contact.mapsHref}
							<a class="hover:underline" href={business.contact.mapsHref}>
								{business.contact.address}
								<span class="sr-only"> (opens verified map)</span>
							</a>
						{:else}
							<span>{business.contact.address}</span>
						{/if}
					</div>
				{:else if business.contact.mapsHref}
					<a class="flex items-center gap-2 hover:underline" href={business.contact.mapsHref}>
						<MapPin class="h-4 w-4 shrink-0" aria-hidden="true" />
						Open verified map
					</a>
				{/if}
				{#if business.contact.phone && business.contact.phoneHref}
					<a class="flex items-center gap-2 hover:underline" href={business.contact.phoneHref}>
						<Phone class="h-4 w-4 shrink-0" aria-hidden="true" />
						{business.contact.phone}
					</a>
				{/if}
				{#if business.contact.email}
					<a
						class="flex items-center gap-2 hover:underline"
						href={`mailto:${business.contact.email}`}
					>
						<Mail class="h-4 w-4 shrink-0" aria-hidden="true" />
						{business.contact.email}
					</a>
				{/if}
				{#if !business.contact.hasDetails && !business.contact.mapsHref}
					<p class="text-ink/60">{publicMessages.contactUnavailable}</p>
				{/if}
			</section>

			<section class="grid place-items-start gap-3" aria-labelledby="hours-social-title">
				<h2 id="hours-social-title" class="mb-1 font-semibold uppercase opacity-60">
					Hours and social
				</h2>
				{#if business.contact.openingHours.length > 0}
					<div class="flex items-start gap-2">
						<Clock class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
						<div>
							{#each business.contact.openingHours as hours (hours)}
								<p>{hours}</p>
							{/each}
						</div>
					</div>
				{/if}
				{#if business.socialLinks.length > 0}
					<nav class="flex flex-wrap gap-3" aria-label="Klimboys social profiles">
						{#each business.socialLinks as social (social.id)}
							<a
								class="inline-flex items-center gap-1 font-medium hover:text-brand"
								href={social.href}
							>
								{social.label}<ExternalLink class="h-3.5 w-3.5" aria-hidden="true" />
							</a>
						{/each}
					</nav>
				{:else if business.contact.openingHours.length === 0}
					<p class="text-ink/60">Verified hours and social profiles are not published yet.</p>
				{/if}
			</section>
		</footer>
	</div>
</div>

<div class="bg-surface-strong">
	<div class="container mx-auto">
		<div class="grid w-full place-items-center p-4 text-center text-sm leading-5 text-ink">
			<p>© {new Date().getFullYear()} Klimboys. All rights reserved.</p>
		</div>
	</div>
</div>
