<script lang="ts">
	import { MapPin, Phone, Mail, Clock } from '@lucide/svelte';
	import Logo from '$lib/assets/logo.svg';
</script>

<footer class="footer bg-base-200 p-10 text-base-content">
	<aside>
		<img src={Logo} alt="Klimboys" class="mb-4 h-12 w-auto" />
		<p class="text-lg font-semibold">Klimboys Milkshake Store</p>
		<p class="mt-2 max-w-xs">
			Premium milkshakes crafted with love. Your favorite spot for refreshing treats!
		</p>
	</aside>

	<nav>
		<header class="footer-title">Quick Links</header>
		<a href="/menu" class="link link-hover">Our Menu</a>
		<a href="/about" class="link link-hover">About Us</a>
		<a href="/contact" class="link link-hover">Contact</a>
		<a href="/careers" class="link link-hover">Careers</a>
	</nav>

	<nav>
		<header class="footer-title">Store Info</header>
		<div class="flex items-start gap-2">
			<MapPin class="mt-0.5 h-4 w-4 flex-shrink-0" />
			<span>123 Main Street<br />Jakarta, Indonesia</span>
		</div>
		<div class="flex items-center gap-2">
			<Phone class="h-4 w-4 flex-shrink-0" />
			<span>+62 21 1234 5678</span>
		</div>
		<div class="flex items-center gap-2">
			<Mail class="h-4 w-4 flex-shrink-0" />
			<span>hello@klimboys.com</span>
		</div>
	</nav>

	<nav>
		<header class="footer-title">Opening Hours</header>
		<div class="flex items-start gap-2">
			<Clock class="mt-0.5 h-4 w-4 flex-shrink-0" />
			<div>
				<p>Mon - Fri: 10:00 - 22:00</p>
				<p>Sat - Sun: 09:00 - 23:00</p>
			</div>
		</div>
		<div class="mt-4">
			<header class="footer-title">Follow Us</header>
			<div class="grid grid-flow-col gap-4">
				<a
					href="https://twitter.com"
					aria-label="Twitter"
					class="transition-colors hover:text-primary"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path
							d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
						/>
					</svg>
				</a>
				<a
					href="https://instagram.com"
					aria-label="Instagram"
					class="transition-colors hover:text-primary"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
						<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
						<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
					</svg>
				</a>
				<a
					href="https://facebook.com"
					aria-label="Facebook"
					class="transition-colors hover:text-primary"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
					</svg>
				</a>
			</div>
		</div>
	</nav>
</footer>

<div class="footer-center footer bg-base-300 p-4 text-base-content">
	<aside>
		<p>© {new Date().getFullYear()} Klimboys. All rights reserved.</p>
	</aside>
</div>
