<script lang="ts">
	import { Package, Search } from '@lucide/svelte';
	import { formatIdr } from '$lib/format';
	import type { PosProduct, PosProductListResponse, PosProductVariant } from '$lib/product';
	import { badgeStyles, cx, inputStyles, spinnerStyles } from '$lib/styles';

	interface Props {
		onSelect?: (product: PosProduct, variant?: PosProductVariant) => void;
		placeholder?: string;
		showVariants?: boolean;
		apiEndpoint?: string;
		label?: string;
	}

	interface SearchOption {
		product: PosProduct;
		variant?: PosProductVariant;
	}

	let {
		onSelect,
		placeholder = 'Search products...',
		showVariants = true,
		apiEndpoint = '/api/products',
		label = 'Search products'
	}: Props = $props();

	const instanceId = $props.id();
	const inputId = `${instanceId}-input`;
	const listboxId = `${instanceId}-listbox`;
	let searchQuery = $state('');
	let searchResults = $state<PosProduct[]>([]);
	let isSearching = $state(false);
	let showDropdown = $state(false);
	let hasSearched = $state(false);
	let searchError = $state('');
	let selectedIndex = $state(-1);
	let searchInput: HTMLInputElement;
	let debounceTimer: ReturnType<typeof setTimeout>;
	let activeSearchController: AbortController | null = null;
	let options = $derived.by<SearchOption[]>(() =>
		searchResults.flatMap((product) => {
			if (!showVariants) return [{ product }];
			return product.variants
				.filter((variant) => variant.stockQuantity > 0)
				.map((variant) => ({ product, variant }));
		})
	);
	let activeOptionId = $derived(
		selectedIndex >= 0 && selectedIndex < options.length
			? `${instanceId}-option-${selectedIndex}`
			: undefined
	);
	let resultNoun = $derived(showVariants ? 'product variants' : 'products');

	function cancelActiveSearch() {
		activeSearchController?.abort();
		activeSearchController = null;
		isSearching = false;
	}

	async function performSearch(query: string) {
		cancelActiveSearch();
		const controller = new AbortController();
		activeSearchController = controller;
		isSearching = true;
		hasSearched = false;
		searchError = '';
		showDropdown = true;

		try {
			const response = await fetch(
				`${apiEndpoint}?search=${encodeURIComponent(query.trim())}&limit=10&active=true&includeMeta=false`,
				{ signal: controller.signal }
			);
			if (!response.ok) throw new Error('Product search is temporarily unavailable.');
			const result = (await response.json()) as PosProductListResponse;
			if (controller.signal.aborted) return;

			searchResults = result.data?.products ?? [];
			selectedIndex = options.length > 0 ? 0 : -1;
			hasSearched = true;
		} catch (error) {
			if (controller.signal.aborted) return;
			searchResults = [];
			selectedIndex = -1;
			hasSearched = true;
			searchError =
				error instanceof Error ? error.message : 'Product search is temporarily unavailable.';
		} finally {
			if (activeSearchController === controller) {
				activeSearchController = null;
				isSearching = false;
			}
		}
	}

	function handleSearch(query: string) {
		clearTimeout(debounceTimer);
		cancelActiveSearch();
		searchError = '';
		hasSearched = false;
		selectedIndex = -1;

		if (query.trim().length < 2) {
			searchResults = [];
			showDropdown = false;
			return;
		}

		showDropdown = true;
		debounceTimer = setTimeout(() => void performSearch(query), 200);
	}

	function handleInput(event: Event) {
		searchQuery = event.currentTarget instanceof HTMLInputElement ? event.currentTarget.value : '';
		handleSearch(searchQuery);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			if (showDropdown) event.preventDefault();
			closeDropdown();
			return;
		}
		if (!showDropdown || options.length === 0) return;

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				selectedIndex = (selectedIndex + 1) % options.length;
				break;
			case 'ArrowUp':
				event.preventDefault();
				selectedIndex = selectedIndex <= 0 ? options.length - 1 : selectedIndex - 1;
				break;
			case 'Home':
				event.preventDefault();
				selectedIndex = 0;
				break;
			case 'End':
				event.preventDefault();
				selectedIndex = options.length - 1;
				break;
			case 'Enter':
				event.preventDefault();
				if (selectedIndex >= 0) selectOption(options[selectedIndex]);
				break;
			case 'Tab':
				closeDropdown();
				break;
		}
	}

	function selectOption(option: SearchOption) {
		onSelect?.(option.product, option.variant);
		searchQuery = '';
		closeDropdown();
		searchInput?.focus();
	}

	function closeDropdown() {
		clearTimeout(debounceTimer);
		cancelActiveSearch();
		showDropdown = false;
		selectedIndex = -1;
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target;
		if (target instanceof Node && !document.getElementById(instanceId)?.contains(target)) {
			closeDropdown();
		}
	}

	$effect(() => {
		window.addEventListener('click', handleClickOutside);
		return () => {
			window.removeEventListener('click', handleClickOutside);
			clearTimeout(debounceTimer);
			cancelActiveSearch();
		};
	});

	$effect(() => {
		if (!showDropdown || !activeOptionId) return;
		const frameId = window.requestAnimationFrame(() => {
			document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' });
		});
		return () => window.cancelAnimationFrame(frameId);
	});
</script>

<div id={instanceId} class="relative w-full">
	<label for={inputId} class="sr-only">{label}</label>
	<div class="relative">
		<input
			id={inputId}
			bind:this={searchInput}
			type="search"
			{placeholder}
			class={cx(inputStyles({ full: true }), 'pr-10')}
			value={searchQuery}
			autocomplete="off"
			spellcheck="false"
			role="combobox"
			aria-autocomplete="list"
			aria-expanded={showDropdown}
			aria-controls={listboxId}
			aria-activedescendant={activeOptionId}
			aria-busy={isSearching}
			oninput={handleInput}
			onkeydown={handleKeydown}
			onfocus={() => {
				if (searchQuery.trim().length >= 2) showDropdown = true;
			}}
		/>
		<span
			class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink/50"
			aria-hidden="true"
		>
			{#if isSearching}
				<span class={spinnerStyles('sm')}></span>
			{:else}
				<Search class="h-5 w-5" />
			{/if}
		</span>
	</div>

	<p class="sr-only" aria-live="polite">
		{isSearching
			? 'Searching products'
			: searchError
				? searchError
				: hasSearched
					? `${options.length} available ${resultNoun} found`
					: ''}
	</p>

	{#if showDropdown}
		<div
			id={listboxId}
			role="listbox"
			aria-label={`Available ${resultNoun}`}
			class="absolute top-full right-0 left-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-lg border border-surface-strong bg-surface shadow-xl"
		>
			{#if isSearching}
				<div
					class="p-4 text-center text-ink/60"
					role="option"
					aria-selected="false"
					aria-disabled="true"
				>
					Searching…
				</div>
			{:else if searchError}
				<div
					class="p-4 text-center text-danger"
					role="option"
					aria-selected="false"
					aria-disabled="true"
				>
					{searchError}
				</div>
			{:else if hasSearched && options.length === 0}
				<div
					class="p-4 text-center text-ink/60"
					role="option"
					aria-selected="false"
					aria-disabled="true"
				>
					No available products found for “{searchQuery}”.
				</div>
			{:else}
				{#each options as option, index (`${option.product.id}-${option.variant?.id ?? 'product'}`)}
					<button
						id={`${instanceId}-option-${index}`}
						type="button"
						role="option"
						aria-selected={index === selectedIndex}
						tabindex="-1"
						class={cx(
							'flex w-full items-center gap-3 border-b border-surface-muted p-3 text-left last:border-b-0 hover:bg-surface-muted',
							index === selectedIndex && 'bg-surface-muted'
						)}
						onpointerdown={(event) => event.preventDefault()}
						onclick={() => selectOption(option)}
						onmouseenter={() => (selectedIndex = index)}
					>
						<div class="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
							{#if option.product.imageUrl}
								<img
									src={option.product.imageUrl}
									alt=""
									width="48"
									height="48"
									class="h-full w-full object-cover"
								/>
							{:else}
								<Package class="m-auto mt-3 h-6 w-6 opacity-50" />
							{/if}
						</div>
						<span class="min-w-0 flex-1">
							<span class="block font-semibold">{option.product.name}</span>
							{#if option.variant}
								<span class="text-sm text-ink/60">
									Size {option.variant.size} · {formatIdr(option.variant.sellingPrice / 100)}
								</span>
							{:else if option.product.description}
								<span class="block truncate text-sm text-ink/60">{option.product.description}</span>
							{/if}
						</span>
						{#if option.variant && option.variant.stockQuantity < 10}
							<span class={badgeStyles('caution', 'xs')}>Low stock</span>
						{/if}
					</button>
				{/each}
			{/if}
		</div>
	{/if}
</div>
